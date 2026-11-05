# Attack classes for this repo

Only classes this repo's source evidences. Paths are anchors from `reconnaissance.md`; re-open them. Each class lists hunt questions, not findings. Every question needs a source answer: trace it, find the guard, or record the gap. Give a hunter the class text it needs plus the sub-systems it owns.

Validation here is source-only. A candidate is `confirmed` when one complete source-established path reaches the unauthorized result with no effective guard on that path (including failure branches, duplicate copies and config defaults). A guarded sibling or copy does not disprove an unguarded path. A decisive fact outside the repo is `needs_validation`.

## Domain blocks selected (and excluded)

Selected: web/HTTP auth and identity (the beacon service only); event authenticity (the signed ingest); secrets and sensitive-data handling (engineer credentials, telemetry fields); federated login and OAuth token stores in vendor clients (Firebase CLI, `mcp-remote`; Class C3); injection and unsafe evaluation (shell, JSON, SQL, HTML); supply chain and release; AI/agent instruction surface (prompt injection, tool grants, live-write guards); resource exhaustion (beacon service and hooks); cloud/deploy (Dockerfile, Railway config).

Excluded:

- Data isolation / multi-tenant: the beacon service has one table set and one admin role; there are no tenants or per-user records (`services/beacon-telemetry/prisma/schema.prisma:10-45`, `services/beacon-telemetry/src/routes/admin.js:29-40`). The only isolation filter, `plugin = ANY(...)` on `beacon_events` queries, is covered under Class A (`beacon_feedback` has no `plugin` column: `services/beacon-telemetry/prisma/schema.prisma:32-45`).
- Messaging / webhooks / queues as a separate block: the only inbound receiver is the signed ingest, covered under Class B. There are no queues or consumers.
- Client-side/browser (most of it): the repo has two small static pages. Their one sink question is kept under Class D (`services/beacon-telemetry/src/views/dashboard.html:240`, `services/beacon-telemetry/src/views/feedback.html:97`). No framework, cookies, CORS, postMessage or service worker exists.
- Desktop/mobile/local IPC: no native or app code here.
- Memory-safety/binary: shell, Node and markdown only.
- Business-logic and abuse as a separate block: folded into Class F (live-write guards) and Class G (telemetry flooding).
- Cryptography beyond the HMAC: no TLS termination, JWT or password hashing in this repo.

## A. Beacon admin authentication, exposure and data scope (S4)

**A1. Admin auth coverage and fail-open.**

- `checkAuth` returns true when `TELEMETRY_ADMIN_TOKEN` is empty (`services/beacon-telemetry/src/server.js:17-18`, `services/beacon-telemetry/src/routes/admin.js:5-6`). What does the unauthenticated response contain (`GET /`, `/feedback`, `/api/*`, `/feedback/*`)? Is any other file (Dockerfile, `railway.toml`, README, spec) documenting that the variable is required? The deployed value is `needs_validation`.
- List every registered route in `services/beacon-telemetry/src/server.js:39-60` and `services/beacon-telemetry/src/routes/admin.js:29-40`. Which sit outside `guard`? `GET /` and `GET /feedback` call `checkAuth` inline but `/health`, `POST /v2/*` and the 410 routes are public. Does any public route return data?
- The two `checkAuth` copies: are they identical? Could one drift and open a route?
- The compare is `===` on a string from the query or the `Authorization` header (`services/beacon-telemetry/src/server.js:23-24`, `services/beacon-telemetry/src/routes/admin.js:11-12`). Is timing leakage reachable over the network, and is the token length or entropy visible anywhere?

**A2. Token handling.**

- `?token=` is accepted and used by the pages (`services/beacon-telemetry/src/views/dashboard.html:222`, `services/beacon-telemetry/src/views/dashboard.html:268`, `services/beacon-telemetry/src/views/dashboard.html:646`, `services/beacon-telemetry/src/views/feedback.html:82`). Fastify logging is on (`services/beacon-telemetry/src/server.js:15`). Does the default request log include the query string? Does the page send a `Referer`, and are there outbound links or third-party scripts in the HTML?
- The token has no rotation, expiry or per-viewer identity. Record this as a design limit only if a concrete exposure path exists.

**A3. Data returned to the viewer.**

- Which personal fields do `users`, `heatmap`, `recent` and `feedbackRecent` return (`services/beacon-telemetry/src/lib/queries.js:220-323`)? What retention exists (none in the schema)?
- Every `beacon_events` query filters `plugin = ANY(ALLOWED_PLUGINS)`. Check each one. The `beacon_feedback` queries (`services/beacon-telemetry/src/lib/queries.js:314-358`) cannot carry that filter because the table has no `plugin` column (`services/beacon-telemetry/prisma/schema.prisma:32-45`); feedback written through `/v2/feedback` is not plugin-scoped. Check that they keep a limit or window.

## B. Event authenticity, identity and replay (S2, S3)

**B1. Signature coverage.**

- `sign` covers `plugin`, `event_type`, `user_local`, `ts` (`services/beacon-telemetry/src/lib/hmac.js:6-10`). Which stored or displayed fields are not covered (`project`, `subcommand`, `command`, `session_id`, `os`, `plugin_version`, `metadata`, and for feedback `rating`, `title`, `description`)? What does the dashboard conclude from them (funnels use `subcommand` and `metadata->>'outcome'`: `services/beacon-telemetry/src/lib/queries.js:83-128`)? Can a forger shape a metric?
- The key default is in source (`services/beacon-telemetry/src/lib/hmac.js:3`, `plugins/kai/hooks/telemetry.sh:15`). What can anyone with repo access forge? Is a forged event distinguishable from a real one?
- `/v2/feedback` verifies with the constants `kai` and `feedback_submitted` (`services/beacon-telemetry/src/routes/ingest.js:120`). A signature minted for an ingest `feedback_submitted` event for the same user and `ts` also verifies a feedback post. Is that cross-use reachable and what is the consequence?

**B2. Freshness and replay.**

- 300-second window, no nonce or seen-signature store (`services/beacon-telemetry/src/lib/hmac.js:4`, `services/beacon-telemetry/src/lib/hmac.js:16-17`). One captured request can be replayed many times in the window, bounded only by the rate limit. What is the effect on stored rows?
- `verify` runs before `checkRateLimit` (`services/beacon-telemetry/src/routes/ingest.js:57-63`). Does an invalid signature consume rate-limit budget? Does the order permit cheap unauthenticated load on HMAC work?

**B3. Pre-verification branches.**

- Unknown plugin and `mosaic-buddy` return 204 before any check and increment a counter (`services/beacon-telemetry/src/routes/ingest.js:37-45`). Any side effect beyond a counter?
- `request.body || {}` with a non-object body: what happens for arrays or strings (`services/beacon-telemetry/src/routes/ingest.js:27-31`)?

## C. Credentials and sensitive data on engineer machines (S2, S5)

**C1. Where credentials rest.**

- `tools-init` writes the New Relic key (and the admin-mcp key) as a literal into `~/.claude.json` after `cp` to `~/.claude.json.bak.<epoch>`; `chmod 600` runs on the new file only, afterward (`plugins/kai/skills/tools-init/SKILL.md:401-414`). Does the backup keep the key? What is its mode (umask)? Is it ever deleted or listed for the user to delete? Can the next `tools-init` run copy an older backup?
- `~/.config/kai/tokens.env`: created with what mode before it is written (`plugins/kai/skills/tools-init/SKILL.md:80-90`, `plugins/kai/skills/migrate/SKILL.md:35-40`, `plugins/kai/skills/migrate/SKILL.md:103`)? The migrate path copies a legacy file and then `chmod 600` (race window between copy and chmod).
- The admin setup flow stores `x-api-key` in a project `.mcp.json` (`plugins/mosaic-admin/commands/mosaic-admin.md:26-27`, `plugins/mosaic-admin/commands/mosaic-admin.md:143`). Does any instruction add the file to `.gitignore` or warn about committing it? `.gitignore` in this repo lists no `.mcp.json` (`.gitignore:7-10`).
- `plugins/kai/commands/kai.md:322-327` forbids writing tokens anywhere but `tokens.env`. The skill does otherwise. Which text do agents obey, and what does the user see?
- `check-leaked-keys.sh` fires on Bash output only, after the fact, with a fixed list (`plugins/kai/hooks/check-leaked-keys.sh:21-24`). What credentials in this repo's flows are not in the pattern list (Mixpanel and Firebase OAuth tokens rest in the vendor clients' own stores, see C3; the admin-mcp key prefix is covered; others?)?

**C2. What leaves the machine.**

- Per-event fields: email local part, repo basename, session id, OS, version (`plugins/kai/hooks/telemetry.sh:131-166`). Is the repo basename ever sensitive (client names)? Is `user_local` derived from a work email?
- `submit-feedback.sh` sends free-text title and description and the same identity (`plugins/kai/hooks/submit-feedback.sh:43-81`). Does the feedback skill warn the user not to paste secrets or customer data (`plugins/kai/skills/feedback/SKILL.md:69-84`)?
- `UserPromptSubmit` receives the full prompt on stdin. Confirm it is not forwarded (`plugins/kai/hooks/telemetry.sh:104-123`, body built at `:163-166`). With `jq` absent, `json_get` falls back to `grep`/`sed` over the whole payload (`plugins/kai/hooks/telemetry.sh:35-43`): can prompt text alter which fields are read?
- `coach` and `coach-lite` read other projects' transcripts when `all` is passed (`plugins/kai/agents/coach-lite.md:25-29`). Where does the output go, and does any step send it off the machine?
- `KAI_TELEMETRY_URL` and `KAI_HMAC_KEY` are read from the environment (`plugins/kai/hooks/telemetry.sh:12-15`). A project-level settings file that sets them redirects events: is that reachable from repo content?

**C3. Federated login and OAuth token stores (S5).** This repo implements no sign-in; it wires vendor clients that do.

- Firebase: `plugins/kai/.mcp.json:8-12` runs the Firebase CLI MCP. The setup reference documents a Google OAuth login, tokens in `~/.config/configstore/firebase-tools.json`, automatic refresh, and a grant equal to everything the Google account can do in the Firebase console (`plugins/kai/skills/firebase-mcp/references/setup.md:3-12`, `:18-37`, `:85-93`). Which agent tools can reach that store (`Bash`, `Read` in `plugins/kai/agents/*.md`)? Does any skill, agent or snippet read, print, copy or back up the configstore file? Does the skill's write confirmation ("confirms before any write", `:91-93`) rest on prose only?
- The `@mosaicwellness.in` account rule is guidance (`plugins/kai/skills/firebase-mcp/references/setup.md:29-31`, `:58-61`). Does any code or hook enforce it? If not, record the claim as unenforced.
- Mixpanel: OAuth is delegated to `mcp-remote` (`plugins/kai/.mcp.json:3-7`, `plugins/kai/skills/tools-init/SKILL.md:290-300`). Same questions on token store reach and copies.
- `tools-init status` and `validate` inspect auth state (`plugins/kai/skills/tools-init/SKILL.md:140-172`). Do they read token files and print more than a ready/not-ready state?
- Both clients start through `npx -y` with `@latest` or no version, so a replaced package runs with the engineer's OAuth session. Cross-check with E1.

## D. Injection and unsafe evaluation (S1, S2, S4, S7)

**D1. Shell and JSON construction.**

- `bulk-fetch.sh` concatenates `TOOL_NAME`, identifiers and `key=value` arguments into a JSON string and uses an identifier in output file names (`plugins/kai/scripts/bulk-fetch.sh:116-120`, `plugins/kai/scripts/bulk-fetch.sh:127-131`). Who supplies those values (an agent following a page config)? What can an identifier containing a quote, brace or `..` do? The `mosaic-admin` copy is identical: check both.
- `telemetry.sh` embeds shell variables in a heredoc JSON body after `json_escape` (`plugins/kai/hooks/telemetry.sh:145-166`). With `jq` absent, the `sed` escaper is used (`plugins/kai/hooks/telemetry.sh:73-78`): does it cover all control characters and the `$` or backtick cases inside the unquoted heredoc? `FIRST` is filtered to `[a-z0-9.-]`, but `PROJECT`, `USER_LOCAL` and `SESSION_ID` come from git config and the hook payload.
- `block-meta-writes.sh` passes the payload as an argument to `python3 -c` (`plugins/kai/hooks/block-meta-writes.sh:14-21`); `block-destructive-git.sh` pipes the command into `grep -E` (`plugins/kai-dev/scripts/block-destructive-git.sh:17`). Any quoting problem with unusual input?
- `tools-init` snippets use `jq --arg` for the key (`plugins/kai/skills/tools-init/SKILL.md:406-411`). Do the other snippets in that file (admin-mcp, rotate, remove) do the same, or do they interpolate user input into shell or `jq` programs?

**D2. SQL and HTML.**

- Every `$queryRaw` in `services/beacon-telemetry/src/lib/queries.js` uses tagged-template values. Confirm no `$queryRawUnsafe`, no concatenation, and that `ALLOWED_PLUGINS` is a constant array cast with `::text[]`. Confirm `days` and `limit` are numeric after the clamps (`:6-9`, `:303`, `:315`).
- Read the DOM builder and every text sink in both pages (`services/beacon-telemetry/src/views/dashboard.html:222-270`, `services/beacon-telemetry/src/views/feedback.html:82-120`). Stored `user_local`, `project`, `title`, `description` and `metadata` come from a public endpoint. Do any values reach `href`, `src`, `style`, `on*` attributes, or `setAttribute` with an unchecked name? The token reaches `href` through `encodeURIComponent` (`services/beacon-telemetry/src/views/dashboard.html:646`).

**D3. Dynamic evaluation.**

- Grep the repo for `eval`, `new Function`, `child_process`, `exec`, `spawn` in `services/` and `plugins/kai/scripts/build-widget-index.mjs`. `services/beacon-telemetry/src` has none; confirm for the rest.

**D4. Local data reader: `lexicon-query.py` (S7).**

- Path trust: the file comes from `MOSAIC_LEXICON_JSON`, `--lexicon`, a sibling `mosaic-meta-repo`, a hard-coded home path, or any sibling directory of the working directory or `CLAUDE_PROJECT_DIR` (`plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py:69-113`, `:343-351`, `:398-400`). Can a repository the engineer opens, or a sibling checkout, supply a file at the expected relative path and have it loaded? What does the first-match order let an attacker-placed file override?
- Parsing: `json.load` of the chosen file with a broad `except` that exits (`:124-129`). Any other deserialization or execution of file content? (Expect none; confirm.)
- Output handling: subcommands print JSON to stdout, which the agent reads (`:343-400`; invoked per `plugins/kai/skills/mixpanel-mcp/SKILL.md:67-87`). Do printed strings (event names, descriptions) reach the agent as instructions? Treat file content as untrusted text (F3). Does any command print more than the event metadata the task needs?
- Local data exposure: does the lexicon hold anything beyond event metadata (customer data, internal notes)? The file itself is outside this repo: `needs_validation`.

## E. Outbound destinations and supply chain (S2, S5, S7, S8)

**E1. Unpinned and remote code at session start.**

- `plugins/kai/.mcp.json:3-12` runs `npx -y mcp-remote` and `npx -y firebase-tools@latest mcp`. What happens at each session start for every installed user? Which package names and versions can change under them? Does the repo document a pin or an integrity check?
- Other setup text that tells agents or users to `npx`, `npm i -g`, `curl | sh` or download binaries: grep `plugins/` outside `mosaic-buddy` for `npx`, `npm install`, `brew install`, `curl`.

**E2. Destination trust.**

- `bulk-fetch.sh` takes both URL and key from the nearest `.mcp.json` walking up from the working directory (`plugins/kai/scripts/bulk-fetch.sh:81-101`). Could a repository the engineer opens contain a `.mcp.json` that makes the script send a key it read elsewhere, or only its own? Which key does it send, and from which file?
- `KAI_TELEMETRY_URL` redirects all telemetry; `submit-feedback.sh` normalizes the URL by string stripping (`plugins/kai/hooks/submit-feedback.sh:22-28`). Any path to an unintended host?
- `WebFetch` in `mosaic-admin` (`plugins/mosaic-admin/commands/mosaic-admin.md:10`) and live probes in `tools-init` (`plugins/kai/commands/kai.md:318-320`): are destinations fixed in source?
- `sync-pdp-widget-specs.sh` copies content from a sibling meta-repo path chosen by an environment variable into files agents load as reference (`plugins/kai/scripts/sync-pdp-widget-specs.sh:31-35`, `:67-117`). Could a wrong `MOSAIC_META_REPO` import hostile instructions? `rm -rf "$TARGET_DIR"` (`:61`): can `PLUGIN_ROOT` resolve somewhere unintended?

**E3. Container and dependencies.**

- `services/beacon-telemetry/Dockerfile:7-8` copies only `package.json` and runs `npm install --omit=dev`; the tracked `package-lock.json` is unused. Caret ranges (`services/beacon-telemetry/package.json:12-18`) mean a rebuild can change versions. No `USER` is set, so the process runs as root. `prisma migrate deploy` runs at start (`:15`) with the deployed `DATABASE_URL`. Record package names and versions from the lockfile; advisory status is `needs_validation`.

## F. Agent instruction surface and live-write guards (S1, S5, S6, S9)

**F1. Guard hooks versus the actions they claim to stop.**

- Meta Ads: the matcher (`plugins/kai/hooks/hooks.json:15`) lists create, update, activate, catalog create and custom-audience-user update. The skill lists blocked tools (`plugins/kai/skills/mosaic-meta-ads/references/read-only-tools.md:94-122`). Which Meta write verbs (delete, boost, pixel, permission, experiment, creative upload) are neither blocked nor listed? The connector's full tool list is outside the repo: `needs_validation`. The script also exits 0 on parse failure (`plugins/kai/hooks/block-meta-writes.sh:23-27`); is `python3` always present?
- Destructive git: compare the regex (`plugins/kai-dev/scripts/block-destructive-git.sh:17`) with forms it misses (flags before the subcommand such as `git -C <dir> push --force`, `git push origin +<ref>`, `git push <remote> --force`, `git reset --hard` through an alias, `git restore`, `rm -rf` on `.git`). Where is the hook registered (`plugins/kai-dev/hooks/hooks.json:3-12`), and does it apply to subagents' Bash calls?
- Secrets on Write/Edit: a `prompt` hook (`plugins/kai/hooks/hooks.json:9`). Which key shapes does it name? Does it cover `MultiEdit`, `NotebookEdit`, or Bash redirects that write files? Is it enforced when the model is unavailable?
- admin-mcp writes: brand allow-lists live in a `prompt` hook (`plugins/kai/hooks/hooks.json:28`); the older plugin only warns (`plugins/mosaic-admin/hooks/hooks.json:10`). The matcher in `plugins/kai/hooks/hooks.json:24` lists tool prefixes; compare with the tool names in `plugins/kai/references/admin/tool-reference.md`. Which write tools fall outside the prefixes? The lock suggestion is advisory. The server's own authorization is outside the repo.

**F2. Tool grants versus instructed actions.**

- For each command and agent, compare the `tools:` / `allowed-tools:` line with the actions in its prompt. Review-style agents (`doctor`, `reviewer`, `stack-reviewer`, `ux-reviewer`, `grillme`, `guardian`) hold `Bash`; does any prompt tell them to run something that writes, pushes or sends data? Is "read-only" stated only in prose (`plugins/kai-dev/agents/guardian.md:145`)?
- `kai-dev` pushes and opens PRs (`plugins/kai-dev/workflows/finalize.md:21`, `:37`). What approval gate exists? Which branch and remote does it push to, and where does the branch name come from (ticket text)? `plugins/kai-dev/commands/kai-dev.md:28` bans force-push in prose; the hook is the only deterministic check.
- `token-usage-guardrails`, `handoff` and `sidequest` write files into the user's repo. Do any write outside the repo, overwrite existing files, or embed session content that may include secrets (`work-log/` is ignored in this repo's `.gitignore:24-25` but not in a user's repo)?

**F3. Untrusted content reaching authority.**

- `pdp-narrative-experiments` takes ad copy or briefs and writes variants through admin-mcp (`plugins/kai/skills/pdp-narrative-experiments/SKILL.md`). Can text inside the brief select a brand, page, lock or publish step? Where is the user's approval step, and is it in the prompt only?
- Agents read repository files (`doctor`, `reviewer`, `debugger`), tickets (`kai-dev`) and pages (`mosaic-admin` with `WebFetch`). Is there any instruction that tells an agent to follow directives found in that content? Is there an instruction to treat it as data?
- `coach`/`coach-lite` read transcripts that may contain prior injected text. Do they have write or network tools beyond the report file (`plugins/kai/agents/coach.md:8`: `Write`, `Agent`)?
- Bundled reference docs are loaded into agent context (`plugins/kai/references/admin/pdp-widget-specs/`). Provenance is a SHA note (`_provenance.md`); who reviews a refresh?

## G. Resource exhaustion (S3, S4, S1)

- Ingest body size: Fastify default (no `bodyLimit`, `services/beacon-telemetry/src/server.js:15`). Is `metadata` measured after parsing (`services/beacon-telemetry/src/routes/ingest.js:65-72`)? What is the largest accepted row?
- Rate limit: process-local `Map` keyed by `request.ip` (`services/beacon-telemetry/src/lib/rateLimit.js:4-16`); `trustProxy` unset. If the platform proxy hides client IPs, one noisy caller can lock out all engineers' telemetry (`needs_validation`). Does the sweep every 300 seconds bound memory under many IPs (`:18-23`)?
- Table growth: no deletion or cap; a forger with the key can add rows at the rate limit. Which dashboard queries scan the table without an index-friendly filter (`users`, `heatmap`: `services/beacon-telemetry/src/lib/queries.js:220-300`)?
- Hooks on the prompt path: `UserPromptSubmit` runs synchronously (`plugins/kai/hooks/hooks.json:67-76`) with 2- and 3-second curl limits (`plugins/kai/hooks/telemetry.sh:174`). What happens if `openssl` or `curl` hangs or is missing? Could telemetry delay every prompt?
- `submit-feedback.sh` uses `/tmp/kai-feedback-response.$$` (`plugins/kai/hooks/submit-feedback.sh:83`, `:125`): predictable name on a shared machine.

## H. Release and marketplace integrity (S8)

- Who can change what engineers install? `marketplace.json` sources are local paths with no commit pin (`.claude-plugin/marketplace.json:12`, `:18`). No CODEOWNERS or CI: the branch-protection state is `needs_validation`.
- `bump.sh` writes with `jq` through a temp file and `mv` (`scripts/bump.sh:103-116`); it trusts `PLUGIN` for a path (`:80`). Is the name validated against the plugin list before use in a path or a commit message (`:162`)? It also hard-codes a co-author line (`:164`).
- Consistency: `plugin.json` versions (`plugins/kai/.claude-plugin/plugin.json:3`, `plugins/kai-dev/.claude-plugin/plugin.json:3`) versus marketplace; `plugins/mosaic-admin` (3.1.0) is absent from the marketplace. Does a stale entry or retired plugin still ship live hooks (`plugins/mosaic-buddy/hooks/`)?
- Do hook commands reference `${CLAUDE_PLUGIN_ROOT}` paths only (`plugins/kai/hooks/hooks.json:19`, `:39`, `:49`, `:61`, `:72`; `plugins/kai-dev/hooks/hooks.json:9`)? Any hook command that runs a downloaded or user-writable file?
- Changelog and docs claims (README opt-out and data statements, `plugins/kai/README.md:130`) versus what the hooks do. A mismatch is a privacy-claim finding only when it hides collection.

## I. Wildcard pass (one ledger unit per run)

Seed one `wildcard` unit that the catalog above does not cover. A hunter looks for the strangest, least-reviewed or half-finished code: duplicated files that have drifted (the two `checkAuth` copies, the two `bulk-fetch.sh` copies, the three telemetry shell implementations), retired plugin content still wired anywhere, hook commands that reference missing files, `TODO` or "temporary" notes near credentials, and instructions that conflict with each other (`plugins/kai/commands/kai.md:323` versus `plugins/kai/skills/tools-init/SKILL.md:401-414`). For each, ask what a lower-trust party can reach. A flag is not a finding; trace it to a boundary and result like any other candidate.
