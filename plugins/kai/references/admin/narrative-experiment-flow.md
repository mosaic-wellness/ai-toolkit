# Narrative Experiment Flow

The end-to-end orchestration the PDP narrative-experiments skill executes. Per-step admin-mcp tool calls, permission requirements (per ENG-4854), validation gates, error handling, and operator handoff.

Read this as the operational backbone. Compilation logic lives in `pdp-narrative-compilation.md`. The first-fold validator lives in `first-fold-rules.md`.

---

## Inputs

The skill activates with three operator-supplied inputs:

| Input | Required? | Form | Notes |
|-------|-----------|------|-------|
| Narrative | yes | free-form text (ad copy, campaign brief, positioning angle) | Single paragraph to a few hundred words |
| Brand | yes | display name, alias, or canonical code | `resolve_brand` normalizes |
| Product identifier | yes | URL key, product name, OR control filename | `search_products` / `list_pdp_pages` resolves |

Optional:
- `variant_count` (default 1)
- `experiment_name` override (default derived from narrative beats — kebab-case)
- `traffic_split` (default 50/50 control vs variant for v1)

---

## The flow at a glance

```
0. AUTH PRE-FLIGHT  → resolve_brand
1. DISCOVERY        → resolve_brand · search_products · list_pdp_pages · get_pdp_config · get_pdp_summary (×N)
2. DECOMPOSITION    → LLM (no tool calls)
3. LAYOUT PLANNING  → LLM (reads narrative-index + per-widget specs)
4. VALIDATION       → local (first-fold-rules)
5. PREVIEW & ITERATE → operator interaction (AskUserQuestion)
6. WRITE            → acquire_page_lock · create_pdp_experiment · compare_experiment_to_control · release_page_lock · update_experiment_assignment
7. HANDOFF          → preview_pdp_url + reminders
```

---

## Stage 0 — Auth pre-flight

The first admin-mcp call surfaces the caller's permission context. The skill MUST handle three failure modes gracefully.

### Tool call

```
resolve_brand({ query: <operator-provided brand> })
```

Cheap and idempotent. The response confirms (a) the user is authenticated, (b) their brand list (indirectly — denial includes the gap), (c) the canonical brand code.

### Failure handling

| Symptom | Skill response |
|---------|---------------|
| Auth response `valid: false, reason: "no_permissions"` | "Your Zeus API key has no admin permissions. Ask a Zeus admin to grant `all_pages` (view + edit) and `habit` modules to your role. Until then this skill cannot run." Halt. |
| Auth response `valid: false, reason: "invalid_key"` | "Your admin-mcp credentials are invalid or expired. Re-run `kai:tools-init` to refresh." Halt. |
| `resolve_brand` denies with `missing.brand` | "Your role doesn't include `${requested_brand}`. Available to you: `${ctx.brands.join(', ')}`. Pick one of those or ask Zeus admin to expand your role." Halt. |

The 15-second admin-mcp auth cache means subsequent calls in the same session won't re-trigger validate. Skill can assume the auth context is stable within one session.

---

## Stage 1 — Discovery

### 1a. Resolve the control PDP

```
search_products({ brand, query: <product-name or url-key> })
  → product object with urlKey + name
list_pdp_pages({ brand, search: <urlKey or product name> })
  → set of candidate page filenames
```

If multiple candidates, ask operator (AskUserQuestion) to disambiguate. The selected filename is the **control_page_name** for the rest of the flow.

Permission needed:
- `search_products` — none (info tool)
- `list_pdp_pages` — `all_pages.view` on brand + language

### 1b. Fetch the control JSON

```
get_pdp_config({ brand, page_name: <control_page_name>, environment: "staging" })
  → full PDP JSON config
```

Cache in memory for this session — referenced repeatedly in stages 2–4.

Permission: `all_pages.view` on brand + language.

### 1c. Voice sampling

```
list_pdp_pages({ brand })
  → pick 2–3 most-recent NON-control PDPs
For each sampled page:
  get_pdp_summary({ brand, page_name })  # lightweight — title/hero/USPs
```

Aggregated voice signals feed the claim-verb whitelist (see `pdp-narrative-compilation.md` Stage 2).

Permission: `all_pages.view` on brand + language.

### 1d. Confirm permission to write

The skill knows it will eventually call `create_pdp_experiment` (which needs `all_pages.edit`) and `update_experiment_assignment` (also `all_pages.edit`). At the end of discovery, the skill verifies write permission proactively by inspecting `ctx.modules.all_pages` for `"edit"`. If absent, halt before doing expensive compilation:

> "Discovery complete, but your role can only **view** `all_pages`, not **edit**. The variant write will be denied. Ask Zeus admin to grant `all_pages.edit` before re-running."

---

## Stage 2 — Decomposition

LLM-only. No tool calls. Output is the 7-beat schema from `pdp-narrative-compilation.md`. Failure mode: too-vague narrative — the skill asks 1–2 clarifying questions via AskUserQuestion before proceeding.

---

## Stage 3 — Layout planning

LLM-only. Reads `pdp-widget-specs/narrative-index.md` and per-widget specs as needed. Output is the modifications list with `{json_path, value, narrative_reason, edit_safety}` per modification. See `pdp-narrative-compilation.md` Stages 3–4.

---

## Stage 4 — Validation

Three gates, run locally before any write:

| Gate | Source | Failure → |
|------|--------|----------|
| First-fold rules | `first-fold-rules.md` validator | Reject — surface the specific failure to the operator |
| Edit-safety | Per-modification `edit_safety` flag | 🔴 → reject silently and regenerate; 🟡 → flag in preview |
| Claim guard | Verb whitelist from Stage 1c sampling | New forbidden verb → flag in preview, operator must approve |

If any gate hard-fails (🔴 mod, first-fold rule break), the skill re-prompts the LLM with the specific failure as context and regenerates. After 2 failed regenerations, surface to operator: "compilation isn't producing a valid layout for this narrative — could you refine the narrative or split it into smaller hypotheses?"

---

## Stage 5 — Preview & iterate

Render the story map (see `pdp-narrative-compilation.md` Stage 5). Operator chooses via AskUserQuestion:

```
[ Approve and write ]
[ Edit a specific widget ]
[ Regenerate from scratch ]
[ Cancel ]
```

If "Edit a specific widget", ask which one + what to change. Regenerate only the affected modification(s). Re-run validation. Re-render. Loop until approved.

If "Regenerate from scratch", roll a new compilation (same narrative + voice + perms — different layout/copy). Limit: max 5 regenerations per session before suggesting the narrative needs refining.

---

## Stage 6 — Write

The write phase is sequenced strictly. If any step fails, the skill aborts the remaining steps and surfaces the failure with rollback instructions.

### 6a. Acquire lock

```
acquire_page_lock({
  brand,
  page_name: <control_page_name>,
  page_type: "pdp",
  environment: "staging"
})
  → { lock_token, expires_at }
```

Permission: `all_pages.edit` on brand.

Failure handling:
- Lock held by another user → surface owner + expiry to operator. Offer "retry after expiry" or "cancel".
- Lock acquired by this session → record the token; needed by section-mode updates.

### 6b. Create the experiment variant

```
create_pdp_experiment({
  brand,
  control_page_name,
  experiment_name: <kebab-case from narrative beats>,
  modifications: [ ...the compiled list... ],
  language: <ctx.languages selection>
})
  → { experiment_page_name, ... }
```

Permission: `all_pages.edit` on brand + language. Audit emits `entity_type: "experiment", entity_id: <experiment_page_name>` via admin-mcp's `safeWrite` wrapper (no skill action needed).

If multiple variants requested, repeat per variant.

### 6c. Sanity-check the diff

```
compare_experiment_to_control({
  brand,
  control_page_name,
  experiment_page_name
})
  → structured diff
```

Permission: `all_pages.view`.

Skill inspects the diff:
- Expected modifications present? ✓
- No unexpected paths changed? ✓
- First-fold rules still hold on the written variant (paranoia check)? ✓

If anomaly, surface to operator before traffic assignment — never auto-write to `experiment.json` if the variant looks wrong.

### 6d. Release lock

```
release_page_lock({ brand, page_name, lock_token })
```

Permission: `all_pages.edit`.

Run this even if step 6c failed — don't leave locks hanging.

### 6e. Set traffic split

```
update_experiment_assignment({
  brand,
  type: "product",
  identifier: <urlKey>,
  variants: {
    control:        { percent: 50, id: <control_page_name> },
    <experiment_name>: { percent: 50, id: <experiment_page_name> }
  },
  environment: "staging"
})
```

Percent values must sum to 100. v1 default is 50/50 unless operator overrode in step 0 inputs.

Permission: `all_pages.edit` on brand.

Failure handling:
- Existing assignment on this identifier → warn the operator, show current split, ask whether to overwrite.
- Sum-to-100 violation → recompute and retry, or ask operator for explicit splits.

---

## Stage 7 — Handoff

After successful write, the skill outputs:

```
✅ Experiment created on staging

Variant:     minoxidil-5-hair-growth-exp-stressed-dads-v1
Control:     minoxidil-5-hair-growth.json
Brand:       mm
Traffic:     control 50% · stressed-dads-v1 50%
Audit:       logged to Zeus Activity Log as entity_type=experiment

Staging preview URLs:
  - Control:  https://stg.manmatters.com/product/variants/minoxidil-5-hair-growth?mwexp=10
  - Variant:  https://stg.manmatters.com/product/variants/minoxidil-5-hair-growth?mwexp=80

QA checklist before promoting to prod:
  ☐ Visual diff: load both URLs side-by-side, mobile + desktop
  ☐ First-fold anchors present and in canonical order
  ☐ All 🟡 flagged claims read as intended
  ☐ Mixpanel EXPERIMENT_VIEWED firing with experiment_id + bucket_id
  ☐ ATC / BN flow still works on the variant

⚠ Production promotion is NOT available via MCP. To publish this experiment
   to production, log in to Zeus admin dashboard
   (https://stg-zeus.mosaicwellness.in) and publish the variant + assignment
   from the All Pages and Experiment Assignment tools.
```

The reminder about production is non-negotiable — middleware will 403 any MCP-sourced prod write, even with the right credentials. Operator must use Zeus UI.

---

## Permission cheat-sheet (per ENG-4854 plan §A4)

Every tool the skill invokes, with its required permission:

| Tool | Module | Op | Brand | Lang |
|------|--------|-----|-------|------|
| `resolve_brand` | — | — | no | no |
| `search_products` | — | — | no | no |
| `get_product_info` | — | — | no | no |
| `list_pdp_pages` | all_pages | view | yes | yes |
| `get_pdp_config` | all_pages | view | yes | yes |
| `get_pdp_summary` | all_pages | view | yes | yes |
| `get_pdp_schema` (optional) | all_pages | view | yes | yes |
| `list_widget_types` / `get_widget_schema` (optional, for unfamiliar widget types) | all_pages | view | yes (when brand arg present) | no |
| `compare_experiment_to_control` | all_pages | view | yes | no |
| `acquire_page_lock` / `release_page_lock` | all_pages | edit | yes | no |
| `create_pdp_experiment` | all_pages | edit | yes | yes |
| `update_experiment_assignment` | all_pages | edit | yes | no |
| `preview_pdp_url` | — | — | no | no |

If any tool denies, the structured error includes `missing: { module, op, brand?, language? }`. The skill should translate that to operator-readable English and stop the flow.

---

## Audit trail expectations

Every write call goes through admin-mcp's `safeWrite` wrapper (per ENG-4854 Slice C). The skill doesn't fire audit events itself. After a successful run, the operator can verify in Zeus Activity Log:

| Step | Expected audit entry |
|------|---------------------|
| 6b — create variant | `action: "Pushed to Staging"`, `entity_type: "experiment"`, `entity_id: <experiment_page_name>` |
| 6e — set traffic | `action: "Pushed to Staging"`, `entity_type: "experiment"`, `entity_id: <identifier>:<experiment_page_name>` (assignment-level) |

If the audit log is missing entries, treat as a side-effect failure (not a primary failure). The variant is written; the audit gap is a follow-up issue, not a rollback trigger.

---

## Error recovery and rollback

| Failure point | Rollback action |
|---------------|-----------------|
| 6a — lock acquisition fails | None needed (nothing written). Surface owner / expiry to operator. |
| 6b — variant creation fails | Release lock (6d). Surface error. |
| 6c — diff anomaly detected | Release lock (6d). Offer operator: (a) keep variant, fix manually via `update_experiment_section`, (b) abandon variant — skill leaves it as a draft on S3 but never wires traffic to it. |
| 6e — traffic assignment fails | Variant exists but no traffic. Surface to operator: "the variant is on S3 but no users will see it. Either retry assignment or remove the variant file manually." |
| Mid-flight cancel by operator | If lock acquired, release it. Never leave staging in an inconsistent state. |

To **fully roll back** a launched experiment:

```
update_experiment_assignment({
  brand,
  type: "product",
  identifier: <urlKey>,
  variants: {
    control: { percent: 100, id: <control_page_name> }
  }
})
```

This forces 100% traffic to control. The variant file remains on S3 but receives no traffic. Operators can resume the experiment later by re-issuing the original split.

---

## Out of scope for v1

- Multi-variant generation (>2 variants from one narrative) — punt to v2; v1 generates 1 variant by default and `variant_count` ≤ 2.
- Cross-language variant generation (Hindi + English from one narrative) — operator runs the skill once per language.
- Monitoring / lift measurement — separate concern, handled by Mixpanel skill family.
- Auto-promotion based on a winner — separate `promote_experiment_to_control` flow, not part of the create skill.
- UTM-scoped traffic splits — supported by `experiment.json` schema but not exposed in v1 inputs; operator can author it via Zeus UI if needed.
