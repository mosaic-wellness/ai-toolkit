#!/bin/bash
# Mosaic Buddy feedback submitter.
#
# Usage:
#   submit-feedback.sh <rating-int 1-4> "<title>" "<description>"
#
# Signs with the shared HMAC key (same scheme as telemetry.sh — not a secret,
# just keeps random sources from writing to the dashboard).
#
# Honours MOSAIC_BUDDY_TELEMETRY_URL=off — if telemetry is disabled,
# feedback submission is also disabled.

set -e

URL="${MOSAIC_BUDDY_TELEMETRY_URL:-https://beacon-telemetry-production.up.railway.app}"
HMAC_KEY="${MOSAIC_BUDDY_HMAC_KEY:-mb-telem-v1-2026}"

if [ "$URL" = "off" ] || [ -z "$URL" ]; then
  echo "feedback: telemetry URL is disabled (MOSAIC_BUDDY_TELEMETRY_URL=off). Not submitted." >&2
  exit 1
fi

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

EMAIL="$(git config user.email 2>/dev/null || echo unknown)"
DISPLAY=$(echo "$EMAIL" | cut -d@ -f1)
PROJECT="$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo unknown)"
TS=$(date +%s)

SIG=$(printf '%s%s%s%s' "$RATING" "$DISPLAY" "$PROJECT" "$TS" \
  | openssl dgst -sha256 -hmac "$HMAC_KEY" 2>/dev/null | awk '{print $NF}')

# Build JSON body with python3 (always present on macOS/Linux) so titles &
# descriptions with quotes, newlines, or unicode are encoded safely.
BODY=$(RATING="$RATING" TITLE="$TITLE" DESCRIPTION="$DESCRIPTION" \
  DISPLAY="$DISPLAY" PROJECT="$PROJECT" TS="$TS" SIG="$SIG" \
  python3 -c '
import os, json
print(json.dumps({
    "rating": int(os.environ["RATING"]),
    "title": os.environ["TITLE"],
    "description": os.environ["DESCRIPTION"],
    "user": os.environ["DISPLAY"],
    "project": os.environ["PROJECT"],
    "ts": int(os.environ["TS"]),
    "sig": os.environ["SIG"],
}))
')

HTTP=$(curl -sS -o /tmp/mb-feedback-response.$$ -w "%{http_code}" \
  -X POST -H "Content-Type: application/json" \
  --connect-timeout 5 --max-time 10 \
  --data "$BODY" \
  "${URL}/feedback") || HTTP="000"

if [ "$HTTP" = "200" ]; then
  rm -f /tmp/mb-feedback-response.$$
  echo "feedback: submitted (rating=$RATING, user=$DISPLAY, project=$PROJECT)"
  exit 0
else
  echo "feedback: submission failed (HTTP $HTTP)" >&2
  if [ -f /tmp/mb-feedback-response.$$ ]; then
    echo "feedback: server said: $(cat /tmp/mb-feedback-response.$$)" >&2
    rm -f /tmp/mb-feedback-response.$$
  fi
  exit 1
fi
