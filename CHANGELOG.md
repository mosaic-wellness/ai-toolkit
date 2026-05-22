# Changelog

All notable version changes to plugins in this repository.

## [mosaic-buddy@3.7.0] - 2026-05-22
- Added `design-audit` skill — structured 1–5 scorecard across 8 domains (usability, visual design, brand compliance, content, accessibility, trust, conversion, emotional design) with a PDF report and spider chart for Little Joys, Man Matters, and Be Bodywise
- Auto-activates when the user shares a screenshot, URL, or Figma link asking for design feedback — brand-aware, mobile-first, weighted scoring per brand
- Ships a `fill.py` helper that renders the report from a small JSON, keeping the skill token-light
- README updated with an Auto-Activating Skills section documenting design-audit triggers and output


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
