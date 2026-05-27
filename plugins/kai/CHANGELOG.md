# Changelog

All notable changes to the `kai` Claude Code plugin.

## 1.2.0

### Added

- **admin-mcp wired as the 5th MCP server.** `.mcp.json` now references
  `${ADMIN_MCP_API_KEY}` against `https://stg-admin-mcp.mosaicwellness.in/mcp`.
  Staging-only by design; production publishing goes through the admin
  dashboard UI.
- **mosaic-admin plugin folded into kai.** The retired plugin's three agents
  (`page-editor`, `page-builder`, `experiment-manager`), two skills
  (`admin-essentials`, `bulk-operations`), nine references
  (`tool-reference.md`, `route-reference.md`, `brand-bucket-reference.md`,
  `widget-type-catalog.md`, `error-handling.md`, `workflow-patterns.md`,
  `experiment-lifecycle.md`, `pdp-transformation-pipeline.md`,
  `display-order-guide.md`, all now under `references/admin/`),
  PreToolUse hook, and `scripts/bulk-fetch.sh` script all moved into kai.
  All agents now have `ToolSearch` in their tool list so they can fetch
  admin-mcp deferred-tool schemas at runtime.
- **New `habit-author` agent** for the ENG-4854 `habit_*` MCP tool surface.
  Drives the 15-recipe workflow library (R1 browse → R15 audit-brand) with
  built-in safety preflights: staging-only guard, 7-brand validation
  (mm/bw/lj/lj-ae/mm-ae/wn-in/as-in), advisory-lock TTL, no-delete rule,
  and duplicate-only task-creation pattern.
- **New `habit-essentials` skill.** Auto-activates whenever admin-mcp
  `habit_*` tools are used or the user mentions habit trackers, habit
  tasks, mappings, user assignments, or audits. Brand-ID map, schema
  crash-course, staging guardrail, no-delete rule, pagination etiquette.
- **New `habit-workflows` skill.** Auto-activates on habit work; ports
  the 15 recipes verbatim as a recipe library the agent reads at run time.
- **New habit references** at `references/admin/habit-tool-reference.md`
  (all ~24 `habit_*` tools, grouped by write/read/knowledge/lock) and
  `references/admin/habit-schema.md` (the 23-field `data` reference plus
  enums and `inputConfig` variants).
- **`/kai admin` route.** Classifies the user's intent and spawns the right
  specialist (`page-editor` / `page-builder` / `experiment-manager`), or
  presents the 4-option menu when args are empty.
- **`/kai habit` route.** Spawns the `habit-author` agent, passing any
  remaining arg text as context.
- **`tools-init` wizard now provisions `ADMIN_MCP_API_KEY`.** New per-tool
  flow with `amk_` format check, live `tools/list` JSON-RPC probe against
  `https://stg-admin-mcp.mosaicwellness.in/mcp`, telemetry beacons, and
  quickstart prompts. `validate` / `rotate` / `remove` all accept
  `admin-mcp` as a target.
- **PreToolUse hook for admin-mcp writes.** Brand-validates every PDP /
  widget / experiment write against the 18-brand storefront set, and every
  `habit_*` write against the 7-brand habit set. Suggests `acquire_*_lock`
  when a multi-step write lacks a `lockToken`.

### Changed

- **`/kai migrate` now also detects the retired `mosaic-admin` plugin.**
  Surfaces the `/mosaic-admin → /kai admin` command mapping and tells
  the user how to `/plugin uninstall mosaic-admin`.
- **Plugin description** updated to mention admin-mcp, page configs, and
  habit trackers. Added `admin-mcp`, `pdp`, `habit` to keywords.

### Removed

- **`mosaic-admin` plugin removed from marketplace.** Existing installs
  keep working until the user runs `/plugin uninstall mosaic-admin`.
  The plugin folder is preserved in the ai-toolkit repo for historical
  reference; only the marketplace entry is gone. `/kai migrate` walks
  users through the switch.
