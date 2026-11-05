---
name: security-audit
description: Run a full, deep, source-only security audit of ai-toolkit (Claude Code plugin marketplace: hooks, MCP configs, agent prompts, helper scripts, and the beacon-telemetry service) only when explicitly invoked; never auto-triggered.
disable-model-invocation: true
---

# Security Audit (ai-toolkit)

Find vulnerabilities in this repository that cross a real trust boundary. Give owners source evidence, priority, and the smallest fix. A candidate with no named principal, resource, and security result is not a finding.

This repo is mostly markdown, shell and JSON that installs into every Mosaic engineer's agent, plus one small Fastify service. Hooks run shell commands on engineer machines. Commands, agents and skills steer agents that hold `Bash`, `Write` and `Edit`. Treat the whole tree as an executable supply-chain and agent-instruction surface.

This skill runs only when an engineer invokes it (`/security-audit` in Claude, `$security-audit` in Codex). It audits the whole repo or a named scope. It is not the per-change review: for one change or one boundary, use `preventive-security-review`.

Arguments: a profile (`deep` default, `standard`, `quick`) and/or a scope (repo-relative paths, one sub-system id from [references/reconnaissance.md](references/reconnaissance.md), or `diff <refA>..<refB>`). Example: `/security-audit standard S1 S3 services/beacon-telemetry`.

## Safety (non-negotiable)

- Source-only and read-only on the target. Read files, grep, `git log/show/diff/status/hash-object`. The only allowed writes are the run directory and, if needed, one local `.tmp/` line in the git exclude file (see Setup).
- Do not run builds, tests, servers, hooks, helper scripts, `bump.sh`, `bulk-fetch.sh`, `npx`, `jq` pipelines against real files in `$HOME`, dependency installs (`npm`, `yarn`), `prisma`, or any repo code. Do not execute a hook "to see what it does". Trace it in source.
- Do not make live or deployed calls. Do not contact the telemetry service, Railway, admin-mcp, Mixpanel, Firebase, New Relic, Meta, Jira, GitHub or any MCP endpoint. Do not read `~/.claude.json`, `~/.config/kai/tokens.env`, `.env` files or session transcripts. Do not write PoCs, payload chains, or exploit steps.
- The audit describes fixes. It never edits source, config, hooks, prompts or docs outside its own output directory. The local git exclude line is the only write outside that directory.
- Do not quote secret-like values in outputs. Cite the path and key name only. The signing-key default literal in source is a secret-like value: cite `path:line` and the env key names, never the literal.
- If the decisive fact lives outside the repo (Railway domain and proxy settings, `TELEMETRY_ADMIN_TOKEN` and signing-key values in the deployed environment, the admin-mcp and kai-mcp servers' own authorization, the Meta connector's full tool list, who can merge to `main`), record `needs_validation` with the exact missing fact. Do not assume it present or absent.

## Setup

1. Resolve: target (repo root), source ref (`git rev-parse HEAD`), dirty state (`git status --porcelain`; note modified and untracked files — reviewed content is the working tree), profile, scope.
2. Output goes to `.tmp/security-audit/run-<N>/`. Create the parent directory if needed, then claim the run directory exclusively with `mkdir` without `-p`. Start N at 1; if it exists, increment N and retry. Never reuse an existing run directory. If `git check-ignore -q .tmp/x` fails, append `.tmp/` to the file printed by `git rev-parse --git-path info/exclude` (local only; `.git` can be a file in a worktree), then re-check. Never commit outputs.
3. Prior runs: read every `.tmp/security-audit/run-*/coverage-ledger.json` and `findings.json`.
   - Compare reviewed content, not commits: each run records `reviewed_files` (repo-relative path plus `git hash-object` of the working-tree content read) in `coverage-ledger.json`. A unit or record is unchanged only when every file it relied on hashes the same now. Re-audit it when a hash differs, a file is gone, a new or untracked file joins its surface, or the prior run has no hashes. A prior ref alone proves nothing; `git diff <prior-ref>..HEAD` misses staged, unstaged and untracked changes.
   - Carry an unchanged `confirmed` record forward only after a fresh verifier re-confirms it. Exclude its root cause from hunters.
   - Prior `needs_validation`, `deferred`, `blocked`, `out_of_scope`, and changed-source units are current work. A prior `rejected` claim suppresses only that exact claim, not its unit.
   - A prior `quick` or scoped run never implies "the rest is fine."
4. Read the repo inputs (recon input, not proof): `CLAUDE.md`, `AGENTS.md` if present, `plugins/kai/CLAUDE.md`, `docs/agent-shared/security-policy.md`, `.claude/rules/security-policy.md`, `.claude/skills/preventive-security-review/` (`SKILL.md`, `references/boundaries.md`). Treat comments, READMEs, specs (`services/beacon-telemetry/TELEMETRY_V2_SPEC.md`, `plugins/kai/docs/*`) and the policy's "Applies / Not applicable" proofs as claims. Code is the territory. `plugins/mosaic-buddy/` is retired and not in the marketplace; audit it only if the scope names it or something live references it.

## Profiles

- `deep` (default): one ledger unit per sub-system × boundary × attack class × lifecycle mode; critic waves until a clean pass; candidate validation and final verification by separate fresh agents; same-source prior units get an independent second pass.
- `standard`: coarser units (sub-system × attack class); critic waves until a clean pass; separate validation and final verification.
- `quick`: units = sub-system × attack class; exactly one hunter wave and one final critic; one fresh verifier per candidate does validation and final verification together. Critic findings become `deferred`. Report as partial.
- Scoped run: seed units only for in-scope surfaces; mark the rest `out_of_scope`, never `covered`. Report as partial.

Profiles change breadth and redundancy, never the evidence bar.

## Workflow

Hunters and verifiers are sub-agents (read-only tools). The lead agent owns all files in the run directory. Delegate each role to a fresh sub-agent. Sub-agents return structured results; they do not write files. Give each sub-agent only: its role, the architecture summary, its units, the exact attack-class text it needs from [references/attack-classes.md](references/attack-classes.md), the safety rules above, and the result contract. Include the hash-binding rule from Setup in every reviewing agent prompt; require its `reviewed_files` hashes in the result.

1. **Reconnaissance.** Map the repo with [references/reconnaissance.md](references/reconnaissance.md) as the starting map, but re-verify it against current source (it may be stale; line numbers drift). Use parallel sub-agents for: (a) every `hooks.json`, hook script and matcher, with each failure branch; (b) `services/beacon-telemetry` routes, signing, auth, store, views and container; (c) MCP entries, credential provisioning skills and setup commands; (d) commands, agents, skills and workflows (tool grants versus instructed actions), helper scripts, `bump.sh` and marketplace files. Write `architecture.md` (≤ ~1000 words: protected resources, principals, entry surfaces, trust boundaries and strongest visible control on each, prior-run gaps, run metadata) and seed `coverage-ledger.json`.
2. **Coverage-led hunting waves.** Assign `planned` units to fresh hunters, highest value first: the public beacon endpoints and admin auth (S3, S4), then hooks that are meant to stop spend, secret leaks or destructive git (S1), then credential provisioning and storage (S5), then outbound data from engineer machines (S2), then the agent instruction surface and tool grants (S6, S9), then helper scripts and release integrity (S7, S8), then changed or previously-gapped source. One hunter may own closely related units in one sub-system; never combine unrelated boundaries. Each hunter follows the method below and returns one JSON result: per unit `covered | candidate | blocked`, with reviewed paths, `reviewed_files` entries (`path`, `hash`) bound to the content that agent read, the invariant checked, and the result. After every wave a fresh **coverage critic** (reads source, writes nothing) reports missing units, units closed without evidence, and unchecked parallel paths. Queue accepted work and repeat. In `deep`/`standard`, stop only after a separate final-clean critic accepts no work.
3. **Candidate validation.** Consolidate candidates by root cause (stable fingerprint). Give each to a fresh verifier that did not hunt it. The verifier re-reads every cited location and **tries to disprove the candidate**: strongest guard on the path, alternate registration, a second copy of the same file (for example the two `checkAuth` copies or the two `bulk-fetch.sh` copies), config default, existing test (none exist). It returns `confirmed`, `needs_validation`, or `rejected` with a corrected record. Discard a malformed result and re-run with another fresh verifier.
4. **Records.** Write `findings.json` (sorted by fingerprint) and update `coverage-ledger.json`, per [references/reporting.md](references/reporting.md). The lead checks by hand that fields are complete, JSON parses, and every cited path and line exists.
5. **Independent final verification.** A new fresh verifier per final `confirmed` and `needs_validation` record checks the record itself, not the hunter write-up. A replacement that strengthens a verdict or changes root cause, trace, impact, or severity goes to yet another fresh verifier before it is applied. If independence or budget runs out, drop the disputed record, leave its unit as an unresolved candidate, and mark the run incomplete with the reason.
6. **Report.** Before reporting, re-hash every reviewed file and compare with the hashes returned by reviewing agents. If a hash changed during the run, re-review every affected unit and re-verify its records against the new content. Repeat until hashes match; otherwise mark the run incomplete. Write `REPORT.md` and `NEEDS-VALIDATION.md` only from verified records. Prose never changes a verdict or severity.

End in exactly one state: all outputs written and every unit has a final disposition, or `run_status: "incomplete"` with the exact reason disclosed in the report. Never stop mid-phase silently.

### Hunter method (include in every hunter prompt)

- Read at depth. Follow each assigned input through parsing, identity, authorization, normalization, state, derived copies, and the final sink. Read sibling, legacy, retry, error, fallback, and duplicate-copy paths to the same effect. Compare sibling controls for equivalence, not just presence.
- Work from one invariant: name the lower-trust principal and its starting capability; the accepted value or selector; the control that should reject, bind, isolate, limit, or revoke it; the source path after that decision; and the smallest affected resource or wrong result.
- For hooks, trace every branch to its exit code, including missing tools (`jq`, `python3`, `openssl`, `curl`), empty stdin, unexpected JSON shape, and a tool name or command that is close to but not exactly the pattern.
- For agent-steering files, count only deterministic checks (hook scripts, tool grants, server-side authorization) as controls. Prompt wording is not a boundary. Untrusted text is anything an agent reads from the user's project, a ticket, ad copy, a web page, a transcript or a tool result.
- Test sad paths where the interface accepts them: absent, empty, array-vs-string, oversized, duplicate, mixed-case, stale `ts`, replayed signature, concurrent, failed dependency, unset environment variable.
- Stop a line of investigation when the invariant is settled either way. Record it.
- A candidate needs a full repo-relative trace (entrypoint → … → sink) with line numbers, the strongest visible control, and conditions. Return an empty list if nothing survives.
- Return a different boundary you notice as `uncovered`, not as a finding.

## Core principles

- **Boundary + result.** For every candidate name: the lower-trust principal, the accepted input or action, the intended control, the boundary crossed, the affected principal or resource, and the concrete security result visible in source. A missing best practice, guessed deployment behavior, generic crash, or self-impact is not a finding.
- **Bounded evidence.** With no execution allowed, one complete source trace to an unauthorized result with no effective guard on that path is enough (registration, failure branch, config default). A guarded sibling or copy does not disprove an unguarded path. A decisive control outside the repo stays `needs_validation`. State what you read. Do not claim a runtime result you did not observe.
- **Respect source visibility.** Railway edge and domain settings, deployed environment values, the admin-mcp and kai-mcp servers, the Meta connector, GitHub branch protection and the identity of everyone who can merge are real controls that are not in this repo. If one is decisive, use `needs_validation`.
- **Priority vs certainty.** Only `confirmed` records get severity. Severity cannot exceed the demonstrated impact. `needs_validation` has no severity and is not a low-confidence confirmed finding.
- **Smallest source fix.** For each confirmed finding name the invariant and the narrowest repo-relative change at the last trusted decision point, plus a proposed negative test (follow the recipes in `docs/agent-shared/security-policy.md`; this repo has no test runner, so label it Proposed). Prefer reusing the owning helper (`timingSafeEqual` verify in `services/beacon-telemetry/src/lib/hmac.js`, the `guard` preHandler, `jq --arg`) over a new layer. Do not propose broad rewrites.

## Anti-patterns

1. Policy-pattern (SEC-P##) wording mismatches or checklist deviations presented as vulnerabilities.
2. Defense-in-depth advice with no reachable boundary violation.
3. Running or calling anything to "confirm" (forbidden here) instead of tracing source. This includes running a hook script.
4. Guessing Railway, deployed-environment, MCP-server or GitHub-settings behavior not shown in the repo.
5. Treating same-principal authority or self-impact as a cross-boundary result (an engineer's own hook acting on the engineer's own machine with the engineer's own prompt).
6. Reporting an effect stronger than the source supports (a fail-open hook is not remote code execution; a forgeable telemetry row is not account takeover).
7. Prompt injection reported as a finding on its own. Require a code-level boundary failure: untrusted text that reaches a tool, write, push or destination the sender could not reach directly, with no deterministic guard.
8. Prose-only hunter output that cannot be deduplicated or verified.
9. Re-reporting carried unchanged confirmed records, or anchoring hunters on them.
10. Giving severity to `needs_validation`.
11. Writing the report before independent verification, or letting prose and JSON disagree.
12. Trusting a code comment ("shared key, not a secret", "fail silently", "read-only by design") without tracing it. Verify the claim in code.
13. Treating README, spec, CHANGELOG or `CLAUDE.md` statements as proof of runtime behavior.
14. Reporting the retired `plugins/mosaic-buddy/` tree as live surface unless the marketplace or a live file references it.

## Output files

All under `.tmp/security-audit/run-<N>/`: `architecture.md`, `coverage-ledger.json`, `findings.json`, `REPORT.md`, `NEEDS-VALIDATION.md`, with reviewed file hashes inside `coverage-ledger.json`. Formats and severity anchors: [references/reporting.md](references/reporting.md).

## References

- [references/reconnaissance.md](references/reconnaissance.md): this repo's attack-surface map and ledger sub-systems.
- [references/attack-classes.md](references/attack-classes.md): classes and domain blocks this repo's source evidences, with anchors and hunt questions.
- [references/reporting.md](references/reporting.md): record states, fields, severity, report layout, attribution and license.
