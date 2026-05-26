#!/bin/bash
# Kai feedback submitter.
#
# Usage:
#   submit-feedback.sh <rating-int 1-4> "<title>" "<description>"
#
# Signs with the shared HMAC key under the v2 formula:
#   sha256_hmac(KAI_HMAC_KEY, "kai" + "feedback_submitted" + user_local + ts)
#
# Honours KAI_TELEMETRY_URL=off — if telemetry is disabled, feedback is too.

set -e

URL="${KAI_TELEMETRY_URL:-https://beacon-telemetry-production.up.railway.app/v2/ingest}"
HMAC_KEY="${KAI_HMAC_KEY:-mb-telem-v1-2026}"

if [ "$URL" = "off" ] || [ -z "$URL" ]; then
  echo "feedback: telemetry URL is disabled (KAI_TELEMETRY_URL=off). Not submitted." >&2
  exit 1
fi

# Normalize: accept either a service base URL (https://host) or the full
# /v2/ingest endpoint. Strip trailing slash, drop a trailing /v2/ingest so we
# have a clean base, then derive both endpoints.
BASE="${URL%/}"
BASE="${BASE%/v2/ingest}"
INGEST_URL="${BASE}/v2/ingest"
FEEDBACK_URL="${BASE}/v2/feedback"

RATING="${1:-}"
TITLE="${2:-}"
DESCRIPTION="${3:-}"

if ! [[ "$RATING" =~ ^[1-4]$ ]]; then
  echo "feedback: rating must be an integer 1-4 (got: '$RATING')" >&2
  exit 1
fi
if [ -z "$TITLE" ] || [ -z "$DESCRIPTION" ]; then
  echo "feedback: title and description are required" >&2
  exit 1
fi

EMAIL="$(git config user.email 2>/dev/null || true)"
USER_LOCAL="$(echo "$EMAIL" | cut -d@ -f1)"
[ -z "$USER_LOCAL" ] && USER_LOCAL="unknown"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -n "$REPO_ROOT" ]; then
  PROJECT="$(basename "$REPO_ROOT")"
else
  PROJECT="$(basename "$PWD")"
fi
[ -z "$PROJECT" ] && PROJECT="unknown"

PLUGIN_VERSION=""
PJ="${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"
if [ -f "$PJ" ] && command -v jq >/dev/null 2>&1; then
  PLUGIN_VERSION="$(jq -r '.version // empty' "$PJ")"
fi

TS=$(date +%s)

SIG=$(printf '%s%s%s%s' "kai" "feedback_submitted" "$USER_LOCAL" "$TS" \
  | openssl dgst -sha256 -hmac "$HMAC_KEY" 2>/dev/null | awk '{print $NF}')

BODY=$(RATING="$RATING" TITLE="$TITLE" DESCRIPTION="$DESCRIPTION" \
  USER_LOCAL="$USER_LOCAL" PROJECT="$PROJECT" TS="$TS" SIG="$SIG" \
  PLUGIN_VERSION="$PLUGIN_VERSION" \
  python3 -c '
import os, json
print(json.dumps({
    "rating": int(os.environ["RATING"]),
    "title": os.environ["TITLE"],
    "description": os.environ["DESCRIPTION"],
    "user_local": os.environ["USER_LOCAL"],
    "project": os.environ["PROJECT"],
    "plugin_version": os.environ["PLUGIN_VERSION"] or None,
    "ts": int(os.environ["TS"]),
    "sig": os.environ["SIG"],
}))
')

HTTP=$(curl -sS -o /tmp/kai-feedback-response.$$ -w "%{http_code}" \
  -X POST -H "Content-Type: application/json" \
  --connect-timeout 5 --max-time 10 \
  --data "$BODY" \
  "$FEEDBACK_URL") || HTTP="000"

if [ "$HTTP" = "200" ] || [ "$HTTP" = "204" ]; then
  rm -f /tmp/kai-feedback-response.$$
  echo "feedback: submitted (rating=$RATING, user=$USER_LOCAL, project=$PROJECT)"

  # Also emit a feedback_submitted event to the unified event stream so the
  # dashboard's Commands/Recent panels see feedback alongside everything else.
  # Body & sig follow the /v2/ingest contract: sig over plugin+event_type+user_local+ts.
  EVENT_SIG=$(printf '%s%s%s%s' "kai" "feedback_submitted" "$USER_LOCAL" "$TS" \
    | openssl dgst -sha256 -hmac "$HMAC_KEY" 2>/dev/null | awk '{print $NF}')
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  EVENT_BODY=$(RATING="$RATING" USER_LOCAL="$USER_LOCAL" PROJECT="$PROJECT" \
    TS="$TS" SIG="$EVENT_SIG" PLUGIN_VERSION="$PLUGIN_VERSION" OS="$OS" \
    python3 -c '
import os, json
print(json.dumps({
    "plugin": "kai",
    "plugin_version": os.environ["PLUGIN_VERSION"] or None,
    "event_type": "feedback_submitted",
    "command": "kai",
    "subcommand": "feedback",
    "user_local": os.environ["USER_LOCAL"],
    "project": os.environ["PROJECT"],
    "os": os.environ["OS"],
    "ts": int(os.environ["TS"]),
    "sig": os.environ["SIG"],
    "metadata": {"rating": int(os.environ["RATING"])},
}))
')
  curl -s -o /dev/null -X POST -H "Content-Type: application/json" \
    --connect-timeout 2 --max-time 3 \
    --data "$EVENT_BODY" \
    "$INGEST_URL" >/dev/null 2>&1 || true

  exit 0
else
  echo "feedback: submission failed (HTTP $HTTP)" >&2
  if [ -f /tmp/kai-feedback-response.$$ ]; then
    echo "feedback: server said: $(cat /tmp/kai-feedback-response.$$)" >&2
    rm -f /tmp/kai-feedback-response.$$
  fi
  exit 1
fi
