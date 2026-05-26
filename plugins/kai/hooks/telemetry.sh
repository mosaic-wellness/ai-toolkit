#!/bin/bash
# Kai telemetry — fires on SessionStart, UserPromptSubmit, SubagentStart.
#
# Emits POST /v2/ingest with JSON body to the beacon-telemetry v2 backend.
#
#   SessionStart      → event_type=session_start
#   UserPromptSubmit  → event_type=command_invoked (only when prompt is the kai router)
#   SubagentStart     → event_type=agent_spawned
#
# Sends nothing else. Opt out: export KAI_TELEMETRY_URL=off

URL="${KAI_TELEMETRY_URL:-https://beacon-telemetry-production.up.railway.app/v2/ingest}"
# Shared signing key — not a secret, just prevents unsigned writes from random sources.
# Override: export KAI_HMAC_KEY=your-key
HMAC_KEY="${KAI_HMAC_KEY:-mb-telem-v1-2026}"

if [ "$URL" = "off" ] || [ -z "$URL" ]; then
  exit 0
fi

# Read JSON from stdin
INPUT=$(cat)

# Helpers --------------------------------------------------------------

json_get() {
  # $1 = key. Reads from $INPUT. jq if available, else grep/sed fallback.
  local key="$1"
  if command -v jq >/dev/null 2>&1; then
    echo "$INPUT" | jq -r --arg k "$key" '.[$k] // empty' 2>/dev/null
  else
    echo "$INPUT" | grep -o "\"${key}\":\"[^\"]*\"" | sed "s/.*\":\"//;s/\"$//" | head -1
  fi
}

read_plugin_meta() {
  # Reads name + version from ${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json
  local pj="${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"
  PLUGIN_NAME="kai"
  PLUGIN_VERSION=""
  if [ -f "$pj" ]; then
    if command -v jq >/dev/null 2>&1; then
      local n v
      n=$(jq -r '.name // empty' "$pj" 2>/dev/null)
      v=$(jq -r '.version // empty' "$pj" 2>/dev/null)
      [ -n "$n" ] && PLUGIN_NAME="$n"
      [ -n "$v" ] && PLUGIN_VERSION="$v"
    else
      local n v
      n=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$pj" | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"//;s/"$//')
      v=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$pj" | head -1 | sed 's/.*"version"[[:space:]]*:[[:space:]]*"//;s/"$//')
      [ -n "$n" ] && PLUGIN_NAME="$n"
      [ -n "$v" ] && PLUGIN_VERSION="$v"
    fi
  fi
}

json_escape() {
  # Escape a string for inclusion in a JSON string literal.
  # Handles: backslash, double-quote, control chars (newline/tab/cr).
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$1" | jq -Rs . | sed 's/^"//;s/"$//'
  else
    printf '%s' "$1" \
      | sed -e 's/\\/\\\\/g' \
            -e 's/"/\\"/g' \
            -e ':a;N;$!ba;s/\n/\\n/g' \
            -e 's/\r/\\r/g' \
            -e 's/\t/\\t/g'
  fi
}

# Determine event ------------------------------------------------------

EVENT=$(json_get hook_event_name)
SESSION_ID=$(json_get session_id)

EVENT_TYPE=""
COMMAND_FIELD=""
SUBCOMMAND=""

case "$EVENT" in
  SessionStart)
    EVENT_TYPE="session_start"
    COMMAND_FIELD=""
    SUBCOMMAND=""
    ;;
  SubagentStart)
    AGENT_TYPE=$(json_get agent_type)
    [ -z "$AGENT_TYPE" ] && exit 0
    EVENT_TYPE="agent_spawned"
    COMMAND_FIELD="kai"
    SUBCOMMAND="$AGENT_TYPE"
    ;;
  UserPromptSubmit)
    PROMPT=$(json_get prompt)
    # Only proceed if this is the kai command router (new v2 heading)
    case "$PROMPT" in
      *"# Kai — Command Router"*) ;;
      *) exit 0 ;;
    esac

    USER_INPUT=$(printf '%s' "$PROMPT" | grep -o "The user's input: .*" | sed "s/The user's input: //" | head -1)
    # First token, lowercased, [a-z0-9.-] only — keeps dot for nested subcommand paths
    FIRST=$(printf '%s' "$USER_INPUT" | awk '{print tolower($1)}' | tr -cd 'a-z0-9.-')

    # Emit command_invoked for every /kai dispatch — agent-invoking ones
    # too, so the Commands dashboard sees them. SubagentStart fires its own
    # separate agent_spawned event for execution-side tracking.
    EVENT_TYPE="command_invoked"
    COMMAND_FIELD="kai"
    # For bare `/kai`, subcommand is empty string per spec.
    SUBCOMMAND="$FIRST"
    ;;
  *)
    exit 0
    ;;
esac

# Identity / context ---------------------------------------------------

read_plugin_meta

EMAIL="$(git config user.email 2>/dev/null || echo unknown)"
USER_LOCAL=$(echo "$EMAIL" | cut -d@ -f1)
PROJECT="$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo unknown)"
OS_NAME=$(uname -s 2>/dev/null | tr '[:upper:]' '[:lower:]')
TS=$(date +%s)

# HMAC: sha256_hmac(KAI_HMAC_KEY, plugin + event_type + user_local + ts)
SIG=$(printf '%s%s%s%s' "$PLUGIN_NAME" "$EVENT_TYPE" "$USER_LOCAL" "$TS" \
  | openssl dgst -sha256 -hmac "$HMAC_KEY" 2>/dev/null | awk '{print $NF}')

# Build JSON body ------------------------------------------------------

PLUGIN_J=$(json_escape "$PLUGIN_NAME")
PLUGIN_VER_J=$(json_escape "$PLUGIN_VERSION")
EVENT_TYPE_J=$(json_escape "$EVENT_TYPE")
COMMAND_J=$(json_escape "$COMMAND_FIELD")
SUBCOMMAND_J=$(json_escape "$SUBCOMMAND")
USER_LOCAL_J=$(json_escape "$USER_LOCAL")
PROJECT_J=$(json_escape "$PROJECT")
SESSION_ID_J=$(json_escape "$SESSION_ID")
OS_J=$(json_escape "$OS_NAME")
SIG_J=$(json_escape "$SIG")

# `command` is null for session_start per spec, otherwise the literal string.
if [ -z "$COMMAND_FIELD" ]; then
  COMMAND_RENDERED="null"
else
  COMMAND_RENDERED="\"${COMMAND_J}\""
fi

BODY=$(cat <<EOF
{"plugin":"${PLUGIN_J}","plugin_version":"${PLUGIN_VER_J}","event_type":"${EVENT_TYPE_J}","command":${COMMAND_RENDERED},"subcommand":"${SUBCOMMAND_J}","user_local":"${USER_LOCAL_J}","project":"${PROJECT_J}","session_id":"${SESSION_ID_J}","os":"${OS_J}","ts":${TS},"sig":"${SIG_J}","metadata":{}}
EOF
)

# Fire and forget. Fail silently. 3s budget.
curl -s -o /dev/null \
  -X POST \
  -H 'Content-Type: application/json' \
  -d "$BODY" \
  "$URL" \
  --connect-timeout 2 --max-time 3 >/dev/null 2>&1 || true

exit 0
