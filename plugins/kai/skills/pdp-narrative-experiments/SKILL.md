---
name: pdp-narrative-experiments
description: >
  Translate an ad / campaign narrative into a PDP A/B experiment variant on staging.
  Auto-activates whenever an operator pastes ad copy, a creative brief, a positioning
  angle, a story / messaging direction, or any "test this narrative on the product
  page" request — even if they don't explicitly say "experiment" or "A/B". Samples
  the brand voice from sibling PDPs, decomposes the narrative into beats, maps beats
  to widget changes, validates against first-fold rules and edit-safety markers,
  previews the change for operator approval, then writes the variant via admin-mcp.
  Use this skill (not the simpler experiment-manager) whenever the change is driven
  by a story / angle / persona rather than a single isolated image or copy swap.
  Requires admin-mcp. Staging-only — production publish goes through Zeus admin UI.
---

# PDP Narrative Experiments

You translate an advertising narrative into a concrete PDP variant on staging. The
operator gives you a story; you produce a variant PDP, a story-map preview, and a
traffic split. Production cutover is **not** in your scope — middleware will refuse it
anyway when `x-mcp-source: admin-mcp`.

## When to activate

- User pastes a narrative / ad copy / campaign brief and names a product or PDP.
- User asks "test this angle on the X PDP" / "create a PDP variant from this story" /
  "build narrative variant" / "run an A/B with this positioning".
- The `experiment-manager` agent receives narrative-shaped input and delegates here.

If the user is creating a generic A/B test (e.g. just wants to swap a hero image with
no narrative angle), stay out — the standard `experiment-manager` flow is simpler.

## Reference layout

Heavy logic lives in three references plus a bundled widget spec snapshot. Load only
what you need — do not duplicate content here.

### Skill logic (read once per flow stage)

| Reference | Use it for |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}/references/admin/narrative-experiment-flow.md` | End-to-end orchestration: per-step admin-mcp tool calls, permissions, error recovery, handoff |
| `${CLAUDE_PLUGIN_ROOT}/references/admin/pdp-narrative-compilation.md` | The 7-beat schema, voice sampling, beat→widget mapping, modifications list shape |
| `${CLAUDE_PLUGIN_ROOT}/references/admin/first-fold-rules.md` | Anchor validator (positional rules + algorithm + ✅/❌ examples) |

### Bundled widget spec (PRIMARY entry point + drill-down)

`widget-index.json` is your hot-path lookup. Load it ONCE at layout-planning time
and consult it for every widget decision. Only drill into per-widget markdown when
the index doesn't carry enough detail for a specific field-level decision.

| Spec | Use it for | Load when |
|---|---|---|
| `${CLAUDE_PLUGIN_ROOT}/references/admin/pdp-widget-specs/widget-index.json` | **PRIMARY** — flat lookup of all 58 PDP-relevant widgets: type → narrative role, edit-safety summary, header/layout support, spec path | Once, at the start of layout planning |
| `${CLAUDE_PLUGIN_ROOT}/references/admin/pdp-widget-specs/narrative-index.md` | Widget grouping by the 12 narrative codes — use when designing the below-fold narrative arc | Once, at layout planning if you need narrative-code-first browsing |
| `${CLAUDE_PLUGIN_ROOT}/references/admin/pdp-widget-specs/widgets/<TYPE>.md` | Per-widget field tables, real examples, gotchas, fine-grained edit-safety markers | DRILL-DOWN — only when planning a non-trivial edit on a specific widget |
| `${CLAUDE_PLUGIN_ROOT}/references/admin/pdp-widget-specs/widgets/_common.md` | header / layout / Media / CTA / SliderConfig primitives | When editing fields that use these shared types |
| `${CLAUDE_PLUGIN_ROOT}/references/admin/pdp-widget-specs/widgets/_conventions.md` | The 12 narrative codes + edit-safety classification definitions | If you forget what HERO vs STORY vs PROOF means |

Companion skill: `admin-essentials` (auto-activates alongside) — brand resolution,
URL→identifier rules, staging guardrail, common gotchas.

## The flow (7 stages)

```
0. AUTH PRE-FLIGHT  →  resolve_brand to surface caller's permission context
1. DISCOVERY        →  find the control PDP, fetch its config, sample sibling PDPs for voice
2. DECOMPOSITION    →  extract the 7 beats from the narrative (LLM)
3. LAYOUT PLANNING  →  beats → widget modifications, top-fold and below-fold zones
4. VALIDATION       →  first-fold rules + edit-safety + claim guard
5. PREVIEW & ITERATE → render story map, operator iterates until approved
6. WRITE            →  acquire lock → create_pdp_experiment → diff sanity → release lock → update_experiment_assignment
7. HANDOFF          →  preview URLs + QA checklist + reminder that prod publish is via Zeus UI
```

Full per-step tool calls and permission requirements: see `narrative-experiment-flow.md`.

## Hard rules

These cannot be relaxed without breaking real PDPs. Verify before every write.

### First-fold anchors are sacred

The first six widgets (`widgets[0..5]`) MUST contain, in canonical order:

1. A gallery anchor — `type ∈ {CAROUSEL_WITH_THUMBNAIL, EXPANDED_MEDIA}` (exactly one)
2. (Optional) `type === "TAG_MEDIA"` — brand-mark, present only when control authors one
3. `type === "PRODUCT_SUMMARY"` (exactly one per PDP)

The skill **only edits content** on these anchors — never adds, removes, swaps types,
or reorders them. Callouts may interleave between them within `widgets[0..5]`.
Validator algorithm and examples: `first-fold-rules.md`.

Run the validator BEFORE every call to `create_pdp_experiment`. Surface specific
failure messages to the operator; refuse to write if validation fails.

### Edit-safety per field

Every modification carries an edit-safety class derived from the widget's spec field
table:

- **🟢 AI-safe** — copy, alt text, simple text fields. Rewrite freely.
- **🟡 Sensitive** — claims, prices, regulatory copy, brand assets. Flag in preview;
  operator must explicitly approve.
- **🔴 Structural** — ids, slugs, action wiring, SKUs, type strings. **Never touch.**
  If compilation produces a 🔴 modification, drop it and regenerate that piece.

The per-widget edit-safety summary is in `widget-index.json` under each entry's
`edit_safety_summary`. Drill into `widgets/<TYPE>.md` when you need per-field detail.

### Compliance / claim guard

Before generating any new copy, sample 2–3 sibling PDPs on the same brand to build an
allowed-claim-verb whitelist. **Never introduce a claim verb absent from the samples**
(common forbidden verbs on health brands: cure, guarantee, prevent, treat, diagnose,
100%, no side effects). If the operator's narrative requires a forbidden verb, flag
it in the preview — operator must explicitly approve before write.

### Staging only — no exceptions

`environment: "staging"` on every write. The skill does not call `publish_experiment`
(disabled via MCP anyway). Middleware additionally refuses any
`x-mcp-source: admin-mcp` + `env=prod|production` with a 403.

To publish to production, the operator uses the Zeus admin dashboard. Say this in
every handoff.

## Operator inputs

Required at the start of the flow:

- **Narrative** — free-form text (ad copy, brief, positioning angle).
- **Brand** — display name, alias, or short code. `resolve_brand` normalizes.
- **Product** — URL key, product name, or control filename. `search_products` /
  `list_pdp_pages` resolve.

Optional:

- `variant_count` (default 1; max 2 in v1)
- `experiment_name` override (default: derived from beats, kebab-case)
- `traffic_split` (default 50/50 control vs variant)

## Error handling (the common cases)

| Symptom | Skill response |
|---|---|
| Auth returns `reason: "no_permissions"` | "Your Zeus API key has no admin permissions. Ask a Zeus admin to grant `all_pages` (view + edit) to your role." Halt. |
| Tool denies with `missing.brand` | "Your role doesn't include `${brand}`. Available: `${ctx.brands}`. Pick another brand or ask Zeus admin to expand your role." Halt. |
| Tool denies with `missing.language` | "Your role doesn't include `${lang}`. Defaulting to `en`?" — confirm with operator. |
| Auth + brand pass but `all_pages.edit` missing | "Your role can view but not edit `all_pages` on this brand. The variant write will be denied. Ask Zeus admin to grant `edit`." Halt before compilation. |
| First-fold validator fails | Surface the specific failure (missing anchor / wrong order / outside window). Offer regeneration; if 2 regenerations fail, ask operator to refine the narrative. |
| 🔴 modification proposed by compiler | Drop silently and regenerate just that piece. |
| 🟡 modification on a new claim | Flag in preview with explicit operator confirmation required. |
| Lock held by someone else | Surface owner + expiry. Offer "retry after expiry" or "cancel". |
| Compare-to-control diff shows unexpected paths | Halt before traffic assignment. Show operator the anomaly. Roll back via `update_experiment_assignment` to 100% control if needed. |
| Mid-flight cancel | If lock acquired, release it. Never leave staging in inconsistent state. |

Detailed recovery semantics: `narrative-experiment-flow.md` § Error recovery and rollback.

## Audit (automatic — don't fire it yourself)

Every write goes through admin-mcp's `safeWrite` wrapper. Audit entries land in Zeus
Activity Log automatically:

- `create_pdp_experiment` → `entity_type: "experiment"`, `entity_id: <experiment_page_name>`
- `update_experiment_assignment` → `entity_type: "experiment"`, `entity_id: <identifier>`

Mention this in the handoff so the operator knows where to verify.

## What the skill does NOT do (out of scope for v1)

- Generate >2 variants from one narrative (v2)
- Cross-language variant generation in one run (operator re-runs per language)
- Monitor / measure lift (separate Mixpanel skill family)
- Auto-promote a winner (separate `promote_experiment_to_control` flow)
- UTM-scoped splits (supported by `experiment.json` but not exposed in v1 inputs)
- Edit the legacy section pipeline — only widgetized PDPs

## Handoff template

After a successful write, output to the operator:

```
✅ Experiment created on staging

Variant:     <experiment_page_name>
Control:     <control_page_name>
Brand:       <brand>
Traffic:     control X% · <variant> Y%
Audit:       logged in Zeus Activity Log under entity_type=experiment

Staging preview URLs:
  - Control:  <preview_pdp_url for control with mwexp cookie in control bucket>
  - Variant:  <preview_pdp_url for variant with mwexp cookie in variant bucket>

QA checklist:
  ☐ Visual diff: both URLs side-by-side, mobile + desktop
  ☐ First-fold anchors still in canonical order
  ☐ All 🟡 flagged claims read as intended
  ☐ Mixpanel EXPERIMENT_VIEWED firing on the variant
  ☐ ATC / Buy Now still works on the variant

⚠ Production promotion is NOT available via MCP. To publish, log in to Zeus
   admin dashboard and publish the variant + assignment from the All Pages
   and Experiment Assignment tools.
```
