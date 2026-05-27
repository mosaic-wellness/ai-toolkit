# `BENEFITS_HIGHLIGHTS`

> A bulleted-list-of-benefits block with optional icons next to each line. Used for
> "Why X" or "Benefits" sections.

## Identity

- type — `BENEFITS_HIGHLIGHTS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EVIDENCE` — claim-strip. Each item is a brand-asserted benefit.

### Edit-safety

🟡 **every line** — `items[].title`, `items[].subtitle`, `items[].body`. The verb in each line carries legal weight ("helps" vs "cures" vs "guarantees").
🟢 `items[].icon` URL when decorative.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ icon?, title, subtitle?, body? }` | Each highlight. |

## How it appears on a PDP today

Authored as `claims` or `claimsV2` RCL section. Transformer:
`transform-claims-data.helper.ts`.

## Frontend component

Trace via `Widgets.Map.ts`. Component lives under `mono/web-core/widgets/`.
