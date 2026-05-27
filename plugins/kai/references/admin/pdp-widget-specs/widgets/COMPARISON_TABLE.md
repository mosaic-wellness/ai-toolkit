# `COMPARISON_TABLE`

> "How we compare" table — rows of features × columns of competitors with checks/crosses.

## Identity

- type — `COMPARISON_TABLE`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EVIDENCE` — competitive positioning. Heavily persuasive and **legally sensitive** — every cell is a comparative claim.

### Edit-safety

🟡 **every cell** — `tableHeader[].label`, `items[].feature`, `items[].values[]`. Comparative claims need legal sign-off.
🟢 `icons.tick`, `icons.cross`, `icons.dash` URLs (decorative).
🔴 `tableHeader[].isHighlighted` flag drives which column reads as "your brand" — structural.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `tableHeader` | array of `{ label, isHighlighted? }` | Column headers. First column is usually the feature name, rest are competitors with one highlighted as your brand. |
| `items` | array of `{ feature: string, values: (boolean | string)[] }` | Each row: a feature name and one value per column. `true` renders a tick, `false` a cross, string renders as text. |
| `icons` | `{ tick: string, cross: string, dash?: string }` | Optional override for the row icons. |

## How it appears on a PDP today

Authored as `howWeCompareV2` RCL section. Transformer:
`transform-how-we-compare.helper.ts` (`extractAndTransformHowWeCompareV2`).

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/ComparisonTable/`.

## Gotchas

- Avoid more than 4 columns on mobile — the table becomes unreadable. Brand designs
  use 3 (us + 2 competitors).
- `isHighlighted` on a column header tints the entire column. Use it for the brand
  column only.
