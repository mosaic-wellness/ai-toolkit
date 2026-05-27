#!/bin/bash
# Blocks Meta Ads MCP write/mutation tools.
#
# The mosaic-meta-ads skill is strictly read-only — see
# plugins/kai/skills/mosaic-meta-ads/references/read-only-tools.md
# for the full allow/block list.
#
# Exit 0 = allow, Exit 2 = block (stderr surfaced to the model).

payload=$(cat)

# Extract tool_name from the PreToolUse JSON payload. python3 is on every
# Mac/Linux that Claude Code targets; this avoids depending on jq.
tool_name=$(python3 -c "
import json, sys
try:
    data = json.loads(sys.argv[1] or '{}')
    print(data.get('tool_name', ''))
except Exception:
    print('')
" "$payload" 2>/dev/null)

if [ -z "$tool_name" ]; then
  # Couldn't parse — fail open. The hook's job is to block known-bad,
  # not to gate every tool call on JSON-parse success.
  exit 0
fi

# Block pattern: Meta Ads MCP create / update / activate tools.
# Tool naming convention: mcp__<server>__<tool>. The Claude Desktop
# custom connector for Meta registers as mcp__claude_ai_Meta__ads_*
# today; if Meta ships under a different server slug, the pattern
# below covers the substring "Meta" + "ads_" + write verb regardless.
case "$tool_name" in
  *Meta*ads_create_*|\
  *Meta*ads_update_*|\
  *Meta*ads_activate_*|\
  *Meta*ads_catalog_create*|\
  *meta*ads_create_*|\
  *meta*ads_update_*|\
  *meta*ads_activate_*|\
  *meta*ads_catalog_create*)
    echo "BLOCKED: \`$tool_name\` is a Meta Ads write/mutation tool." >&2
    echo "" >&2
    echo "kai is read-only for Meta Ads by design — too easy to spend real" >&2
    echo "money by mistake. To make changes to live ads, use Meta Ads Manager" >&2
    echo "(business.facebook.com) or your media buyer." >&2
    echo "" >&2
    echo "kai can still pull any read-only data you need to make the change" >&2
    echo "with confidence. See:" >&2
    echo "  \${CLAUDE_PLUGIN_ROOT}/skills/mosaic-meta-ads/references/read-only-tools.md" >&2
    exit 2
    ;;
esac

# ads_update_custom_audience_users is also a write but doesn't match
# the verb-position pattern above — catch it explicitly.
case "$tool_name" in
  *ads_update_custom_audience_users*)
    echo "BLOCKED: \`$tool_name\` writes to a custom audience (PII)." >&2
    echo "kai will not modify custom-audience membership. Use Ads Manager." >&2
    exit 2
    ;;
esac

exit 0
