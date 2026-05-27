# `PRODUCT_KIT_INFO`

> Renders the "what's in the kit" section for kit/bundle products — a list of contained
> SKUs with images, names, and individual prices.

## Identity

- type — `PRODUCT_KIT_INFO`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EXPAND` / `HERO` hybrid — for kit / bundle products, this widget *is* the value reveal ("here's what you're actually getting"). For non-kit products, it doesn't appear.

### Edit-safety

🟢 `itemsCardsHeading`, `sectionName`, per-item `description`.
🟡 `kitItems[].price`, `kitItems[].quantity`, `kitItems[].name` (branded), savings math.
🔴 `kitItems[].id`, `kitItems[].sku`, `kitItems[].urlKey`.

## widgetData

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `kitItems` | array of `{ id, sku, name, image, price, quantity, description?, urlKey? }` | yes | The kit contents — usually 2–5 products. |
| `items` | array | no | Legacy alias for `kitItems`; some brands still author this. |
| `itemsCardsHeading` | string | no | Section heading rendered above the kit cards. |
| `sectionName` | string | no | Internal name used by analytics and scroll-to-section. |

### `kitItems[]`

| Sub-field | Type | Notes |
| --------- | ---- | ----- |
| `id` | string | Kit-item id (usually the SKU). |
| `sku` | string | Magento SKU. |
| `name` | string | Display name. |
| `image` | string | URL. |
| `price` | number | Per-item retail (overridden by middleware with live price). |
| `quantity` | number | How many of this SKU are included. |
| `urlKey` | string | Slug for product page; enables tap-through to the item PDP. |
| `description` | string | Optional one-liner. |

## How it appears on a PDP today

Authored as `whatsInTheKit` or `productContainsDetails` RCL section. Transformed via
`transform-whats-in-the-kit.helper.ts` and `transform-product-contains-card-data.helper.ts`.

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:153` (`PRODUCT_KIT_INFO` case) replaces
each item's `price` with live Magento price and recomputes total/savings. If an item is
out of stock, it's *kept* in the kit but flagged with a stock label.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/KitBreakdown/` — actually renders behind
the type alias `KIT_BREAKDOWN` in `Widgets.Map.ts`. The same component handles both
`PRODUCT_KIT_INFO` and the related `KIT_BREAKDOWN` type.

## Gotchas

- Kit items can be out of stock individually. If *all* items are OOS, the kit itself is
  marked OOS and middleware drops the ATC button.
- `quantity > 1` shows a "× 2" badge on the card.
- The aggregate savings line ("Save ₹X vs buying separately") is computed at render
  time from `sum(items.price) - kit.discountedPrice`.
