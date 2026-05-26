# Changelog

All notable version changes to plugins in this repository.

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
