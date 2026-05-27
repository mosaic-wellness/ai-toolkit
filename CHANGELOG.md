# Changelog

All notable version changes to plugins in this repository.

## [kai@1.5.1] - 2026-05-27
- Fix `tools-init` falsely reporting `firebase-mcp` as "missing" when the user has authenticated but doesn't have `firebase-tools` globally installed. Detection now checks `~/.config/configstore/firebase-tools.json` for a refresh token instead of `command -v firebase`. The plugin's `.mcp.json` ships `npx -y firebase-tools@latest mcp`, so a global install was never required — only auth was.
- Update Firebase setup flow + reference to use `npx -y firebase-tools@latest login` as the default, with `firebase login` shown as the shortcut for users who already have the CLI globally. Same auth file, same OAuth flow, no PATH pollution.


## [kai@1.5.0] - 2026-05-27
- **Breaking: standardized MCP server names to `<service>-mcp` convention.** `mosaic-mixpanel` → `mixpanel-mcp`, `mosaic-firebase` → `firebase-mcp`, `mosaic-newrelic` → `newrelic-mcp`. `kai-mcp` and `admin-mcp` were already aligned; `mosaic-meta-ads` is unchanged (skill-only, not an MCP).
- Renamed corresponding skill folders to match: `skills/mosaic-mixpanel/` → `skills/mixpanel-mcp/`, `skills/mosaic-firebase/` → `skills/firebase-mcp/`, `skills/mosaic-newrelic/` → `skills/newrelic-mcp/`. Skill IDs you type change accordingly (e.g. `kai:mosaic-mixpanel` → `kai:mixpanel-mcp`).
- Updated `.mcp.json`, README, CLAUDE.md, tools-init wizard table, and all skill cross-references to use the new names. tools-init still accepts `newrelic` as a legacy alternative name when detecting an existing user-level entry, so teammates who hand-rolled a `newrelic` server keep working.
- **Action required for installed users:** `/plugin update kai` then `/reload-plugins`. MCP tool names rendered to Claude change (e.g. `mcp__mosaic-mixpanel__*` → `mcp__mixpanel-mcp__*`), but no manual config edits are needed — the plugin ships the new entries.


## [kai@1.4.1] - 2026-05-27
- `tools-init` self-heals the `MCP server "admin-mcp" skipped — same command/URL as already-configured "admin-mcp"` reload error that users upgrading from 1.2.0 / 1.3.0 hit. Claude Code doesn't clean up old plugin-version cache dirs on upgrade, so the stale `.mcp.json` keeps shipping an `admin-mcp` entry that collides with the literal Zeus key the user has already inlined in `~/.claude.json`. Step 1 of the wizard now scans `~/.claude/plugins/cache/mosaic-wellness/kai/` and renames any older version dir that still contains an `admin-mcp` or `mosaic-newrelic` entry to `_stale-<version>`. Rename (not delete) so the action is reversible. Idempotent — re-runs are safe.


## [kai@1.4.0] - 2026-05-27
- **Architectural fix for "Missing environment variables" + "skipped — same command/URL" errors.** The plugin no longer ships `mosaic-newrelic` or `admin-mcp` entries in its own `.mcp.json`. Both were `${VAR}`-based, which caused Claude Code to flag them at startup whenever the env vars weren't set, and caused permanent dedup conflicts for users with a literal `amk_…` already inlined in `~/.claude.json`.
- `tools-init` New Relic flow now writes the MCP entry directly into `~/.claude.json` `mcpServers["mosaic-newrelic"]` with the literal `NRAK-…` key in `headers["api-key"]` — no `tokens.env`, no shell-hook indirection. Uses `jq --arg` so the key never appears on a command line and the leaked-keys PostToolUse hook never sees it. Backs up `~/.claude.json` before writing; restores on failure.
- `tools-init` admin-mcp flow same — writes literal `amk_…` into `~/.claude.json` `mcpServers["admin-mcp"]` `headers["x-api-key"]`. Existing inlined entries detected in Step 1 short-circuit the flow.
- Plugin `.mcp.json` now only ships zero-credential MCPs: `mosaic-mixpanel` (OAuth via `mcp-remote`), `mosaic-firebase` (CLI auth), `kai-mcp` (public HTTP). Clean install no longer surfaces env-var validation errors.
- `~/.config/kai/tokens.env` + shell-hook flow is retained as an opt-in fallback for env-var-based setups and one-time migration from `mosaic-buddy`. Steps 4 and 5 of the wizard are marked accordingly.


## [kai-dev@1.0.1] - 2026-05-27
- Fix `block-destructive-git.sh` PreToolUse hook path. `hooks.json`, `agents/architect.md`, and `agents/builder.md` referenced `scripts/block-destructive-git.sh` as a relative path, which failed (`No such file or directory`) whenever the agent's cwd wasn't the plugin root. Now uses `bash ${CLAUDE_PLUGIN_ROOT}/scripts/block-destructive-git.sh` to match the convention used by every other hook in this repo.


## [kai@1.3.0] - 2026-05-27
- `tools-init` detection broadened. Step 1 now scans **four** sources before declaring a tool "missing": `~/.config/kai/tokens.env`, current shell env, user-level `~/.claude.json` (top-level `mcpServers` **and** per-project entries), and the plugin's own `.mcp.json`. A literal `amk_…` inlined in `~/.claude.json` headers, or a resolved `${VAR}` reference, now counts as ✓. Status table grew a "Source" column so users can see where each credential was found.
- `tools-init` Mixpanel flow rewritten. Mixpanel auth happens via OAuth in `mcp-remote`, not via `MIXPANEL_SERVICE_ACCOUNT_TOKEN`. The wizard no longer prompts for a Service Account token, no longer probes `/api/app/me`, and no longer writes a `tokens.env` line. It just confirms the MCP entry exists and explains that the browser will pop on the first MCP call after a Claude Code restart.
- `tools-init` admin-mcp short-circuit. If `~/.claude.json` already has an `admin-mcp` entry with a literal `amk_…` in `headers.x-api-key` that probes 200, the wizard reports it as ✓ and skips the paste prompt entirely. Only falls through to paste when no key is found OR the inlined key fails the probe.
- Drop dead `MIXPANEL_SERVICE_ACCOUNT_TOKEN` env reference from `mosaic-mixpanel` entry in plugin `.mcp.json`. `mcp-remote` never consumed it.


## [kai@1.1.0] - 2026-05-27
- New `mosaic-meta-ads` skill — read-only Meta / Facebook / Instagram Ads coverage for Mosaic brands. Bakes in the org map (3 business managers, ~14 ad accounts across MM, LJ, AS-IN, BBW ×4, OTC, Little Gem, MWL UAE, BBW UAE, LJ UAE, LJ KSA; INR vs AED currency split; live `is_ads_mcp_enabled` flags). Ships three references — `setup.md` (Claude Desktop custom-connector flow — Meta MCP does NOT work via `.mcp.json`, OAuth requires the browser flow bound to a Claude account), `org-context.md` (authoritative brand → ad_account_id table, cross-platform brand-code translations to Mixpanel/Kai/Firebase), `read-only-tools.md` (full allow/block catalogue)
- New `block-meta-writes.sh` PreToolUse hook hard-blocks every Meta write tool — `ads_create_*`, `ads_update_*`, `ads_activate_entity`, `ads_catalog_create*`, `ads_update_custom_audience_users`. Exit-2 with a guidance message routing the user to Ads Manager. Defense in depth: a regex matcher in `hooks.json` narrows tool dispatch, the script re-validates `tool_name` from the JSON payload, and the policy is documented in the skill body so refusals read consistently across the surface
- Skill cross-references existing siblings — `mosaic-mixpanel` for funnel analysis, `mosaic-newrelic` for site-side issues, `kai-mcp` for orders/CS — so cross-platform "why did sales drop yesterday" questions get routed across Meta + funnel + ops in parallel rather than concluding from Meta alone


## [kai@1.0.0] - 2026-05-26
- **New plugin** — successor to `mosaic-buddy`. Inherits all of mosaic-buddy 3.7.0's content (10 agents, 8 skills, hooks, conventions, references) and adds Mosaic-wide MCP wiring plus an interactive setup wizard. Slash command moves from `/mosaic-buddy` to `/kai`. `mosaic-buddy` is marked deprecated in the marketplace; teams should uninstall it and install `kai`
- Ships `.mcp.json` declaring `mosaic-mixpanel`, `mosaic-firebase`, `kai-mcp`, and `mosaic-newrelic` with `${VAR}` env-var references — MCPs auto-register on plugin install and silently fail until `tools-init` provisions tokens
- New `tools-init` skill + subcommand: interactive wizard that wires Mixpanel, Firebase, and New Relic MCP servers for each team member. Walks through token acquisition (click-by-click vendor steps + one-click `open` to the right page), validates each token by live probe, and writes credentials durably to `~/.config/kai/tokens.env`. Plugin updates never overwrite the tokens file. Subcommands: `setup` (interactive), `status`, `validate`, `mixpanel`/`firebase`/`newrelic` (per-tool), `rotate <tool>`, `remove <tool>`
- **Auto-migration from mosaic-buddy**: first `tools-init` run copies `~/.config/mosaic-buddy/tokens.env` → `~/.config/kai/tokens.env` if present. Legacy file is left in place so an existing mosaic-buddy install keeps working during the deprecation window
- New skills with baked-in Mosaic Wellness org context: `mosaic-mixpanel` (brand→project resolver via Mixpanel org Business Context, prod-default rule, geo expansion handling for IN/AE/KSA/US, all 22 lexicon flows, ships co-located `scripts/lexicon-query.py` — stdlib-only Python tool with auto-path-resolution + 7 query modes including `resolve-event` heuristic to map freeform user phrases to canonical event names — so Claude can answer "what's the canonical Add to Cart event for LJ?" without loading the 10MB lexicon JSON into context), `mosaic-firebase` (brand→Firebase project map for all 8 prod projects, iOS+Android+Web breakdown per project, gotchas: misleading `man-matters-android` name, OWN's non-`mosaicwellness.*` bundle prefix, DocHub iOS duplicate bundles, LJ-AE staging typo, `middle-east` is LJ-AE-only not shared MENA), `mosaic-newrelic` (entity map for middleware/service-Prod entities, log message schema with `rid`/`nrtid`/`b` fields, Kai-vs-direct-NR routing matrix), `kai-mcp` (8-category routing for the Kai orchestrator MCP — cx/engineering/analytics/pdp/knowledge/voicecalls/absolute_science_booking/math, 104 total tools; encodes the mandatory `list_tools` → `use_tool` call sequence, brand-code mapping MM/MW/BW/LJ/AS-IN, and the "always ask brand if unspecified" rule)
- Each tool skill (`mosaic-mixpanel`, `mosaic-firebase`, `mosaic-newrelic`, `kai-mcp`) ships a co-located `references/setup.md` (per the canonical anatomy in Anthropic's [skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) — `scripts/` for executables, `references/` for docs, `assets/` for files used in output) with the Mosaic-specific token / OAuth walkthrough. `mosaic-mixpanel/scripts/lexicon-query.py` is referenced via `${CLAUDE_SKILL_DIR}` per spec. `tools-init` cross-reads sibling skills' setup docs via `${CLAUDE_PLUGIN_ROOT}/skills/<skill>/references/setup.md`. All 5 new skills pass `quick_validate.py` from the Anthropic skill-creator
- One-time shell hook: after first token is written, wizard asks (Y/n) to append a single `source` line to `~/.zshrc` or `~/.bashrc` so the tokens load into every future Claude Code session
- Extend `check-leaked-keys.sh` hook + `PreToolUse` prompt to flag `NRAK-*`, `NRII-*`, `NEW_RELIC_API_KEY=NRAK-*`, and `MIXPANEL_SERVICE_ACCOUNT_TOKEN=<hex>` patterns in tool output and file writes
- Telemetry env vars renamed: `MOSAIC_BUDDY_TELEMETRY_URL` → `KAI_TELEMETRY_URL`, `MOSAIC_BUDDY_HMAC_KEY` → `KAI_HMAC_KEY`. Backend endpoint and HMAC default unchanged so events from kai land in the same dashboard
- Org-wide Mixpanel Business Context written to Mosaic Wellness org `2242951` outside the plugin — every Claude session in the org (plugin users or not) now gets the brand resolver, prod-default rule, geo handling, and lexicon pointer for free on the first Mixpanel call


## [mosaic-buddy@3.7.0] - 2026-05-22
- Add `token-usage-guardrails` skill and subcommand. One-shot setup that installs a "Token Efficiency & Model Routing" section into the repo's root `CLAUDE.md` (or scaffolds one with a Project Overview + Ownership Map if missing), creates `.claude/agents/` and `.claude/rules/` if absent, writes `.claude/rules/token-efficiency.md`, and adds per-package `CLAUDE.md` stubs for monorepos
- Idempotent — never overwrites existing `CLAUDE.md` or rule files; only appends or skips


## [mosaic-buddy@3.6.0] - 2026-05-19
- Drop the `new` keyword from both `handoff` and `sidequest`. Now you just type the name and the skill auto-detects intent from the work-log folder
- `handoff <name>` dispatch: folder missing → save fresh; folder exists & latest `session-N.md` was written by THIS Claude Code session → save another checkpoint (auto-increments N); folder exists & latest was written by a DIFFERENT session → resume
- `sidequest <name>` dispatch: `forks/<name>/` exists anywhere under `work-log/` → resume; doesn't exist → create
- Backward compat: a leading `new ` is silently stripped, so 3.5.0 muscle memory keeps working
- BREAKING from 3.5.0: `new` no longer routes to a distinct CREATE mode — it's just stripped and the name is dispatched on. No-arg behaviour unchanged (still asks)


## [mosaic-buddy@3.5.0] - 2026-05-19
- `handoff` is now bimodal (matches `sidequest`): `new <sessionName>` writes a fresh handoff, `<sessionName>` resumes one — reads the latest `work-log/<sessionName>/session-N.md`, verifies the repo state, briefs the user on what's next
- Resume logic ported from Hitesh's local `takeover` skill into the handoff skill — single command, two modes
- BREAKING: in 3.4.0, `/mosaic-buddy handoff <name>` created a handoff. In 3.5.0 it resumes one. To create, now use `/mosaic-buddy handoff new <name>`


## [mosaic-buddy@3.4.0] - 2026-05-18
- Add `handoff` subcommand: writes a structured session summary to `work-log/<sessionName>/session-N.md` so a fresh Claude can resume the work
- New `handoff` skill ported from Hitesh's local skill; gitignores `work-log/` automatically; increments session number on repeat use
- Fix telemetry default URL: was pointing at non-existent `mosaic-buddy-telemetry-production` host (404 on every call since plugin rename); now points at the actual deployed service at `beacon-telemetry-production.up.railway.app`
- Add `feedback` subcommand: three-step ask (rating chips + one-line title + short description) that POSTs to the beacon-telemetry `/feedback` endpoint
- New `feedback` skill + `hooks/submit-feedback.sh` submitter (HMAC-signed, honours `MOSAIC_BUDDY_TELEMETRY_URL=off`)
- Server: new `beacon_feedback` table, `POST /feedback` endpoint, `/feedback` admin dashboard, `/feedback/stats` admin API — main dashboard now links to it
- Add `sidequest` subcommand: `new <forkName>` writes a fork snapshot under `work-log/<parent>/forks/<forkName>/session-1.md` so a different future session can pick up the tangent without disturbing this one; `<forkName>` (no `new`) resumes one
- New `sidequest` skill ported from Hitesh's local skill, with all cross-refs adapted to `/mosaic-buddy <command>` so it works for users who only have the plugin installed


## [mosaic-buddy@3.3.0] - 2026-04-23
- Security: send display name instead of full email (no PII in transit or logs)
- Security: HMAC-signed telemetry writes (rejects unsigned/forged requests)
- Security: admin token required for stats endpoint and dashboard
- Security: rate limiting on write endpoint (30 req/min per IP)


## [mosaic-buddy@3.2.1] - 2026-04-23
- Fix telemetry: detect expanded prompt format (plugin system expands command before hook fires)
- Fix telemetry: await database write in GET /t endpoint (was silently dropping events)
- Redeploy beacon-telemetry backend


## [mosaic-buddy@3.2.0] - 2026-04-23
- Fix telemetry hook: strip /mosaic-buddy instead of old /beacon prefix
- Fix telemetry hook: add all command aliases to skip list (prevents double-counting)
- Fix telemetry hook: case-insensitive subcommand matching
- Fix telemetry hook: remove curl background race condition
- Clean up unused timestamp variable


## [mosaic-admin@3.1.0] - 2026-04-22
- Aligned version with mosaic-buddy (jumped from 1.0.0 to 3.1.0)

## [mosaic-buddy@3.1.0] - 2026-04-22
- Bumped from 3.0.2 to 3.1.0 (minor)


## [mosaic-buddy@3.0.2] - 2026-04-22
- Bumped from 3.0.1 to 3.0.2 (patch)


## [mosaic-buddy@3.0.1] - 2026-04-22
- Renamed from beacon to mosaic-buddy, rewrote README, fixed instant interactive menu

## [mosaic-buddy@3.0.0] - 2026-04-22
- Renamed plugin from beacon to mosaic-buddy

## [mosaic-buddy@2.3.0] - 2026-04-21
- Redesigned /mosaic-buddy 10x to use parallel Sonnet subagents + Opus synthesis

## [mosaic-buddy@2.2.0] - 2026-04-21
- Split coaching into /mosaic-buddy 5x (fast) and /mosaic-buddy 10x (deep)
