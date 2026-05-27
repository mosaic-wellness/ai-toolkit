# `INFO_TILE_CARD`

> A heading + grid of icon-tile cards within a gradient banner background. Used for
> "Why Endure" / "Why MM" comparison sections.

## Identity

- type — `INFO_TILE_CARD`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EVIDENCE` — "why us" tile grid.

### Edit-safety

🟡 every tile label / subtitle — they are brand claims.
🟢 `bannerGradient`, icon URLs.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `heading` | string | Section heading inside the gradient. |
| `items` | array of `{ icon: Media, label, subtitle? }` | The tile grid. |
| `bannerGradient` | string CSS gradient | Background gradient. |

## How it appears on a PDP today

Authored as `whyEndureData` RCL section. Transformer:
`transform-why-endure-data.helper.ts`.
