# ai-toolkit boundary guide

Use this reference for a focused review. Select questions that match the requested change. Do not treat an anchor as proof that every caller enforces the boundary. Anchors were read in this repository; re-open them, because line numbers drift.

## Repository questions

1. Does a hook fail open or fail closed? For each block hook, trace the parse step, the `jq` or `python3` dependency, the match logic and the exit code on every branch. `plugins/kai/hooks/block-meta-writes.sh:10-27` exits 0 when the payload cannot be parsed. `plugins/kai-dev/scripts/block-destructive-git.sh:9-14` exits 0 when `jq` fails. Compare the regex at `plugins/kai-dev/scripts/block-destructive-git.sh:17` and the matcher at `plugins/kai/hooks/hooks.json:15` with the commands and tool names they claim to stop. Relevant paths: `plugins/kai/hooks/hooks.json:1-78`, `plugins/kai-dev/hooks/hooks.json:1-15`, `plugins/mosaic-admin/hooks/hooks.json:1-16`.

2. Is a guard a deterministic script or an LLM prompt? `plugins/kai/hooks/hooks.json:9` (secret literals on Write/Edit), `plugins/kai/hooks/hooks.json:28` (admin-mcp brand allow-lists, lock suggestion) and `plugins/mosaic-admin/hooks/hooks.json:10` are `prompt` hooks. Decide whether the claimed protection holds when the model errs. Check that the brand lists in the prompt match the lists in `plugins/kai/references/admin/brand-bucket-reference.md` and the agent text.

3. Does the change widen what leaves the engineer's machine? Trace every field in the telemetry body (`plugins/kai/hooks/telemetry.sh:131-166`), the feedback body (`plugins/kai/hooks/submit-feedback.sh:43-81`) and the `tools-init` helper (`plugins/kai/skills/tools-init/SKILL.md:211-235`). Check the opt-out at `plugins/kai/hooks/telemetry.sh:17-19` and `plugins/kai/hooks/submit-feedback.sh:17-20`. Check that prompt text is only used to pick a token (`plugins/kai/hooks/telemetry.sh:104-123`).

4. Does the change touch where a credential rests? Trace `tools-init` writes to `~/.claude.json` and its backup (`plugins/kai/skills/tools-init/SKILL.md:401-414`), the `tokens.env` migration copy (`plugins/kai/skills/tools-init/SKILL.md:80-89`, `plugins/kai/skills/migrate/SKILL.md:35-40`, `plugins/kai/skills/migrate/SKILL.md:103`) and the project `.mcp.json` flow (`plugins/mosaic-admin/commands/mosaic-admin.md:26-27`, `plugins/mosaic-admin/commands/mosaic-admin.md:143`). Compare with the safety rail at `plugins/kai/commands/kai.md:322-327`. Check file mode before and after each write, backup lifetime, and whether a key can be echoed, logged or committed.

5. Does the change alter the beacon service's authentication or trust in signed fields? Trace `checkAuth` in both copies (`services/beacon-telemetry/src/server.js:17-25`, `services/beacon-telemetry/src/routes/admin.js:5-13`), the `guard` preHandler (`services/beacon-telemetry/src/routes/admin.js:18-27`), the ingest verify order (`services/beacon-telemetry/src/routes/ingest.js:57-63`) and `verify` (`services/beacon-telemetry/src/lib/hmac.js:12-33`). Identify which body fields lie outside the signature and what consumes them (`services/beacon-telemetry/src/lib/queries.js`).

6. Does stored text reach a sink? Stored `user_local`, `project`, `title`, `description` and `metadata` come from a public endpoint. Trace them through `services/beacon-telemetry/src/lib/queries.js:223-323` into `services/beacon-telemetry/src/views/dashboard.html:240` and `services/beacon-telemetry/src/views/feedback.html:97`. Check that every render uses text nodes and every query uses bound values.

7. Does a script or MCP entry run unpinned or untrusted code, or send a secret to a project-chosen host? Trace `plugins/kai/.mcp.json:3-12` (`npx -y`, `@latest`), `plugins/kai/scripts/bulk-fetch.sh:81-139` (URL and key from the nearest `.mcp.json`, JSON by concatenation) and its twin `plugins/mosaic-admin/scripts/bulk-fetch.sh`. Check `plugins/kai/scripts/sync-pdp-widget-specs.sh:31-61` (source repo path, `rm -rf` target). Check `plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py:69-113` (file path from `MOSAIC_LEXICON_JSON`, `--lexicon`, or a search of every sibling directory), `:124-129` (parse) and `:343-400` (JSON printed into agent context); the agent invokes it per `plugins/kai/skills/mixpanel-mcp/SKILL.md:67-87`. Ask who can place a file at a searched path and what the command prints.

8. Does a command, agent or skill widen what the agent can do on its own? Compare `tools:` / `allowed-tools:` lines (`plugins/kai/commands/kai.md:10`, `plugins/kai-dev/commands/kai-dev.md:11`, `plugins/mosaic-admin/commands/mosaic-admin.md:10`, `plugins/kai-dev/agents/guardian.md:6`) with the actions the prompt tells the agent to perform (`plugins/kai-dev/workflows/finalize.md:21`, `plugins/kai-dev/workflows/finalize.md:37`). Check that user-supplied text, repository files, ticket text and ad copy cannot choose a brand, a lock, a push target or a recipient the user did not approve.

9. Does the change alter release integrity? Trace `scripts/bump.sh:78-116` and `scripts/bump.sh:160-165` with `.claude-plugin/marketplace.json:7-20` and each `plugins/*/.claude-plugin/plugin.json`. Check that versions stay in sync, that no plugin is added to the marketplace without review, and that bundled content (`plugins/kai/references/admin/pdp-widget-specs/_provenance.md`) keeps its source SHA.

10. Does the change touch the container or edge? Trace `services/beacon-telemetry/Dockerfile:1-15`, `services/beacon-telemetry/railway.toml:1-8` and `services/beacon-telemetry/src/server.js:15`, `services/beacon-telemetry/src/server.js:64`. Proxy IP handling, domain exposure and TLS are platform facts; record them as needing validation.

11. Does the change touch an OAuth login or token store? The Firebase CLI runs Google OAuth, keeps tokens in `~/.config/configstore/firebase-tools.json`, and grants everything the Google account can do in the Firebase console (`plugins/kai/skills/firebase-mcp/references/setup.md:3-12`, `plugins/kai/skills/firebase-mcp/references/setup.md:18-37`, `plugins/kai/skills/firebase-mcp/references/setup.md:85-93`); it starts from `plugins/kai/.mcp.json:8-12`. Mixpanel OAuth runs in `mcp-remote` (`plugins/kai/.mcp.json:3-7`, `plugins/kai/skills/tools-init/SKILL.md:290-300`). Check that no snippet copies or prints the tokens, that no new client or scope is added, and that the `@mosaicwellness.in` account rule (`plugins/kai/skills/firebase-mcp/references/setup.md:29-31`) is described as guidance, not as an enforced control.

## Review method

Read the named source and its callers. Follow alternate routes and error paths. Inspect existing framework guards before alleging a gap. Preserve public and authorized behavior. Distinguish actor from authorized target, minimum authorized output from a leak, presentation from authority, and one business effect from one HTTP attempt.

Ask an independent reader to try to disprove a substantive claim when one is available. Do not describe a second pass by the same author as independent. If no independent check occurred, say so.

Use these dispositions:

- `source-established defect`: current source proves a lower-trust input crosses an authority boundary with a concrete consequence;
- `hardening suggestion`: useful defense-in-depth without a demonstrated boundary violation;
- `disproved`: the traced control or intended authority prevents the claim;
- `needs validation`: a specific source trace depends on deployment, identity, topology, or another fact not established here.

Do not report a runtime vulnerability during skill authoring. Do not use numeric error-code rules, generic hygiene gates, blanket product bans, or unrelated attack catalogues. Do not require visible fallbacks.

## Scope and evidence

This review is read-only. It does not authorize live testing, exploit or PoC reproduction, target execution, dependency installation, remote calls, secret access, or customer-data access. Existing authorized tests remain in their own workflow (this repo has none). Name the exact source paths read, the paths not reviewed, and any missing evidence. Do not invent permissions, helpers, deployments, or runtime behavior.

## Pinned provenance and attribution

Adapted preventive methods are sourced from the pinned Cloudflare repository: https://github.com/cloudflare/security-audit-skill/tree/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8. Selected upstream files: `SKILL.md`, `RECONNAISSANCE.md`, `VALIDATION-AND-REPORTING.md`, `CLIENT-SIDE.md`, `AI-AND-LLM.md`, `WEB-PROTOCOL-AND-AUTH.md`, `PROTOCOLS-RPC-AND-MESSAGING.md`, `DATA-ISOLATION-AND-LIFECYCLE.md`, and `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md`. Only boundary-first reasoning, bounded evidence, source-visibility limits, independent disproof, and separation of certainty from hardening were paraphrased. Upstream orchestration, budgets, schemas, scripts, PoCs, and full-audit output layouts were not imported.

### MIT License

Copyright (c) 2025-2026 Cloudflare, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
