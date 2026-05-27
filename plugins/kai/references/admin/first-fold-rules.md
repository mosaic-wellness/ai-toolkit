# First-Fold Composition Rules

The PDP narrative-experiments skill must preserve a small set of anchor widgets in the **first-fold zone** of every variant. This doc defines those anchors, the canonical order, and the validator algorithm.

Read this before writing any modification that touches `widgets[0..5]`. Below-fold composition (`widgets[6..]`) is unconstrained and has no rules in this file.

---

## The first-fold zone

```
widgets[0..5]   ← first 6 entries in the page's widget array
```

This window is hard-coded. It does not change with viewport, device, or brand. The rule is positional, not pixel-based — we count widget array indices, not rendered height.

Why N=6: a typical PDP places its three anchors plus 1–3 callout widgets within the first scroll. N=6 leaves room for callouts to interleave without pushing the anchors past first scroll.

---

## Anchors

| # | Anchor | Match rule | Required? |
|---|--------|-----------|-----------|
| 1 | **Gallery** | `type ∈ {CAROUSEL_WITH_THUMBNAIL, EXPANDED_MEDIA}` (exactly one) | required |
| 2 | **TAG_MEDIA** | `type === "TAG_MEDIA"` (zero or one — brand-mark, conditional) | optional |
| 3 | **PRODUCT_SUMMARY** | `type === "PRODUCT_SUMMARY"` (exactly one per PDP per spec) | required |

The two gallery widgets are alternates. A PDP uses one or the other, never both. The skill picks whichever the control PDP uses and preserves the type.

`TAG_MEDIA` is brand-mark image at the top of the page — present only when the brand authors a `tag` block in RCL. If absent in the control, do not add it. If present, preserve and respect its canonical position.

---

## Canonical order

When present, anchors must appear in this relative order within the first-fold window:

```
Gallery  →  TAG_MEDIA (if present)  →  PRODUCT_SUMMARY
```

Callouts (any widget type that is not an anchor) may interleave anywhere — before the gallery, between gallery and TAG_MEDIA, between TAG_MEDIA and PRODUCT_SUMMARY, or after PRODUCT_SUMMARY — provided the three anchor constraints (presence, position within `widgets[0..5]`, relative order) still hold.

---

## Validator algorithm

Run this against the proposed variant **before** any write to admin-mcp.

```
function validateFirstFold(widgets):
  GALLERY_TYPES = {"CAROUSEL_WITH_THUMBNAIL", "EXPANDED_MEDIA"}

  g = first index i where widgets[i].type ∈ GALLERY_TYPES   (or -1 if none)
  t = first index i where widgets[i].type == "TAG_MEDIA"    (or -1 if none)
  s = first index i where widgets[i].type == "PRODUCT_SUMMARY" (or -1 if none)

  # Required anchors present
  if g == -1: FAIL "Gallery anchor missing — variant must include CAROUSEL_WITH_THUMBNAIL or EXPANDED_MEDIA."
  if s == -1: FAIL "PRODUCT_SUMMARY anchor missing — every PDP must include exactly one."

  # First-fold window
  if g >= 6: FAIL "Gallery anchor at index ${g}, must be within widgets[0..5]."
  if s >= 6: FAIL "PRODUCT_SUMMARY at index ${s}, must be within widgets[0..5]."

  # Canonical order
  if g >= s: FAIL "Order violation — gallery must come before PRODUCT_SUMMARY (got g=${g}, s=${s})."

  # TAG_MEDIA optional but constrained when present
  if t != -1:
    if t >= 6: FAIL "TAG_MEDIA at index ${t}, must be within widgets[0..5]."
    if not (g < t < s): FAIL "TAG_MEDIA must sit between gallery and PRODUCT_SUMMARY (got g=${g}, t=${t}, s=${s})."

  return OK
```

The skill MUST refuse to call `create_pdp_experiment` if validation fails. Surface the specific failure message to the operator so they can adjust the layout plan.

---

## Allowed mutations on the anchors

Anchors are **never removed, replaced, or reordered**. Their `type` is fixed; their position within `widgets[0..5]` is fixed (subject to the canonical-order constraint).

Content edits are allowed within the per-widget edit-safety rules:

| Anchor | 🟢 AI-safe fields (skill may rewrite) | 🟡 Sensitive (flag in preview) | 🔴 Structural (never touch) |
|--------|--------------------------------------|-------------------------------|----------------------------|
| `CAROUSEL_WITH_THUMBNAIL` | `items[].altText` | image URLs in `items[].media.url` (packaging may carry regulatory marks) | `productInfo`, `thumbnailConfig.position`, item ordering when middleware-injected |
| `EXPANDED_MEDIA` | `items[].alt` | marketing-creative URLs; `discontinuedProductOverlayText`, `productOSSOverlayText` | `productInfo.sku`, `id`, `sliderConfig` enums, `showShareButton` |
| `TAG_MEDIA` | `desktopWidth`, `desktopHeight`, `mobileWidth`, `mobileHeight` | `desktopImage`, `mobileImage` (brand asset) | (none — but rarely useful to edit) |
| `PRODUCT_SUMMARY` | `productSummary.subtitle`, `productSummary.highlights[].text`, `productSummary.taxesLabel`, `productSummary.discountedPriceLabel`, `productSummary.actualPriceLabel` | every `productSummary.*` claim or price-like field (most are live-injected by middleware anyway), `callouts[].primaryText`, `cashbackInfo.infoText` | `productSummary.name` and `.actualPrice` / `.discountedPrice` / `.rating` / `.reviewCount` (all live-injected), `productSummary.hidePrice`, `widgetContent` HTML (sanitize concerns) |

Refer to the per-widget spec under `pdp-widget-specs/widgets/<TYPE>.md` for the full field-by-field edit-safety table. The summary above is the skill's hot-path lookup.

---

## Examples

### ✅ Valid — anchors only

```
widgets = [
  { type: "CAROUSEL_WITH_THUMBNAIL", ... },   // g=0
  { type: "TAG_MEDIA", ... },                  // t=1
  { type: "PRODUCT_SUMMARY", ... },            // s=2
  { type: "PRODUCT_CALL_TO_ACTION", ... },     // below-fold start
  ...
]
```

g=0 < t=1 < s=2, all < 6, canonical order. ✅

### ✅ Valid — anchors with interleaved callouts

```
widgets = [
  { type: "BANNER", id: "promo-strip" },       // callout
  { type: "EXPANDED_MEDIA" },                  // g=1
  { type: "OFFER_NUDGE_CARD" },                // callout
  { type: "TAG_MEDIA" },                       // t=3
  { type: "INFO_STRIP" },                      // callout
  { type: "PRODUCT_SUMMARY" },                 // s=5
  { type: "PRODUCT_CALL_TO_ACTION" },          // below-fold
  ...
]
```

g=1 < t=3 < s=5, all < 6, canonical order. ✅

### ✅ Valid — no TAG_MEDIA (brand doesn't author one)

```
widgets = [
  { type: "CAROUSEL_WITH_THUMBNAIL" },         // g=0
  { type: "CALLOUT_WITH_IMAGE" },              // callout
  { type: "PRODUCT_SUMMARY" },                 // s=2
  ...
]
```

g=0 < s=2, t=-1 (absent — allowed). ✅

### ❌ Invalid — PRODUCT_SUMMARY pushed past first fold

```
widgets[0..5] = [BANNER, EXPANDED_MEDIA, INFO_STRIP, OFFER_NUDGE_CARD, BANNER, CALLOUT_WITH_IMAGE]
widgets[6]    = { type: "PRODUCT_SUMMARY" }   // s=6, FAIL
```

Too many callouts inserted before PRODUCT_SUMMARY. Skill rejects, asks operator to trim callouts.

### ❌ Invalid — order reversed

```
widgets = [
  { type: "PRODUCT_SUMMARY" },                 // s=0
  { type: "EXPANDED_MEDIA" },                  // g=1
  ...
]
```

g >= s. The buy box rendered above the hero gallery. Skill rejects.

### ❌ Invalid — TAG_MEDIA outside canonical sandwich

```
widgets = [
  { type: "TAG_MEDIA" },                       // t=0
  { type: "EXPANDED_MEDIA" },                  // g=1
  { type: "PRODUCT_SUMMARY" },                 // s=2
]
```

t < g — TAG_MEDIA before the gallery violates the `g < t < s` sandwich. Skill rejects.

### ❌ Invalid — gallery missing

```
widgets = [
  { type: "TAG_MEDIA" },
  { type: "PRODUCT_SUMMARY" },
  { type: "PRODUCT_CALL_TO_ACTION" },
  ...
]
```

No `CAROUSEL_WITH_THUMBNAIL` or `EXPANDED_MEDIA` anywhere. Hero visual missing. Skill rejects.

---

## When to re-run validation

- After narrative compilation produces the modification list, **before** building the modifications payload for `create_pdp_experiment`.
- After every operator-driven iteration (operator says "move widget X up" — re-validate before committing).
- After the write completes, optionally re-fetch the variant with `get_experiment_config` and re-run as a paranoia check.

If a validation failure surfaces post-write (e.g. middleware enrichment reorders widgets in ways the skill didn't anticipate), surface to the operator and offer to roll back via `update_experiment_assignment` to 100% control.

---

## Out of scope

- **Pixel-based first-fold detection.** Future improvement; today's rule is positional.
- **Multiple gallery widgets.** A PDP renders exactly one. If a variant somehow produces two, the validator fails on order checks because there's no canonical relative order between the two gallery types.
- **Below-fold rules.** Anything in `widgets[6..]` is unconstrained by this doc. Other rules (edit-safety, claim guard) still apply.
