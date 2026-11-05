# Records, severity, and reports

The lead agent writes every file in `.tmp/security-audit/run-<N>/`. Sub-agents return JSON; they do not write files. Check structure by hand (no validator scripts): every required field present, every cited path exists, every line number points at the described code, JSON parses.

## Record states

| State              | Meaning                                                                                                                                                                      | Gets severity |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `confirmed`        | One complete source-established path from a lower-trust entry reaches the unauthorized result without an effective guard, and an independent verifier failed to disprove it. | Yes           |
| `needs_validation` | A specific, source-grounded boundary hypothesis is blocked by one decisive fact outside the repo (Railway or platform setting, deployed environment value, downstream server authorization, repository permission). | No            |
| `rejected`         | Source, an effective guard on the claimed path, missing impact, or an impossible precondition disproves the claim. Kept so later runs do not repeat it without new evidence. | No            |

A guarded sibling, duplicate copy or alias does not disprove an unguarded path. A decisive control outside the repo stays `needs_validation`.

`needs_validation` is not a parking place for speculation and not a low-confidence `confirmed`. If source refutes the trace, reject it. Never output a severity on `needs_validation` or `rejected`.

## `findings.json`

Top-level JSON array, sorted by `fingerprint`. One record per root cause. The fingerprint is stable across runs and states: `^[A-Za-z0-9][A-Za-z0-9._:/@+-]*$`, derived from the root cause (for example `beacon/admin-auth-fail-open`), with no line number, wave, agent, severity or verdict in it.

Common fields (all states): `fingerprint`, `verdict`, `title`, `description`, `sub_system` (S1–S9 from `reconnaissance.md`), `attack_class` (letter A–I from `attack-classes.md`), `trace` (ordered list of `{role: "entrypoint"|"propagation"|"sink", path, line, what}`; first is the lower-trust entry, last is the sink), `evidence` (list of `{path, line, observation}` including the strongest guard found and why it does not stop the result).

`confirmed` adds:

- `root_cause`, `intended_behavior` (the invariant the code should enforce)
- `principal` (lower-trust actor and starting capability), `resource` (affected principal/resource), `result` (what the source shows becomes possible; no stronger than the trace)
- `conditions` (environment, installed plugin version, tool availability such as `jq` or `python3`, platform setting; each verified or named as assumed)
- `severity`: `{likelihood, impact, overall}` with `overall` ≤ impact
- `confidence`: `high | medium`
- `remediation`: `{invariant, change: [{path, change}], regression_test}` (smallest source change at the last trusted decision point, plus a Proposed negative test case; this repo has no test runner)
- `verified_by`: ids of the validation and final-verification agents

`needs_validation` adds: `claimed_root_cause`, `blockers` (each: the exact missing fact and who owns it), `validation_plan` with at least one of `source_followup` (a further repo read that would settle it) or `owner_check` (what a platform, repository or server owner observes — never traffic sent to a live target). No `severity`, `remediation`, or `root_cause`.

`rejected` adds: `claimed_root_cause`, `reason` (the guard, line, or fact that disproves it).

## `coverage-ledger.json`

The file is one JSON object: `{"reviewed_files": [...], "units": [...]}`.

`reviewed_files`: a list of `{path, hash}` for every file read, where `hash` is `git hash-object <path>` of the content that reviewing agent actually read, checked immediately before and after the read. Accept only matching hashes; otherwise re-read and retry. Preserve agent-provided hashes. Before reporting, re-hash the files and re-review every unit and record that depends on changed content, including affected independent verification. Later runs use these hashes to decide what changed.

`units`: an array of units. One unit per sub-system × boundary × attack class (× lifecycle mode in `deep`). Fields:

```json
{
  "coverage_id": "S3::services/beacon-telemetry/src/lib/hmac.js#verify::B1::replay",
  "sub_system": "S3",
  "surface": "...",
  "boundary": "...",
  "attack_class": "B1",
  "starting_paths": ["services/beacon-telemetry/src/lib/hmac.js"],
  "prior_status": "none|new|prior_confirmed_same_source|prior_confirmed_changed_source|prior_needs_validation|prior_deferred|prior_blocked|prior_out_of_scope|prior_covered_same_source|prior_covered_changed_source|prior_rejected_claim_changed",
  "status": "planned|in_progress|covered|candidate|blocked|deferred|out_of_scope|not_applicable",
  "wave": 1,
  "agent_id": null,
  "reviewed_paths": [],
  "checks": [{ "agent_id": "", "paths": [], "invariant": "", "result": "" }],
  "fingerprints": [],
  "unresolved": [],
  "attempts": []
}
```

State rules:

- `planned`: no owner, no evidence.
- `in_progress`: owner set, no evidence yet.
- `covered`: owner, nonempty `reviewed_paths` and `checks`, nothing unresolved, no fingerprints.
- `candidate`: same evidence plus linked fingerprints.
- `blocked`: owned partial evidence plus a nonempty `unresolved` reason.
- `deferred`, `out_of_scope`, `not_applicable`: no owner, no evidence, and a nonempty `unresolved` reason (for example `quick_profile_final_critic`, `scoped_run`, `no_such_surface`).
  A coverage-critic reassignment moves the live evidence into `attempts` (keep wave, owner, paths, checks, fingerprints, reason), increments `wave`, and gives the unit to a fresh owner. `coverage_id` uses stable repo identities (paths, route strings, class letters), not wave, agent or line numbers. Sort units by `coverage_id`.

Add a run-metadata section to `architecture.md` (not in the ledger): run id, source ref, dirty files, profile, scope, prior runs used, `run_status: complete|incomplete`, and `incomplete_reason`.

## `REPORT.md`

1. **Run header:** run id, source ref, dirty state, profile, scope, prior runs used (carried confirmations, changed-source revalidations), execution statement (source-only, read-only, nothing run or contacted). A `quick`, scoped, or incomplete run says plainly it is a partial pass.
2. **Posture summary:** 3–5 sentences, evidence-based.
3. **Confirmed findings table:** severity, title, boundary, one-line source-established result, fingerprint.
4. **Each confirmed finding:** trace (paths and lines), principal and resource, conditions, result, impact, priority rationale, smallest fix, Proposed regression test.
5. **Needs validation:** table of title, trace, exact blocker, owner, source follow-up (full detail in `NEEDS-VALIDATION.md`). No severity.
6. **Hardening notes and positive patterns:** concrete notes that are not findings; guards worth keeping (for example the constant-time signature verifier in `services/beacon-telemetry/src/lib/hmac.js`, bound-parameter SQL, text-node rendering, the Meta Ads block).
7. **Coverage statement** (below).

Do not list `rejected` records as findings. Mention a fingerprint only when it explains a prior disagreement. Never print a secret-like value; cite `path:line` and the key name.

## `NEEDS-VALIDATION.md`

One section per unresolved record: fingerprint, title, boundary, source trace and verified evidence, the exact blocker, who can observe it (for example the Railway project owner, the repository admin, the admin-mcp owner), the safe owner-observed check or source follow-up, and what outcome would confirm or reject it. Prioritize by the value of the protected resource. No severity, no live-test steps.

## Coverage statement

State, from the ledger: counts of `covered`, `candidate`, `blocked`, `deferred`, `out_of_scope` units; sub-systems and classes not reached; the final critic result (or that none ran); whether prior runs existed. Use this form:

> This run reviewed the listed units in source at `<ref>` and found the listed records. It did not run or contact anything. It does not show that the repository is secure. Uncovered, deferred, and external-control areas are listed above.

Never write "no vulnerabilities", "secure", or "clean" about the repository. A run with zero confirmed records says so and reports the remaining coverage and validation limits; do not invent low-severity findings.

## Severity anchors

Only `confirmed` records. Severity cannot exceed the impact the source demonstrates.

- **critical:** an unprivileged actor gains code execution on installing engineers' machines through the distribution path (marketplace, hook, MCP entry or script), or full read/write of the telemetry store, or access to engineers' stored credentials.
- **high:** an actor fully defeats an explicit security control with real consequences: bypass of the spend or destructive-git block, an unauthenticated read of the admin dashboard data, credential exposure to another party, or a path that makes an agent perform a live write without the intended approval.
- **medium:** a real boundary violation with limited blast radius, uncommon preconditions, or consequences confined to a narrow resource set (for example forged telemetry rows that skew metrics, a fail-open hook that needs a missing dependency).
- **low:** disclosure of non-secret internals, or an effect needing sustained effort for minimal gain.
- **informational:** a confirmed but minimal-impact observation, mainly useful as a prerequisite inside a larger finding.

High vs medium test: does the demonstrated result fully defeat an explicit control for an action with real consequences, or only weaken it? If you cannot state the concrete damage, the severity is lower than it feels.

## Attribution

Adapted from Cloudflare security-audit-skill, https://github.com/cloudflare/security-audit-skill/tree/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8, under the MIT License below.

MIT License

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
