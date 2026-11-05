# ai-toolkit security policy

Read before scoping, writing, testing or reviewing any change to a plugin hook, hook script, MCP configuration, credential-provisioning skill, command or agent prompt, helper script, release script, marketplace entry, or `services/beacon-telemetry`.
Rules below are required invariants. Anchors name a control or a boundary that must hold. They do not certify that every caller or installed machine enforces it.
This repo has no `docs/review-contract/manifest.yaml`, no review-runner, no kit manifest, no test files and no CI workflow (`git ls-files` lists none). Reviewers apply the **Review checks** section directly. Every test recipe below is labelled **Proposed**.
This repo is a plugin marketplace. Its markdown, hooks and MCP entries run on every installing engineer's machine and steer their agents. Treat a change to those files as a change to code that executes with the engineer's own permissions.

## Threat model

| Boundary | Trust decision and source anchor |
| --- | --- |
| Marketplace → engineer's agent | The marketplace lists `kai` and `kai-dev` (`.claude-plugin/marketplace.json:7-20`). An installed plugin runs its hooks as shell commands (`plugins/kai/hooks/hooks.json:19`, `plugins/kai/hooks/hooks.json:39`, `plugins/kai/hooks/hooks.json:49`, `plugins/kai-dev/hooks/hooks.json:9`) and loads its commands, agents and skills into the agent. Whoever can merge to `main` controls all of that. No CI, CODEOWNERS or tag pin exists in the repo. |
| Tool input → hook | A hook receives tool name and input on stdin. Block hooks are `bash` scripts (`plugins/kai/hooks/block-meta-writes.sh:10-27`, `plugins/kai-dev/scripts/block-destructive-git.sh:6-14`) or LLM `prompt` hooks (`plugins/kai/hooks/hooks.json:9`, `plugins/kai/hooks/hooks.json:28`, `plugins/mosaic-admin/hooks/hooks.json:10`). A parse failure currently allows the call. Prompt hooks are model judgment, not a deterministic gate. |
| Command output → agent | `check-leaked-keys.sh` runs after Bash (`plugins/kai/hooks/hooks.json:33-43`, `plugins/kai/hooks/check-leaked-keys.sh:21-24`). It reports after the output exists; it cannot un-expose it. |
| User prompt / project files → agent steering | `/kai` and agent prompts take user input and read the user's project (`plugins/kai/commands/kai.md:10`). Agents hold `Bash`, `Write` and `Edit` (`plugins/kai/agents/debugger.md:8`, `plugins/kai-dev/agents/builder.md:6`). File, ad-copy and transcript content that agents read is untrusted. |
| Agent → MCP servers | `plugins/kai/.mcp.json:1-18` starts `mcp-remote` and `firebase-tools@latest` through `npx -y` and points `kai-mcp` at an HTTPS URL. Admin-mcp, New Relic and Meta tools come from user-level config and a connector. Write gating is partly hooks (`plugins/kai/hooks/hooks.json:14-31`) and partly downstream servers outside this repo. |
| Engineer machine → credential files | `tools-init` writes literal keys into `~/.claude.json` and keeps a timestamped copy (`plugins/kai/skills/tools-init/SKILL.md:401-414`). `~/.config/kai/tokens.env` is the fallback (`plugins/kai/skills/tools-init/SKILL.md:80-89`). The mosaic-admin setup flow writes an admin key into a project `.mcp.json` (`plugins/mosaic-admin/commands/mosaic-admin.md:26-27`, `plugins/mosaic-admin/commands/mosaic-admin.md:143`). The Firebase CLI stores Google OAuth tokens in `~/.config/configstore/firebase-tools.json` (`plugins/kai/skills/firebase-mcp/references/setup.md:35-37`). |
| Engineer machine → telemetry service | Hooks POST engineer email local part, repo name and session id to the Railway service on every session and `/kai` call (`plugins/kai/hooks/telemetry.sh:131-174`). Feedback adds free text (`plugins/kai/hooks/submit-feedback.sh:83-87`). The signing key has a built-in default in source (`plugins/kai/hooks/telemetry.sh:15`, `services/beacon-telemetry/src/lib/hmac.js:3`). |
| Internet → `beacon-telemetry` ingest | `POST /v2/ingest` and `POST /v2/feedback` are public. Control: HMAC over four fields plus a 300-second window plus a per-IP counter (`services/beacon-telemetry/src/routes/ingest.js:57-63`, `services/beacon-telemetry/src/lib/hmac.js:12-33`, `services/beacon-telemetry/src/lib/rateLimit.js:6-16`). |
| Browser/curl → `beacon-telemetry` admin | `GET /`, `/feedback` and `/api/*` use one static token. Auth is skipped when the token is unset (`services/beacon-telemetry/src/server.js:17-25`, `services/beacon-telemetry/src/routes/admin.js:5-23`). The token travels in the query string (`services/beacon-telemetry/src/views/dashboard.html:222`). |
| Service → store | PostgreSQL through Prisma (`services/beacon-telemetry/prisma/schema.prisma:5-45`). Admin reads use `$queryRaw` tagged templates (`services/beacon-telemetry/src/lib/queries.js:14-30`). The container runs `prisma migrate deploy` at start (`services/beacon-telemetry/Dockerfile:15`). |
| Release process → installs | `scripts/bump.sh` edits `plugin.json`, `marketplace.json` and `CHANGELOG.md` and can commit (`scripts/bump.sh:106-116`, `scripts/bump.sh:160-165`). Installs follow the marketplace entry; the entry pins no commit SHA. |

<a id="sec-p01"></a>
## SEC-P01 Object ownership not checked (IDOR / BOLA) — Not applicable

Proof: `services/beacon-telemetry/src/routes/admin.js:29-40` and `services/beacon-telemetry/src/routes/ingest.js:26-153` define no route that selects a stored record by an identifier (no `:id` path, no id query or body field read; `feedbackRecent` returns the newest rows to the single admin, `services/beacon-telemetry/src/lib/queries.js:314-323`). The plugins hold no user records; admin-mcp page, habit and lock identifiers are resolved by servers outside this repo. Re-scope when a route reads or writes one row by a caller-supplied id, or when a plugin starts storing per-user records.

<a id="sec-p02"></a>
## SEC-P02 Identity taken from client input — Applies

- **P0 invariant:** a recorded actor, user or brand comes from a verified source, never from a field the caller can set freely. Where a field is only a label, store and display it as a label.
- `user_local` and `project` in the ingest body are caller-chosen; the HMAC covers `plugin`, `event_type`, `user_local` and `ts` only (`services/beacon-telemetry/src/routes/ingest.js:50-57`, `services/beacon-telemetry/src/lib/hmac.js:6-10`). The client takes them from `git config user.email` (`plugins/kai/hooks/telemetry.sh:133-135`). Treat the dashboard's per-user rows as unverified labels. Do not use them for access, billing or HR decisions.
- `project`, `subcommand`, `session_id`, `os` and `metadata` sit outside the signature. Do not add logic that trusts them.
- Plugin hooks read `tool_name` and `tool_input` from the hook payload (`plugins/kai-dev/scripts/block-destructive-git.sh:9`). Brand for admin-mcp writes is a tool argument, checked only by a prompt hook (`plugins/kai/hooks/hooks.json:28`). It is a guard on an argument, not proof of the acting brand.

<a id="sec-p03"></a>
## SEC-P03 Authentication not enforced or fails open — Applies

- **P0 invariant:** every route outside the explicit public set rejects missing or wrong credentials before the handler runs, and every guard hook rejects on parse failure for the action it exists to stop.
- Public set today: `GET /health`, `POST /v2/ingest`, `POST /v2/feedback`, and the retired `GET /t` and `POST /beacon/telemetry` (`services/beacon-telemetry/src/server.js:39`, `services/beacon-telemetry/src/routes/ingest.js:26`, `services/beacon-telemetry/src/routes/ingest.js:99`, `services/beacon-telemetry/src/routes/ingest.js:152-153`). Everything else goes through `checkAuth`.
- `checkAuth` returns true when `TELEMETRY_ADMIN_TOKEN` is empty (`services/beacon-telemetry/src/server.js:18`, `services/beacon-telemetry/src/routes/admin.js:6`). A deploy that forgets the variable serves every engineer's email local part, project name and feedback text without a credential. Treat the empty-token branch as the control to fix or to confirm with the deploy owner.
- Both copies of `checkAuth` (`services/beacon-telemetry/src/server.js:17-25`, `services/beacon-telemetry/src/routes/admin.js:5-13`) must change together. A new route reuses the `guard` preHandler (`services/beacon-telemetry/src/routes/admin.js:18-27`).
- Hooks: `block-meta-writes.sh` exits 0 when it cannot parse the payload (`plugins/kai/hooks/block-meta-writes.sh:23-27`); `block-destructive-git.sh` exits 0 when `jq` fails or is absent (`plugins/kai-dev/scripts/block-destructive-git.sh:9-14`). A new block hook states its failure behaviour and defaults to deny for the action it guards.

<a id="sec-p04"></a>
## SEC-P04 Weak credentials, OTP and token lifecycle — Applies

- **P0 invariant:** a credential this repo issues, stores or documents has a defined scope, a rotation path and a safe resting place. No credential reaches a URL, log, committed file or world-readable backup.
- Admin token: one static shared secret, no expiry, no rotation path in source, accepted in `?token=` (`services/beacon-telemetry/src/server.js:23`, `services/beacon-telemetry/src/routes/admin.js:11`). The browser pages copy it into every API URL and link (`services/beacon-telemetry/src/views/dashboard.html:222`, `services/beacon-telemetry/src/views/dashboard.html:268`, `services/beacon-telemetry/src/views/dashboard.html:646`). The server logs each request (`services/beacon-telemetry/src/server.js:15`). Prefer the `Authorization` header; do not add new places that echo the query string.
- Engineer keys: `tools-init` writes literal `NRAK`/`amk` style keys into `~/.claude.json`, sets mode 600 after the write, and first copies the file to `~/.claude.json.bak.<epoch>` (`plugins/kai/skills/tools-init/SKILL.md:401-414`). The copy is never removed by the skill and `cp` runs before the `chmod`. The command's safety rail says tokens go only to `tokens.env` (`plugins/kai/commands/kai.md:323`), which the skill contradicts. Resolve the contradiction before adding another provisioning path.
- No login, OTP or session exists in this repo's own code.

<a id="sec-p05"></a>
## SEC-P05 Federated / social login trust — Applies

- **P0 invariant:** a federated login this repo wires up runs in the vendor's client against the intended identity, stores its tokens only in the vendor's own store with owner-only access, and grants no more scope than the stated job. This repo implements no sign-in of its own.
- Firebase: `plugins/kai/.mcp.json:8-12` starts `npx -y firebase-tools@latest mcp`. The setup reference documents a Google OAuth login through the Firebase CLI, run on demand or with `login`; tokens rest in `~/.config/configstore/firebase-tools.json` and refresh automatically (`plugins/kai/skills/firebase-mcp/references/setup.md:3-12`, `plugins/kai/skills/firebase-mcp/references/setup.md:18-37`). The same reference states that the grant covers everything the engineer's Google account can do in the Firebase console (`plugins/kai/skills/firebase-mcp/references/setup.md:85-93`). The `@mosaicwellness.in` account check is user guidance only; nothing in this repo enforces it (`plugins/kai/skills/firebase-mcp/references/setup.md:29-31`, `plugins/kai/skills/firebase-mcp/references/setup.md:58-61`). The CLI and its token store are outside this repo, and `@latest` makes the client version unpinned (SEC-P10).
- Mixpanel: OAuth runs in `mcp-remote` against the vendor endpoint (`plugins/kai/.mcp.json:3-7`, `plugins/kai/skills/tools-init/SKILL.md:290-300`). Treat its token store the same way.
- Do not add a new OAuth client, token cache or "log in as" flow without a policy decision. Do not copy a Google token out of the configstore into `tokens.env`, `~/.claude.json` or any tracked file. Keep the "no `tokens.env` entry" rule for Firebase (`plugins/kai/skills/firebase-mcp/references/setup.md:124-128`).
- The beacon service has no sign-in: `git grep -i -E "email_verified|openid|passport|id_token|googleLogin|oauth" -- services scripts` (excluding markdown and lockfiles) returns no match. Re-scope that service if the dashboard gets SSO.

<a id="sec-p06"></a>
## SEC-P06 Service-to-service trust — Applies

- **P0 invariant:** each caller class has its own credential, set to a nonempty value or the credential is disabled, compared in constant time, and rejected on any verification error. A credential printed in source is public.
- Telemetry signing key: the default is a literal in three places (`services/beacon-telemetry/src/lib/hmac.js:3`, `plugins/kai/hooks/telemetry.sh:15`, `plugins/kai/hooks/submit-feedback.sh:15`) and a fourth in `plugins/kai/skills/tools-init/SKILL.md:224`. Anyone who can read the repo can sign events for any `user_local`. The env keys are `KAI_HMAC_KEY` and `TELEMETRY_HMAC_KEY`. Do not write the default value into new files, docs or tests.
- `verify` uses `timingSafeEqual` on equal-length buffers and rejects on malformed hex (`services/beacon-telemetry/src/lib/hmac.js:12-33`). Keep it. The admin token compare is `===` (`services/beacon-telemetry/src/server.js:24`, `services/beacon-telemetry/src/routes/admin.js:12`).
- Admin-mcp key travels as the `x-api-key` header (`plugins/kai/scripts/bulk-fetch.sh:101`, `plugins/kai/scripts/bulk-fetch.sh:137`). Send it only to the URL named in the same `.mcp.json`.

<a id="sec-p07"></a>
## SEC-P07 Webhook and inbound-event authenticity — Applies

- **P0 invariant:** an inbound event receiver verifies a signature over every field it acts on, checks freshness, and bounds replay, before any state change.
- `POST /v2/ingest` and `POST /v2/feedback` are inbound event receivers (`services/beacon-telemetry/src/routes/ingest.js:26`, `services/beacon-telemetry/src/routes/ingest.js:99`). `verify` runs before the database write (`services/beacon-telemetry/src/routes/ingest.js:57-59`, `services/beacon-telemetry/src/routes/ingest.js:120-122`). The signature does not cover `project`, `subcommand`, `session_id`, `os`, `command`, `plugin_version`, `metadata`, `rating`, `title` or `description`. For feedback it signs the constants `kai` and `feedback_submitted` plus `user_local` and `ts`. The replay window is 300 seconds with no nonce store (`services/beacon-telemetry/src/lib/hmac.js:4`). New event types or fields that drive a decision need signature coverage and a replay bound.
- Unknown `plugin` values and the retired `mosaic-buddy` value return 204 without a signature check (`services/beacon-telemetry/src/routes/ingest.js:37-45`). Keep that branch free of side effects other than the counter.

<a id="sec-p08"></a>
## SEC-P08 Secrets and sensitive data exposure — Applies

- **P0 secrets; P1 data-exposure invariant:** secrets stay out of source, fixtures, docs and logs. Personal data leaves a machine only for a stated purpose, with the opt-out intact.
- Collected per event: email local part, repo directory name, session id, OS, plugin version (`plugins/kai/hooks/telemetry.sh:131-166`). Feedback adds free text up to 2000 characters (`services/beacon-telemetry/src/routes/ingest.js:110`). Tables have no retention or deletion path (`services/beacon-telemetry/prisma/schema.prisma:10-45`). Opt-out is `KAI_TELEMETRY_URL=off` (`plugins/kai/hooks/telemetry.sh:17-19`, `plugins/kai/hooks/submit-feedback.sh:17-20`). Do not widen what a hook sends (prompt text, paths, file names, tool input) without a policy decision and a README update.
- Never send prompt text. `telemetry.sh` reads the prompt only to pick a lowercased token (`plugins/kai/hooks/telemetry.sh:104-123`). Keep that.
- `check-leaked-keys.sh` has a fixed, narrow pattern list and runs after the output exists (`plugins/kai/hooks/check-leaked-keys.sh:21-24`). It is a tripwire, not a guarantee. `tools-init` deliberately writes keys to a temp file so the hook does not see them (`plugins/kai/skills/tools-init/SKILL.md:396-398`).
- `coach` and `coach-lite` read the engineer's session transcripts under `~/.claude/projects/` and write an HTML report (`plugins/kai/agents/coach-lite.md:20-29`, `plugins/kai/agents/coach-lite.md:59-70`). The report stays local; any new outbound step from these agents needs review.
- Never put a literal key, token, password or connection string in any tracked file. Name the env key only. The Write hook blocks literals (`plugins/kai/hooks/hooks.json:9`).

<a id="sec-p09"></a>
## SEC-P09 Injection — Applies

- **P0 invariant:** untrusted values stay data. Shell scripts quote every expansion, build JSON with a JSON encoder, and never pass untrusted text to `eval` or an unquoted command position. SQL takes bound parameters. Rendered HTML uses text nodes.
- Shell: `telemetry.sh` builds its body with a heredoc around `json_escape` output (`plugins/kai/hooks/telemetry.sh:67-80`, `plugins/kai/hooks/telemetry.sh:145-166`). `submit-feedback.sh` builds JSON with `python3` and `json.dumps` (`plugins/kai/hooks/submit-feedback.sh:66-81`). `bulk-fetch.sh` builds its tool-call JSON by string concatenation from arguments (`plugins/kai/scripts/bulk-fetch.sh:116-120`, `plugins/kai/scripts/bulk-fetch.sh:131`); a quote or brace in an identifier changes the request. Use `jq --arg` for new code.
- SQL: every `$queryRaw` uses tagged-template bound values; `days` and `limit` are clamped numbers (`services/beacon-telemetry/src/lib/queries.js:6-9`, `services/beacon-telemetry/src/lib/queries.js:302-312`). Never switch to `$queryRawUnsafe` or build SQL with string concatenation.
- HTML: both pages build DOM with `textContent` (`services/beacon-telemetry/src/views/dashboard.html:240`, `services/beacon-telemetry/src/views/feedback.html:97`); no `innerHTML`, `outerHTML` or `eval` exists in `services/beacon-telemetry/src`. Stored `user_local`, `project`, `title` and `description` come from the public ingest. Keep text-node rendering.
- Prompt injection: files, ad copy, Jira text and web pages that an agent reads are untrusted. They must not select a tool, brand, lock or recipient that the user did not approve. See SEC-P12 and SEC-P13.
- Hook regexes that match command text are heuristics (`plugins/kai-dev/scripts/block-destructive-git.sh:17`, `plugins/kai/hooks/hooks.json:15`). Do not describe them as complete.

<a id="sec-p10"></a>
## SEC-P10 Outbound requests and storage scope (SSRF) — Applies

- **P0 invariant:** a destination comes from fixed source or an explicitly user-owned config key. A destination read from a project file or the environment is a trust decision.
- Telemetry destination defaults to a fixed HTTPS host and is replaced by `KAI_TELEMETRY_URL` (`plugins/kai/hooks/telemetry.sh:12`, `plugins/kai/hooks/submit-feedback.sh:14`). Setting the variable elsewhere redirects every event.
- `bulk-fetch.sh` takes the MCP URL and API key from the first `.mcp.json` found walking up from the working directory (`plugins/kai/scripts/bulk-fetch.sh:81-101`). A `.mcp.json` the engineer did not write supplies both values.
- `mosaic-admin` grants `WebFetch` (`plugins/mosaic-admin/commands/mosaic-admin.md:10`). `tools-init` probes vendor APIs live (`plugins/kai/commands/kai.md:318-320`). A new fetch from a plugin names its fixed destination.
- `.mcp.json` runs `npx -y mcp-remote` and `npx -y firebase-tools@latest` (`plugins/kai/.mcp.json:3-12`). The second is unpinned code that runs at session start. Pin or document any new `npx` entry.
- `lexicon-query.py` reads a local JSON file whose path comes from `MOSAIC_LEXICON_JSON`, `--lexicon`, or a search of every sibling directory of the working directory (`plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py:69-113`). It parses the file and prints query results to stdout, which enters agent context (`plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py:124-129`, `plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py:398-400`; invoked per `plugins/kai/skills/mixpanel-mcp/SKILL.md:67-87`). A new file-reading helper names its fixed source, does not search unrelated directories, and prints only the fields the task needs.
- The telemetry service makes no outbound request (`services/beacon-telemetry/src/server.js`, `services/beacon-telemetry/src/routes/ingest.js`).

<a id="sec-p11"></a>
## SEC-P11 Cross-brand / tenant isolation — Applies

- **P0 invariant:** a write to a brand-scoped system names the brand explicitly, only for a brand in the supported set, and warns when it is not the default.
- Brand scoping lives in the admin-mcp write guard: an 18-brand allow-list for PDP and widget writes and a 7-brand allow-list for habit tools, in an LLM prompt hook (`plugins/kai/hooks/hooks.json:23-31`). The older mosaic-admin plugin only warns on a non-default brand and blocks nothing (`plugins/mosaic-admin/hooks/hooks.json:10`). The enforcing authority is the admin-mcp server, outside this repo.
- A change that adds a brand, a write tool prefix or a habit tool must update the allow-lists in the same commit as the agent and reference text (`plugins/kai/references/admin/brand-bucket-reference.md`, `plugins/kai/hooks/hooks.json:28`).
- Telemetry keeps one table for all engineers; `plugin` is limited to three values (`services/beacon-telemetry/src/routes/ingest.js:4`, `services/beacon-telemetry/src/lib/queries.js:4`). Every query on `beacon_events` must keep the `plugin = ANY(...)` filter. `beacon_feedback` has no `plugin` column (`services/beacon-telemetry/prisma/schema.prisma:32-45`), so its queries (`services/beacon-telemetry/src/lib/queries.js:314-358`) are exempt; they still need a clamped window or limit.

<a id="sec-p12"></a>
## SEC-P12 Role and privilege boundaries — Applies

- **P0 invariant:** an agent, command or hook gets the minimum tools its job needs, and a prose "read-only" rule is not a capability limit.
- Tool grants are set in front-matter (`plugins/kai/commands/kai.md:10`, `plugins/kai/agents/doctor.md:8`, `plugins/kai-dev/agents/guardian.md:6`, `plugins/mosaic-admin/commands/mosaic-admin.md:10`). Review agents such as `doctor`, `reviewer` and `guardian` hold `Bash`; their read-only limit is prose (`plugins/kai-dev/agents/guardian.md:145`). `kai-dev` holds `Bash`, `Write` and `Edit` and runs `git push` and `gh pr create` (`plugins/kai-dev/commands/kai-dev.md:11`, `plugins/kai-dev/workflows/finalize.md:21`, `plugins/kai-dev/workflows/finalize.md:37`).
- A new or widened `tools:` / `allowed-tools:` line needs a stated reason. Prefer removing `Bash` from reviewers.
- The telemetry admin has one role: whoever holds the token sees everything (`services/beacon-telemetry/src/routes/admin.js:29-40`).
- The Meta Ads write block matches a fixed tool-name set (`plugins/kai/hooks/hooks.json:15`, `plugins/kai/hooks/block-meta-writes.sh:34-64`). Meta tools with other verbs are not in the matcher (for example delete, boost, pixel or permission verbs). Confirm the full connector tool list before relying on the block.

<a id="sec-p13"></a>
## SEC-P13 Business-logic integrity and abuse limits — Applies

- **P1 invariant:** actions that spend money, change live pages or message people need an explicit user approval, a lock or a hard block, and a bounded event rate.
- Spend: Meta Ads is read-only by design, enforced by hook (`plugins/kai/hooks/block-meta-writes.sh:43-52`). Do not remove or loosen it.
- Page and habit writes: the guard only suggests a `lock_token`; it does not require one (`plugins/kai/hooks/hooks.json:28`). Staging-only is stated in skill text (`plugins/kai/skills/admin-essentials/SKILL.md:16`) and enforced by the server, not here. `kai-dev` asks before moving a Jira ticket (`plugins/kai-dev/workflows/finalize.md:76`).
- Telemetry abuse: 30 requests per minute per IP in a process-local map (`services/beacon-telemetry/src/lib/rateLimit.js:1-16`). With a shared key, an attacker can fill `beacon_events` and `beacon_feedback` with forged rows; no per-user quota or retention exists. Any dashboard metric (DAU, funnel) is advisory.

<a id="sec-p14"></a>
## SEC-P14 Robustness of input handling (DoS) — Applies

- **P1 invariant:** validate types and sizes at the boundary, bound work (body, list size, window, cache), and finish every request with a typed response.
- Ingest: required strings are type-checked, event type and plugin are allow-listed, metadata is capped at 1024 bytes, text fields are clamped (`services/beacon-telemetry/src/routes/ingest.js:33-90`, `services/beacon-telemetry/src/routes/ingest.js:107-111`). The body size is the Fastify default; this repo sets no `bodyLimit` (`services/beacon-telemetry/src/server.js:15`).
- The rate limiter keys on `request.ip` (`services/beacon-telemetry/src/routes/ingest.js:61`). Fastify is created without `trustProxy` (`services/beacon-telemetry/src/server.js:15`). Behind a platform proxy the key may be the proxy address for all callers. This needs validation with the platform owner (see SEC-P15). The map is cleaned every 300 seconds, so a burst of distinct IPs grows it between sweeps (`services/beacon-telemetry/src/lib/rateLimit.js:18-23`).
- Dashboard queries: `days` is clamped to 1–365 and `limit` to 1–500 (`services/beacon-telemetry/src/lib/queries.js:6-9`, `services/beacon-telemetry/src/lib/queries.js:303`). The `users` and `heatmap` queries have no row limit (`services/beacon-telemetry/src/lib/queries.js:223-241`, `services/beacon-telemetry/src/lib/queries.js:260-270`). Keep new queries bounded.
- Hooks run on each prompt. `UserPromptSubmit` runs synchronously with a 3-second curl budget (`plugins/kai/hooks/hooks.json:67-76`, `plugins/kai/hooks/telemetry.sh:169-174`). A hook that blocks must be fast and must not hang the session.
- Shell helpers: `submit-feedback.sh` writes a predictable `/tmp` file name (`plugins/kai/hooks/submit-feedback.sh:83`); `sync-pdp-widget-specs.sh` runs `rm -rf` on a path derived from the script location (`plugins/kai/scripts/sync-pdp-widget-specs.sh:35`, `plugins/kai/scripts/sync-pdp-widget-specs.sh:61`).

<a id="sec-p15"></a>
## SEC-P15 Edge, CORS and infrastructure exposure — Applies

- **P2 invariant:** the service sets only the headers and origins it needs, trusts proxy headers only from known proxies, and keeps authenticated responses out of shared caches. Network controls never replace authentication.
- The beacon service registers no CORS plugin, no security headers and no `Cache-Control` on its authenticated JSON or HTML (`services/beacon-telemetry/src/server.js:36-57`, `services/beacon-telemetry/src/routes/admin.js:29-40`). It listens on all interfaces (`services/beacon-telemetry/src/server.js:64`). The Railway config sets health-check and restart policy only (`services/beacon-telemetry/railway.toml:1-8`). Domain exposure, proxy IP forwarding, TLS and any network allow-list are platform facts that source cannot prove.
- The container image runs as root, installs from `package.json` without the committed lockfile, and applies migrations at start (`services/beacon-telemetry/Dockerfile:7-8`, `services/beacon-telemetry/Dockerfile:15`). `package-lock.json` is tracked but not copied.
- Add `Cache-Control: no-store` to new authenticated responses.

## Scoping checklist

Answer each question yes/no in every plan, including Software Factory plans. A yes names the guard, the planned negative test and affected consumers. Flag changes to hooks, credential handling, telemetry fields and agent tool grants for a human decision.

| Pattern | Question |
| --- | --- |
| SEC-P01 | Does a new route or tool select a stored record by a caller-supplied id? Reassess applicability. |
| SEC-P02 | Does a decision, display or block rely on a caller-set field such as `user_local`, `project`, a hook `tool_input` value or a brand argument? Which verified source backs it? |
| SEC-P03 | Does it add or change a beacon route, the `checkAuth` rule, or a hook's behaviour when its parser or `jq` fails? |
| SEC-P04 | Does it touch the admin token, where a key is written (`~/.claude.json`, `tokens.env`, project `.mcp.json`), its file mode or its backups? |
| SEC-P05 | Does it add or change an OAuth login or token store (Firebase CLI configstore, `mcp-remote` for Mixpanel, a new client), widen a granted scope, or copy a vendor token elsewhere? |
| SEC-P06 | Does it add or change a signing key, API key, header credential or its default? |
| SEC-P07 | Does it add an event type, a field a decision depends on, or an inbound receiver? Is the new field inside the signature? |
| SEC-P08 | Can a new field, prompt text, path, transcript content or credential reach telemetry, logs, a committed file or a backup? |
| SEC-P09 | Does untrusted text reach a shell expansion, JSON built by concatenation, a SQL string or an HTML sink? |
| SEC-P10 | Does a hook, script or agent contact a new host, or read a URL or key from a project file or the environment? Is any `npx` entry pinned? |
| SEC-P11 | Does it add a brand, a write-tool prefix or a habit tool, and are all allow-lists updated together? |
| SEC-P12 | Does it add or widen `tools:` / `allowed-tools:`, add a hook matcher, or rely on prose as a limit? |
| SEC-P13 | Can the change spend money, publish a page, message people or move a ticket without approval, a lock or a block? Can a script flood the telemetry tables? |
| SEC-P14 | Can a malformed body, a large window or an unbounded query, or a slow hook, cause unbounded work or a stalled session? |
| SEC-P15 | Does it change service headers, proxy trust, the Dockerfile, `railway.toml`, or ingress assumptions? |

## Write-time rules

- **SEC-P02:** store `user_local`, `project` and `subcommand` as labels only. Do not gate anything on them.
- **SEC-P03:** keep `checkAuth` identical in `services/beacon-telemetry/src/server.js` and `services/beacon-telemetry/src/routes/admin.js`; new routes use `guard`. A guard hook decides explicitly what happens on a parse failure.
- **SEC-P04:** read the admin token from the header; never print it, and do not add new `?token=` links. A key written to disk gets mode 600 before it is filled, and its backup is removed or protected.
- **SEC-P05:** keep OAuth in the vendor client (Firebase CLI, `mcp-remote`); do not copy its tokens elsewhere, add a new client, or claim in docs that the repo enforces the Google account domain. Pin the CLI version when `.mcp.json` changes.
- **SEC-P06:** never write a signing key, API key or token value in a file. Name the env key (`KAI_HMAC_KEY`, `TELEMETRY_HMAC_KEY`, `TELEMETRY_ADMIN_TOKEN`). Compare secrets with `timingSafeEqual`.
- **SEC-P07:** a field that drives a decision is inside the signed string; a new event type is added to `ALLOWED_EVENT_TYPES` deliberately.
- **SEC-P08:** hooks send no prompt text, paths or tool input. Keep `KAI_TELEMETRY_URL=off` working in every script that makes a request.
- **SEC-P09:** build JSON with `jq --arg` or `python3 json.dumps`; quote shell expansions; keep `$queryRaw` tagged templates and `textContent`.
- **SEC-P10:** pin `npx` package versions; fixed hosts in source; do not read a destination from an untrusted project file without a prompt.
- **SEC-P11:** update both brand allow-lists and the reference doc together.
- **SEC-P12:** list the minimum tools; give a reason for every `Bash`, `Write` or `Edit` on a review agent.
- **SEC-P13:** keep the Meta Ads block; require an explicit user approval before any live write or ticket transition.
- **SEC-P14:** bound new queries with `LIMIT` and a clamped window; keep hook curl timeouts.
- **SEC-P15:** `Cache-Control: no-store` on new authenticated responses; do not derive identity from forwarded headers.

## Review checks

A missing negative test for a touched pattern is **P1**. A missing or weakened guard is **P0**.
Removing or weakening a rule here, a path in `.claude/rules/security-policy.md`, the policy entry lines in `CLAUDE.md`/`AGENTS.md`, a block hook, or an auth check is **P0 for every author**.
Read the hook registration in `hooks.json`, the matcher regex, and what the script does on every failure branch. A passing syntax check proves nothing about authorization.

| Pattern | Check | Severity |
| --- | --- | --- |
| SEC-P02 | No decision or display treats a caller-set label as verified identity. | P1 |
| SEC-P03 | Every non-public beacon route uses `checkAuth`/`guard`; both copies match; a block hook denies on parse failure for the guarded action. | P0 |
| SEC-P04 | Admin token and engineer keys: no new query-string use, correct file mode before write, backups handled. | P0 |
| SEC-P05 | OAuth tokens stay in the vendor store; no new client or token copy; granted scope and domain claims match what the repo can enforce. | P0 token copy; P1 otherwise |
| SEC-P06 | No credential value in source; constant-time compare; key sent only to its own URL. | P0 |
| SEC-P07 | Fields that drive a decision are signed; a replay bound exists. | P1 |
| SEC-P08 | No secret in a tracked file; no new data in telemetry without a documented purpose; opt-out works. | P0 secrets; P1 data |
| SEC-P09 | JSON, SQL and HTML sinks receive data, not structure. | P0 |
| SEC-P10 | Destinations are fixed or user-owned; `npx` entries pinned. | P1 |
| SEC-P11 | Brand allow-lists consistent across hook, agent and reference. | P1 |
| SEC-P12 | Each tool grant has a reason; reviewer agents do not gain write tools. | P1 |
| SEC-P13 | The Meta Ads block and the live-write approvals are intact. | P0 for spend; P1 otherwise |
| SEC-P14 | New queries bounded; hooks fast and time-limited. | P1 |
| SEC-P15 | No new header, proxy trust or image change weakens the edge. | P2; P1 exposure |

## Negative test recipes

This repo has no test runner, no test files and no CI. Every recipe is **Proposed**. A minimal first choice is `node --test` for `services/beacon-telemetry` (`package.json` lists no test script) and `bash` fixture scripts that pipe a JSON payload into a hook and check the exit code. Use synthetic values and never real keys. Do not contact a live service.

| Pattern | Proposed rejection test |
| --- | --- |
| SEC-P02 | Proposed: send a valid signature for `user_local` A and a different `project`; assert the stored row is labelled but no logic changes. |
| SEC-P03 | Proposed: start the app with an empty and a set `TELEMETRY_ADMIN_TOKEN`; assert 401 on `/api/overview` without a token when the token is set, and decide and assert the empty-token behaviour. Pipe a malformed payload into `plugins/kai/hooks/block-meta-writes.sh` and `plugins/kai-dev/scripts/block-destructive-git.sh` and assert the intended exit code. |
| SEC-P04 | Proposed: assert `/api/*` accepts the header and, once changed, rejects `?token=`. Script the `tools-init` write step against a temp HOME and assert the backup mode. |
| SEC-P05 | Proposed: grep gate that no tracked file or setup snippet writes `firebase-tools.json` contents elsewhere, and that `.mcp.json` pins the `firebase-tools` version. |
| SEC-P06 | Proposed: assert `verify` rejects a wrong-length hex signature, an odd-length hex string and a stale `ts`. |
| SEC-P07 | Proposed: replay one signed body twice within the window and assert the chosen replay behaviour. Assert unsigned fields never alter a decision. |
| SEC-P08 | Proposed: run `telemetry.sh` against a fake `UserPromptSubmit` payload with a marker string in the prompt and assert the marker is absent from the posted body. Assert `KAI_TELEMETRY_URL=off` sends nothing. |
| SEC-P09 | Proposed: pass an identifier containing a quote and brace to `bulk-fetch.sh` against a stub server and assert the JSON stays one valid object. Post HTML in `title`; assert the page uses text nodes. |
| SEC-P10 | Proposed: grep gate that every `npx` entry in `.mcp.json` carries a version. |
| SEC-P11 | Proposed: a script that extracts brand lists from `hooks.json` and the reference doc and fails if they differ. |
| SEC-P12 | Proposed: a script that fails when a review agent front-matter lists `Write` or `Edit`. |
| SEC-P13 | Proposed: feed each known Meta write tool name to `block-meta-writes.sh` and assert exit 2; feed a read tool and assert exit 0. |
| SEC-P14 | Proposed: post an oversized body and a 1025-byte `metadata`; assert a bounded 4xx. Run the 31st request in a minute from one IP and assert 429. |
| SEC-P15 | Proposed: assert authenticated responses carry `Cache-Control: no-store` once added. |
