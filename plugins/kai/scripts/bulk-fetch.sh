#!/usr/bin/env bash
#
# bulk-fetch.sh — Fetch multiple page configs from admin-mcp in parallel,
# saving each to a local JSON file. Reads connection details from .mcp.json.
#
# Usage:
#   bash bulk-fetch.sh <tool_name> <output_dir> [key=value ...] -- <id1> <id2> ...
#
# Examples:
#   # Fetch widget page configs
#   bash bulk-fetch.sh get_widget_page_config temp/admin-bulk/audit/ brand=mm -- home summer-sale category-hair
#
#   # Fetch PDP configs
#   bash bulk-fetch.sh get_pdp_config temp/admin-bulk/pdps/ brand=mm -- minoxidil-5.json hair-growth-kit.json
#
#   # Fetch summaries (lightweight)
#   bash bulk-fetch.sh get_widget_page_summary temp/admin-bulk/summaries/ brand=mm -- home summer-sale
#
# The identifier is passed as the first positional argument of the tool:
#   - get_widget_page_config / get_widget_page_summary → "identifier"
#   - get_pdp_config / get_pdp_summary → "page_name"
#
# Options (via environment):
#   CONCURRENCY=5        Max parallel requests (default: 5)
#   MCP_CONFIG=.mcp.json Path to .mcp.json (default: auto-detected from cwd upward)
#   QUIET=1              Suppress progress output

set -euo pipefail

# ── Args ──────────────────────────────────────────────────────────────

TOOL_NAME="${1:?Usage: bulk-fetch.sh <tool_name> <output_dir> [key=val ...] -- <id1> <id2> ...}"
OUTPUT_DIR="${2:?Missing output directory}"
shift 2

# Parse key=value args until we hit "--", then collect identifiers
EXTRA_KEYS=()
EXTRA_VALS=()
IDENTIFIERS=()
PAST_SEPARATOR=false

for arg in "$@"; do
  if [ "$arg" = "--" ]; then
    PAST_SEPARATOR=true
    continue
  fi
  if $PAST_SEPARATOR; then
    IDENTIFIERS+=("$arg")
  else
    EXTRA_KEYS+=("${arg%%=*}")
    EXTRA_VALS+=("${arg#*=}")
  fi
done

if [ ${#IDENTIFIERS[@]} -eq 0 ]; then
  echo "Error: No identifiers provided after '--'" >&2
  exit 1
fi

# ── Config ────────────────────────────────────────────────────────────

CONCURRENCY="${CONCURRENCY:-5}"
QUIET="${QUIET:-0}"

# Resolve the identifier parameter name based on tool
case "$TOOL_NAME" in
  get_widget_page_config|get_widget_page_summary)
    ID_PARAM="identifier"
    ;;
  get_pdp_config|get_pdp_summary)
    ID_PARAM="page_name"
    ;;
  *)
    ID_PARAM="identifier"
    echo "Warning: Unknown tool '$TOOL_NAME', assuming identifier param is 'identifier'" >&2
    ;;
esac

# ── Find .mcp.json ───────────────────────────────────────────────────

find_mcp_config() {
  local dir="${1:-$(pwd)}"
  while [ "$dir" != "/" ]; do
    if [ -f "$dir/.mcp.json" ]; then
      echo "$dir/.mcp.json"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

MCP_CONFIG="${MCP_CONFIG:-$(find_mcp_config || echo "")}"
if [ -z "$MCP_CONFIG" ] || [ ! -f "$MCP_CONFIG" ]; then
  echo "Error: Could not find .mcp.json. Set MCP_CONFIG env var or run from project root." >&2
  exit 1
fi

# Extract URL and API key
MCP_URL="$(jq -r '.mcpServers["admin-mcp"].url // empty' "$MCP_CONFIG")"
API_KEY="$(jq -r '.mcpServers["admin-mcp"].headers["x-api-key"] // empty' "$MCP_CONFIG")"

if [ -z "$MCP_URL" ]; then
  echo "Error: admin-mcp URL not found in $MCP_CONFIG" >&2
  exit 1
fi
if [ -z "$API_KEY" ]; then
  echo "Error: admin-mcp API key not found in $MCP_CONFIG" >&2
  exit 1
fi

# ── Setup ─────────────────────────────────────────────────────────────

mkdir -p "$OUTPUT_DIR"

# Build the extra arguments JSON fragment
EXTRA_JSON=""
for i in $(seq 0 $((${#EXTRA_KEYS[@]} - 1))); do
  EXTRA_JSON="${EXTRA_JSON},\"${EXTRA_KEYS[$i]}\":\"${EXTRA_VALS[$i]}\""
done

# ── Fetch function ────────────────────────────────────────────────────

fetch_one() {
  local id="$1"
  local safe_name
  safe_name="$(echo "$id" | sed 's/\.json//g; s/\//_/g')"
  local outfile="${OUTPUT_DIR}/${safe_name}.json"
  local errfile="${OUTPUT_DIR}/${safe_name}.error"

  local payload="{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"${TOOL_NAME}\",\"arguments\":{\"${ID_PARAM}\":\"${id}\"${EXTRA_JSON}}},\"id\":1}"

  local raw
  raw=$(curl -s --max-time 30 "$MCP_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -H "x-api-key: $API_KEY" \
    -d "$payload" 2>/dev/null \
    | grep "^data: " | sed "s/^data: //")

  if [ -z "$raw" ]; then
    echo "FAIL ${id} (no response)" >> "${OUTPUT_DIR}/_manifest.log"
    echo "No response from MCP server" > "$errfile"
    return 1
  fi

  local is_error
  is_error=$(echo "$raw" | jq -r '.result.isError // false' 2>/dev/null)

  if [ "$is_error" = "true" ]; then
    echo "$raw" | jq -r '.result.content[0].text // "Unknown error"' > "$errfile" 2>/dev/null
    echo "FAIL ${id}" >> "${OUTPUT_DIR}/_manifest.log"
    return 1
  fi

  echo "$raw" | jq -r '.result.content[0].text' > "$outfile" 2>/dev/null

  if [ ! -s "$outfile" ]; then
    echo "FAIL ${id} (empty)" >> "${OUTPUT_DIR}/_manifest.log"
    rm -f "$outfile"
    return 1
  fi

  local size
  size=$(wc -c < "$outfile" | tr -d ' ')
  echo "OK ${id} ${size}b" >> "${OUTPUT_DIR}/_manifest.log"
  [ "$QUIET" != "1" ] && echo "  OK ${id} (${size}b)" >&2
  return 0
}

# ── Main ──────────────────────────────────────────────────────────────

TOTAL=${#IDENTIFIERS[@]}
[ "$QUIET" != "1" ] && echo "Fetching ${TOTAL} configs via ${TOOL_NAME} (concurrency: ${CONCURRENCY})..." >&2

# Clear manifest
> "${OUTPUT_DIR}/_manifest.log"

# Run fetches in parallel with concurrency limit
RUNNING=0
PIDS=()
for id in "${IDENTIFIERS[@]}"; do
  fetch_one "$id" &
  PIDS+=($!)
  RUNNING=$((RUNNING + 1))

  if [ $RUNNING -ge $CONCURRENCY ]; then
    wait "${PIDS[0]}" 2>/dev/null || true
    PIDS=("${PIDS[@]:1}")
    RUNNING=$((RUNNING - 1))
  fi
done

# Wait for remaining
for pid in "${PIDS[@]}"; do
  wait "$pid" 2>/dev/null || true
done

# ── Summary ───────────────────────────────────────────────────────────

OK_COUNT=$(grep -c "^OK " "${OUTPUT_DIR}/_manifest.log" 2>/dev/null || echo "0")
FAIL_COUNT=$(grep -c "^FAIL " "${OUTPUT_DIR}/_manifest.log" 2>/dev/null || echo "0")

# Output manifest to stdout (this is what enters context)
FILES_JSON=$(ls -1 "${OUTPUT_DIR}"/*.json 2>/dev/null | jq -R . | jq -s . 2>/dev/null || echo "[]")
cat <<MANIFEST
{
  "tool": "${TOOL_NAME}",
  "output_dir": "${OUTPUT_DIR}",
  "total": ${TOTAL},
  "fetched": ${OK_COUNT},
  "failed": ${FAIL_COUNT},
  "files": ${FILES_JSON}
}
MANIFEST
