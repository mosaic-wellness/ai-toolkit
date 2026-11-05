# Reconnaissance: ai-toolkit attack-surface map

Starting map only. Re-verify every row against current source before relying on it; line numbers drift. Docs and comments are claims. Each `###` heading below is a coverage-ledger **sub-system**; build units as sub-system × boundary × attack class (see `attack-classes.md`).

## Product and principals

A Claude Code / Codex plugin marketplace for Mosaic Wellness (`.claude-plugin/marketplace.json:7-20` lists `kai` 1.6.0 and `kai-dev` 1.0.1). It is not a Node app. It is markdown prompts, shell hooks, JSON configs and one small Fastify service (`services/beacon-telemetry`). `plugins/mosaic-admin` (3.1.0) is not in the marketplace file, and `plugins/mosaic-buddy` is retired. There is no `.github/`, no CODEOWNERS, no test file and no AGENTS.md at the root (`git ls-files`).

| Principal | How it arrives | Normal authority |
| --- | --- | --- |
| Marketplace maintainer | Merges to `main`; runs `scripts/bump.sh` | Controls what every installing engineer's agent loads and runs |
| Installing engineer (and their agent) | `/plugin install`; runs `/kai`, `/kai-dev`, `/mosaic-admin` | Hooks and agents run with the engineer's shell permissions, `~/.claude.json`, `~/.config/kai/` and session transcripts in reach |
| Untrusted content the agent reads | Repo files, Jira tickets, ad copy, web pages, tool results, transcripts | Should have no authority; reaches the agent's context |
| Telemetry client (hook on a machine) | Signed POST to the public ingest | Writes events and feedback |
| Anyone with the repo | Reads source | Knows the signing-key default and every endpoint |
| Dashboard viewer | Static admin token in header or `?token=` | Reads every row |
| Platform operator (Railway) | Deploys the container | Sets env, domain, proxy; outside the repo |

Protected resources: engineers' credentials (`~/.claude.json`, `~/.config/kai/tokens.env`, project `.mcp.json`), engineer identity and activity data in the beacon tables, live ad spend (Meta), staging page and habit configs (admin-mcp), git history of the repos the engineer works in, Jira tickets, and the integrity of what the marketplace distributes.

## Sub-systems

### S1. Hook configuration and hook scripts

- `plugins/kai/hooks/hooks.json:1-78`: `PreToolUse` Write|Edit `prompt` hook for secret literals (`:3-13`, prompt at `:9`); `PreToolUse` Meta Ads matcher → `block-meta-writes.sh` (`:14-22`); `PreToolUse` admin-mcp write matcher → `prompt` hook with 18-brand and 7-brand allow-lists and a lock suggestion (`:23-31`, prompt at `:28`); `PostToolUse` Bash → `check-leaked-keys.sh` (`:33-43`); `SessionStart`, `SubagentStart`, `UserPromptSubmit` → `telemetry.sh` (`:44-76`).
- `plugins/kai/hooks/block-meta-writes.sh:10-66`: parses `tool_name` with `python3`; exit 0 when parsing fails (`:23-27`); case patterns for create/update/activate (`:34-54`) and `ads_update_custom_audience_users` (`:58-64`); exit 2 blocks.
- `plugins/kai/hooks/check-leaked-keys.sh:7-26`: greps Bash output for a fixed regex; exit 2 after the output exists.
- `plugins/kai-dev/hooks/hooks.json:1-15` → `plugins/kai-dev/scripts/block-destructive-git.sh:9-28`: `jq` extraction (`:9`), exit 0 on empty (`:12-14`), regex for force-push, hard reset, checkout dot, clean, branch -D (`:17`), bare checkout of main (`:23`).
- `plugins/mosaic-admin/hooks/hooks.json:1-16`: one prompt hook that warns only (`:10`).
- Retired: `plugins/mosaic-buddy/hooks/` (`hooks.json`, `telemetry.sh`, `submit-feedback.sh`, `check-leaked-keys.sh`) is tracked but not in the marketplace.

### S2. Telemetry and feedback clients (engineer machine → Railway)

- `plugins/kai/hooks/telemetry.sh:1-176`: default URL and `KAI_TELEMETRY_URL=off` (`:12-19`), signing-key default and `KAI_HMAC_KEY` override (`:15`), event switch for SessionStart, SubagentStart, UserPromptSubmit (`:91-127`), identity from `git config user.email` and repo basename (`:133-135`), HMAC (`:139-141`), body by heredoc (`:163-166`), `curl` with 3-second budget (`:169-174`).
- `plugins/kai/hooks/submit-feedback.sh:1-130`: same URL and key defaults (`:14-15`), rating/title/description from arguments (`:30-41`), body by `python3 json.dumps` (`:66-81`), predictable `/tmp/kai-feedback-response.$$` file (`:83`, `:125`), second event POST (`:93-120`).
- `plugins/kai/skills/tools-init/SKILL.md:211-235`: `beacon_step` helper repeats the URL, key and identity logic in prose-embedded shell. `plugins/kai/skills/feedback/SKILL.md:69-78` invokes the feedback script.
- `services/beacon-telemetry/TELEMETRY_V2_SPEC.md` describes the contract (claim).

### S3. beacon-telemetry ingest API

- `services/beacon-telemetry/src/routes/ingest.js:1-154`: allow-lists (`:4-13`), `POST /v2/ingest` (`:26-97`: plugin check, mosaic-buddy 204, unknown plugin 204, required strings, `verify`, rate limit, metadata cap, clamps, `prisma.event.create`), `POST /v2/feedback` (`:99-145`), retired endpoints returning 410 (`:147-153`), in-memory `legacyDroppedCount` (`:15`).
- `services/beacon-telemetry/src/lib/hmac.js:1-33`: key from `KAI_HMAC_KEY`, `TELEMETRY_HMAC_KEY` or a built-in default (`:3`), 300-second window (`:4`), `sign` over four concatenated fields (`:6-10`), `verify` with `timingSafeEqual` (`:12-33`).
- `services/beacon-telemetry/src/lib/rateLimit.js:1-23`: 30 per 60 seconds keyed by `request.ip`, process-local `Map`, 300-second sweep.

### S4. beacon-telemetry admin, dashboard, store and container

- `services/beacon-telemetry/src/server.js:1-70`: `Fastify({ logger: true })` with no `trustProxy` or `bodyLimit` (`:15`), `checkAuth` (`:17-25`, true when token unset), view loading (`:27-37`), `GET /health` (`:39`), `GET /` and `GET /feedback` (`:41-57`), registration (`:59-60`), listen on `0.0.0.0` (`:64`).
- `services/beacon-telemetry/src/routes/admin.js:1-41`: second `checkAuth` (`:5-13`), `guard` preHandler (`:18-23`), nine GET routes (`:29-40`).
- `services/beacon-telemetry/src/lib/queries.js:1-359`: `$queryRaw` tagged templates; `days` clamp (`:6-9`), `limit` clamps (`:303`, `:315`), `users` and `heatmap` without `LIMIT` (`:223-241`, `:260-270`).
- `services/beacon-telemetry/src/views/dashboard.html` (651 lines) and `feedback.html` (214 lines): token read from the URL (`services/beacon-telemetry/src/views/dashboard.html:222`, `services/beacon-telemetry/src/views/feedback.html:82`), `fetch` with token appended (`services/beacon-telemetry/src/views/dashboard.html:268`, `services/beacon-telemetry/src/views/feedback.html:117`), DOM builder using `textContent` (`services/beacon-telemetry/src/views/dashboard.html:240`, `services/beacon-telemetry/src/views/feedback.html:97`), links carrying the token (`services/beacon-telemetry/src/views/dashboard.html:646`, `services/beacon-telemetry/src/views/feedback.html:209`).
- `services/beacon-telemetry/prisma/schema.prisma:1-45` and `services/beacon-telemetry/prisma/migrations/20260526000000_v2_reset/migration.sql`: `Event` and `Feedback` tables; no retention.
- `services/beacon-telemetry/Dockerfile:1-15` (node:20-slim, no `USER`, `npm install` from `package.json` only, migrate at start), `services/beacon-telemetry/railway.toml:1-8`, `services/beacon-telemetry/package.json:12-18` (caret ranges), `services/beacon-telemetry/package-lock.json` (tracked).

### S5. MCP configuration and credential provisioning

- `plugins/kai/.mcp.json:1-18`: `mixpanel-mcp` via `npx -y mcp-remote` (`:3-7`), `firebase-mcp` via `npx -y firebase-tools@latest mcp` (`:8-12`), `kai-mcp` HTTP URL (`:13-16`).
- `plugins/kai/skills/tools-init/SKILL.md` (669 lines): token scan and `tokens.env` migration (`:70-90`), stale cache rename (`:96-129`), New Relic key write to `~/.claude.json` with `cp` backup then `chmod` (`:395-415`), admin-mcp flow (`:433-`). `plugins/kai/skills/migrate/SKILL.md:35-108`: legacy token copy.
- `plugins/kai/commands/kai.md:308-327`: tools-init rails (states tokens go only to `tokens.env`; the skill writes `~/.claude.json`).
- `plugins/mosaic-admin/commands/mosaic-admin.md:20-27`, `:143`, `:169-172`: admin-mcp key read from and written to a project `.mcp.json`; staging URL.
- Federated login (OAuth) in vendor clients: the Firebase CLI runs Google OAuth, on demand or via `login`, and stores tokens in `~/.config/configstore/firebase-tools.json` (`plugins/kai/skills/firebase-mcp/references/setup.md:3-12`, `:18-37`); the grant covers everything the Google account can do in the Firebase console (`:85-93`); the domain check is user guidance (`:29-31`, `:58-61`). Mixpanel OAuth runs in `mcp-remote` (`plugins/kai/skills/tools-init/SKILL.md:290-300`, `plugins/kai/skills/mixpanel-mcp/references/setup.md`).
- `plugins/kai/skills/kai-mcp/references/setup.md:48-52`, `plugins/kai/skills/newrelic-mcp/references/setup.md`, `plugins/kai-dev/references/jira-mcp-setup.md`, `plugins/kai/skills/mosaic-meta-ads/references/setup.md`: setup guidance (claims). The skills `plugins/kai/skills/{firebase,mixpanel,newrelic,kai}-mcp/SKILL.md` route agents to live MCP tools.

### S6. Commands, agents and skills (instruction surface)

- `plugins/kai/commands/kai.md` (450 lines; `disable-model-invocation: true`, `allowed-tools: Read, Glob, Grep, Bash, Write, Edit, AskUserQuestion, ToolSearch` at `:8-10`); routing table `:28-`.
- `plugins/kai/agents/*.md` (14 agents; tool grants in front-matter, for example `plugins/kai/agents/debugger.md:8`, `plugins/kai/agents/doctor.md:8`, `plugins/kai/agents/coach.md:8`, `plugins/kai/agents/habit-author.md:19`), `plugins/mosaic-admin/agents/*.md`, `plugins/mosaic-admin/commands/mosaic-admin.md:10` (adds `WebFetch`).
- Data-reading agents: `plugins/kai/agents/coach-lite.md:20-70` and `plugins/kai/agents/coach.md` read `~/.claude/projects/*` transcripts and write an HTML report.
- Live-effect skills: `plugins/kai/skills/pdp-narrative-experiments/SKILL.md` (ad copy → admin-mcp variant writes), `plugins/kai/skills/admin-essentials/SKILL.md`, `plugins/kai/skills/habit-essentials/SKILL.md`, `plugins/kai/skills/mosaic-meta-ads/` (read-only list `plugins/kai/skills/mosaic-meta-ads/references/read-only-tools.md:94-122` of blocked verbs), `plugins/kai/skills/handoff/`, `plugins/kai/skills/sidequest/`, `plugins/kai/skills/token-usage-guardrails/` (writes into the user's repo).
- Bundled reference content: `plugins/kai/references/admin/` (including `pdp-widget-specs/` with `_provenance.md`) is loaded into agent context.

### S7. Helper scripts

- `plugins/kai/scripts/bulk-fetch.sh:1-215` and the byte-identical `plugins/mosaic-admin/scripts/bulk-fetch.sh`: nearest `.mcp.json` lookup (`:81-97`), URL and key extraction (`:100-101`), JSON by concatenation (`:116-120`, `:131`), `curl` with `x-api-key` header (`:134-139`), output files named from identifiers (`:127-129`).
- `plugins/kai/scripts/sync-pdp-widget-specs.sh:1-177`: `MOSAIC_META_REPO` override (`:31-32`), `rm -rf` of the target (`:61`), copy filters (`:67-117`), `node build-widget-index.mjs` (`:153-157`).
- `plugins/kai/scripts/build-widget-index.mjs:1-295`: reads markdown, writes `widget-index.json` (`:291`).
- `plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py:1-415` (invoked by agents per `plugins/kai/skills/mixpanel-mcp/SKILL.md:67-87`): file path from `MOSAIC_LEXICON_JSON` (`:75-77`), `--lexicon` (`:99-104`, `:348-351`), a sibling `mosaic-meta-repo` path, a hard-coded home path (`:84-86`) and a search of every sibling directory of the working directory or `CLAUDE_PROJECT_DIR` (`:70`, `:88-94`); `json.load` of the chosen file (`:124-129`); subcommands print JSON to stdout, which enters agent context (`:343-400`).

### S8. Release and marketplace integrity

- `scripts/bump.sh:1-166`: `jq` edits of `plugin.json` and `marketplace.json` (`:106-116`), changelog rewrite (`:127-145`), optional `git commit` (`:160-165`).
- `.claude-plugin/marketplace.json:1-21`, `plugins/*/.claude-plugin/plugin.json`, `CHANGELOG.md`, `plugins/kai/CHANGELOG.md`. Sources are `./plugins/<name>` with no commit pin. `plugins/*/LICENSE`.
- `.gitignore:1-25`: ignores `.env`, `.env.local`, `.env.production`, `work-log/`; does not ignore `.mcp.json`.
- Not in repo: branch protection, who can merge, signing of commits, installer behaviour.

### S9. kai-dev development orchestrator

- `plugins/kai-dev/commands/kai-dev.md:11` (`allowed-tools: Agent, Read, Glob, Grep, Bash, Write, Edit, ToolSearch, AskUserQuestion`), rules `:28`, PR step `:162`; `plugins/kai-dev/workflows/*.md` (`plugins/kai-dev/workflows/finalize.md:21` `git push -u origin`, `:37` `gh pr create`, `:76` ask before Jira transition), `plugins/kai-dev/agents/{architect,builder,guardian}.md` (`tools:` at `:6-7`), `plugins/kai-dev/hooks/hooks.json`, `plugins/kai-dev/templates/*` (Jira comment and PR body templates), `plugins/kai-dev/references/jira-mcp-setup.md`.

## Cron, CLI, queues, deep links

No cron, queue or consumer exists. CLIs are the shell scripts in S1, S2, S7 and S8 and the slash commands in S6/S9. No deep links, mobile code or webhooks received by this repo other than the two public POST routes in S3.

## Cross-cutting facts to verify early

1. The signing-key default literal appears in `services/beacon-telemetry/src/lib/hmac.js:3`, `plugins/kai/hooks/telemetry.sh:15`, `plugins/kai/hooks/submit-feedback.sh:15` and `plugins/kai/skills/tools-init/SKILL.md:224` (names only; never copy the value). Decide what a holder of it can do given which fields `sign` covers.
2. Whether `TELEMETRY_ADMIN_TOKEN` is required: both `checkAuth` copies return true when it is empty. Deployed value is `needs_validation`.
3. Hook failure branches: every block hook's exit code on parse failure, missing tool and near-miss input. Check the two `exit 0` fail-open branches and the matcher coverage in `plugins/kai/hooks/hooks.json:15`.
4. Prompt hooks (`plugins/kai/hooks/hooks.json:9`, `:28`; `plugins/mosaic-admin/hooks/hooks.json:10`) are not deterministic. Which protections rest only on them?
5. `tools-init` credential resting places and backups (`plugins/kai/skills/tools-init/SKILL.md:401-414`) versus the safety rail (`plugins/kai/commands/kai.md:323`).
6. Fastify `trustProxy` is unset (`services/beacon-telemetry/src/server.js:15`), while the rate limit keys on `request.ip` (`services/beacon-telemetry/src/routes/ingest.js:61`). Platform proxy behaviour is `needs_validation`.
7. The Dockerfile ignores the tracked lockfile (`services/beacon-telemetry/Dockerfile:7-8`) and runs as root.
8. The two `bulk-fetch.sh` copies, the two `checkAuth` copies and the three telemetry shell implementations (S2) can drift. Compare them.
9. Firebase OAuth scope and token store (`plugins/kai/skills/firebase-mcp/references/setup.md:35-37`, `:85-93`) and the unpinned CLI (`plugins/kai/.mcp.json:8-12`): what does a compromised or replaced `firebase-tools@latest` read?
10. `lexicon-query.py` file selection: which candidate path wins when several exist, and can a sibling directory's file be loaded and printed (`plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py:69-113`)?
11. `plugins/mosaic-admin` is not in the marketplace file, yet the root `CLAUDE.md` lists it as a plugin. Which copy of its hooks and scripts do engineers actually run?

## Tests as evidence

None exist in the repo (`git ls-files` shows no test files or CI config). Do not infer coverage. A proposed test is labelled Proposed.

## Ledger seeding

Create one unit per sub-system above and each applicable class in `attack-classes.md`. Rank hunting: S3 and S4 (public and admin endpoints), S1 (guards), S5 (credentials), S2 (outbound data), S6 and S9 (agent authority), S7 and S8 (scripts, release), then the wildcard unit.
