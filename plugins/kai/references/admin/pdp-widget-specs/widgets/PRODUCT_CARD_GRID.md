# `PRODUCT_CARD_GRID`

> Grid layout of product cards (responsive 2/3/4 columns). Used for "Shop the range",
> "Other products in this collection".

## Identity

- type — `PRODUCT_CARD_GRID`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EXPAND` — adjacent products grid.

### Edit-safety

🟢 `emptyState` copy, `source`.
🟡 `products[]` price / discountedPrice.
🔴 `products[].sku`, `products[].urlKey`, `products[].id`, `productImageAspectRatio`, `noOfColumnsDesktop` (layout contract).

## widgetData

Same shape as [`PRODUCT_CARD_SLIDER`](PRODUCT_CARD_SLIDER.md), but with grid sizing:

| Field | Type | Notes |
| ----- | ---- | ----- |
| `products` | array | Same product card shape. |
| `noOfColumnsDesktop` | number | Default 4. |
| `productImageAspectRatio` | string | Per-card aspect ratio. |
| Other fields | same as `PRODUCT_CARD_SLIDER` | |

## Aliases

`MOBILE_PRODUCT_CARD_GRID` and `DESKTOP_PRODUCT_CARD_GRID` are frontend-only aliases
that dispatch to the same `ProductCardGrid` component.
