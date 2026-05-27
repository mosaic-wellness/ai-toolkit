---
name: bulk-operations
description: >
  Strategies for handling bulk page operations (auditing, comparing, batch-editing)
  without bloating context. Teaches when to use summary tools, bulk-fetch script,
  or direct MCP calls based on the volume and nature of the task. Auto-activates
  when the user's request involves more than 3 pages or uses words like "all",
  "every", "across", "audit", "bulk", or "batch".
---

# Bulk Operations Guide

When working with many pages (widget pages or PDPs), avoid fetching full configs into context. Use the right tool for the volume.

## Decision Tree

```
How many pages does this task touch?
│
├── 1-3 pages
│   └── Use MCP tools directly (get_widget_page_config, get_pdp_config)
│       Context cost: ~30KB per page — acceptable for small sets
│
├── 4-20 pages, need structure only
│   └── Use SUMMARY tools (get_widget_page_summary, get_pdp_summary)
│       Context cost: ~500 bytes per page
│       Covers: auditing widget types, comparing structures, finding pages with specific widgets
│
├── 4-20 pages, need full config data
│   └── Use bulk-fetch.sh → save to temp files → process with scripts
│       Context cost: ~200 bytes (manifest only)
│       The full configs live on disk, not in context
│
└── 20+ pages
    └── Use bulk-fetch.sh with CONCURRENCY=5
        Rate limit: 60 req/min sustained, so 20 pages takes ~4 seconds
        For 100+ pages, increase timeout and consider batching
```

## Summary Tools (Preferred for 4-20 pages)

Summary tools return just the widget structure — IDs, types, titles, display order — without full widgetData.

```
# Widget page summary (~500 bytes vs ~30KB)
get_widget_page_summary(identifier: "home", brand: "mm")

# PDP summary (~500 bytes vs ~20KB)
get_pdp_summary(page_name: "minoxidil-5.json", brand: "mm")
```

**Use summaries when you need to:**
- Audit what widget types are used across pages
- Compare page structures between brands
- Find pages that use a specific widget type
- Check display order across multiple pages
- Get an overview before deciding which pages need full edits

**Use full configs when you need to:**
- Read or modify actual widget content (text, images, links)
- Copy widget data between pages
- Validate specific field values

## Bulk-Fetch Script (For full configs without context bloat)

The `bulk-fetch.sh` script fetches multiple configs in parallel via direct HTTP to the MCP endpoint. Responses go to temp files — they never enter context.

### Location
```
${CLAUDE_PLUGIN_ROOT}/scripts/bulk-fetch.sh
```

### Usage
```bash
# Fetch widget page configs to temp files
bash ${CLAUDE_PLUGIN_ROOT}/scripts/bulk-fetch.sh \
  get_widget_page_config \
  temp/admin-bulk/{task-name}/ \
  brand=mm \
  -- home summer-sale category-hair monsoon-landing

# Fetch PDP configs
bash ${CLAUDE_PLUGIN_ROOT}/scripts/bulk-fetch.sh \
  get_pdp_config \
  temp/admin-bulk/{task-name}/ \
  brand=mm \
  -- minoxidil-5.json hair-oil.json biotin-tablets.json

# Fetch summaries (even lighter — use when you only need structure)
bash ${CLAUDE_PLUGIN_ROOT}/scripts/bulk-fetch.sh \
  get_widget_page_summary \
  temp/admin-bulk/{task-name}/ \
  brand=mm \
  -- home summer-sale category-hair
```

### How it works
1. Reads `.mcp.json` from the project root for URL + API key
2. Calls the MCP endpoint directly via `curl` (no MCP client needed)
3. Parses SSE responses with `grep` + `sed` + `jq`
4. Saves each config to `{output_dir}/{identifier}.json`
5. Failed fetches get `{identifier}.error` files
6. Outputs a small JSON manifest to stdout (this is what enters context)

### Environment options
- `CONCURRENCY=5` — Max parallel requests (default: 5, respects rate limits)
- `MCP_CONFIG=/path/to/.mcp.json` — Override config location
- `QUIET=1` — Suppress progress output

### Output
```json
{
  "tool": "get_widget_page_config",
  "output_dir": "temp/admin-bulk/audit/",
  "total": 25,
  "fetched": 24,
  "failed": 1,
  "files": ["temp/admin-bulk/audit/home.json", ...]
}
```

## Processing Pattern

After bulk-fetching, write task-specific processing scripts to analyze the files. Only the results enter context.

### Example: Find pages with missing hero images
```bash
for f in temp/admin-bulk/audit/*.json; do
  id=$(basename "$f" .json)
  has_hero=$(jq '[.config.widgetsData.widgetIDMapping | to_entries[] | select(.value.type == "BANNER")] | length' "$f" 2>/dev/null)
  if [ "$has_hero" = "0" ]; then
    echo "$id: NO BANNER widget"
  fi
done
```

### Example: List all widget types used across pages
```bash
for f in temp/admin-bulk/audit/*.json; do
  jq -r '[.config.widgetsData.widgetIDMapping | to_entries[].value.type] | unique[]' "$f" 2>/dev/null
done | sort | uniq -c | sort -rn
```

### Example: Find pages containing specific text
```bash
grep -rl "summer sale" temp/admin-bulk/audit/*.json | while read f; do
  echo "$(basename "$f" .json): contains 'summer sale'"
done
```

## Workflow: Bulk Edit

For batch edits across multiple pages:

1. **List pages** — `list_widget_pages(brand)` or `list_pdp_pages(brand)` (small response)
2. **Bulk-fetch** — Download all configs to temp files
3. **Analyze** — Write a processing script to identify which pages need changes
4. **Edit selectively** — Use MCP tools (`update_widget_page_section`, `update_pdp_section`) only for the pages that need changes. These are targeted writes — one per page.
5. **Verify** — Preview changed pages on staging

This pattern keeps context lean: list (1KB) + manifest (200B) + analysis results (small) + targeted MCP writes (only for affected pages).

## Cleanup

Temp files should be cleaned up after the task:
```bash
rm -rf temp/admin-bulk/{task-name}/
```
