# `ACCORDION_WITH_SHOW_MORE`

> The richer cousin of `ACCORDION` — each row is a card with image, name, and
> truncated description with a "show more" toggle. Used for "Key ingredients" sections.

## Identity

- type — `ACCORDION_WITH_SHOW_MORE`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `OBJECTION` / `EVIDENCE` hybrid — used for "Key ingredients" reveal. Each card asserts a small claim.

### Edit-safety

🟢 generic copy.
🟡 `items[].description` — ingredient efficacy claims; `items[].tag` (sometimes regulatory "Lab-tested" tag).
🔴 `items[].id`, `decorationIcons.*` URLs are 🟢 but their slots are structural.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ id?, name, description, image, tag?, showMoreText?, showLessText? }` | Each item is rendered as a card. |
| `decorationIcons` | `{ left?, right? }` | Optional decorative icons around the section. |

## How it appears on a PDP today

Authored as `keyIngredients` RCL section. Transformer:
`transform-key-ingredients-data.helper.ts` (`extractAndTransformKeyIngredientsAccordion`).

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:203` (`ACCORDION_WITH_SHOW_MORE` case) —
usually pass-through; some brands inject product-attribute-driven content.

## Gotchas

- The "show more" expansion happens **per-item**, not for the whole accordion. Each
  card collapses/expands its description independently.
- `description` accepts HTML.
