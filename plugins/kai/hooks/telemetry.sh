#!/bin/bash
# Kai telemetry — fires on SubagentStart and UserPromptSubmit.
#
# SubagentStart: logs when a kai agent actually executes (doctor, reviewer, etc.)
# UserPromptSubmit: logs inline commands (help, menu, recommendations) that don't spawn agents.
#
# Sends: command name, source (agent|prompt), display name (not email), repo name.
# Sends nothing else. Opt out: export KAI_TELEMETRY_URL=off

URL="${KAI_TELEMETRY_URL:-https://beacon-telemetry-production.up.railway.app}"
# Shared signing key — not a secret, just prevents unsigned writes from random sources.
# Override: export KAI_HMAC_KEY=your-key
HMAC_KEY="${KAI_HMAC_KEY:-mb-telem-v1-2026}"

if [ "$URL" = "off" ] || [ -z "$URL" ]; then
  exit 0
fi

# Read JSON from stdin
INPUT=$(cat)

# Extract hook event name
if command -v jq >/dev/null 2>&1; then
  EVENT=$(echo "$INPUT" | jq -r '.hook_event_name // empty')
else
  EVENT=$(echo "$INPUT" | grep -o '"hook_event_name":"[^"]*"' | sed 's/.*":"//;s/"$//')
fi

COMMAND=""
SOURCE=""

if [ "$EVENT" = "SubagentStart" ]; then
  # Agent execution — agent_type is the agent name (doctor, reviewer, etc.)
  if command -v jq >/dev/null 2>&1; then
    COMMAND=$(echo "$INPUT" | jq -r '.agent_type // empty')
  else
    COMMAND=$(echo "$INPUT" | grep -o '"agent_type":"[^"]*"' | sed 's/.*":"//;s/"$//')
  fi
  SOURCE="agent"

elif [ "$EVENT" = "UserPromptSubmit" ]; then
  # The plugin system expands /kai into the full command router prompt.
  # The raw user input appears after "The user's input:" in the expanded prompt.
  if command -v jq >/dev/null 2>&1; then
    PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')
  else
    PROMPT=$(echo "$INPUT" | grep -o '"prompt":"[^"]*"' | sed 's/.*":"//;s/"$//')
  fi

  # Only proceed if this is a kai command (expanded prompt contains the router header)
  case "$PROMPT" in
    *"Kai — Command Router"*) ;;
    *) exit 0 ;;
  esac

  # Extract the user's input from the expanded prompt (appears after "The user's input:")
  USER_INPUT=$(echo "$PROMPT" | grep -o "The user's input: .*" | sed "s/The user's input: //" | head -1)
  COMMAND=$(echo "$USER_INPUT" | awk '{print tolower($1)}' | tr -cd 'a-z0-9-')

  # Skip if this is an agent command (including aliases) — SubagentStart will handle it
  case "$COMMAND" in
    doctor|health|check|diagnose) exit 0 ;;
    review|scan) exit 0 ;;
    review-stack|stack) exit 0 ;;
    ux) exit 0 ;;
    brainstorm|plan|idea) exit 0 ;;
    grillme|grill|roast) exit 0 ;;
    document|doc|docs|write) exit 0 ;;
    debug|fix|error|broken|troubleshoot) exit 0 ;;
    5x|coach|insights) exit 0 ;;
    10x) exit 0 ;;
  esac

  SOURCE="prompt"
else
  exit 0
fi

# Send display name (local part of email) instead of full email
EMAIL="$(git config user.email 2>/dev/null || echo unknown)"
DISPLAY=$(echo "$EMAIL" | cut -d@ -f1)
PROJECT="$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo unknown)"

# HMAC signature: prevents unsigned writes
TS=$(date +%s)
SIG=$(printf '%s%s%s%s' "${COMMAND:-menu}" "$DISPLAY" "$PROJECT" "$TS" | openssl dgst -sha256 -hmac "$HMAC_KEY" 2>/dev/null | awk '{print $NF}')

curl -s -o /dev/null "${URL}/t?c=${COMMAND:-menu}&d=${DISPLAY}&p=${PROJECT}&s=${SOURCE}&ts=${TS}&sig=${SIG}" \
  --connect-timeout 2 --max-time 3

exit 0
