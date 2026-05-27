# `STATUS_CARD`

> A small inline card showing a single status / alert — "this product is in your cart",
> "your last order was on X", etc.

## Identity

- type — `STATUS_CARD`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `NUDGE` — small contextual alert card.

### Edit-safety

🟢 `heading`, `alertMessage` (when describing user state).
🟡 messaging that implies cart state ("Item already in your cart").

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `heading` | string | Status text. |
| `alertMessage` | string | Optional secondary message. |

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:187` — same case as `EXPANDED_MEDIA`, both
share enrichment context. The cart/order context drives the visibility of this widget.
