# `MULTI_PRODUCT_SELECTOR`

> "Frequently bought together" — a multi-product picker where the user toggles items
> on/off and the bundle price updates live, then adds the whole selection to cart in
> one click.

## Identity

- type — `MULTI_PRODUCT_SELECTOR`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EXPAND` — the cart-broadening "complete the routine" beat.

### Edit-safety

🟢 `pricingLabels.*` copy, `cta.label`, header copy.
🟡 `products[].price`, `products[].discountedPrice`, `bundleConfig.discountPercent`, savings copy.
🔴 `products[].sku`, `products[].urlKey`, `cta.actions[]` (the `ADD_TO_CART_MULTIPLE` payload).

## widgetData (high-level)

| Field | Type | Notes |
| ----- | ---- | ----- |
| `products` | array of `{ sku, name, image, price, discountedPrice, selected, quantity, ... }` | The selectable bundle items. |
| `bundleConfig` | object | Bundle pricing config — discount %, savings copy, max items. |
| `cta` | GenericCta | "Add selected to cart" — uses `ADD_TO_CART_MULTIPLE`. |
| `pricingLabels` | object | "Total", "Savings", "Pay" copy. |

Pull the full schema with `mcp__admin-mcp__get_widget_schema MULTI_PRODUCT_SELECTOR`.

## How it appears on a PDP today

Authored as `frequentlyBoughtTogether` RCL section. Transformers:
`transform-frequently-bought-together.helper.ts` (`extractAndTransformFBT` and
`extractAndTransformFBTRCL`). Each FBT product gets its live price and stock from the
middleware product-data fetch.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/MultiProductSelector/` or nearby — trace
via `Widgets.Map.ts`. The bundle CTA fires `ADD_TO_CART_MULTIPLE` with the selected
SKUs.

## Gotchas

- The base product (the PDP itself) is usually the first item, pre-selected and
  non-deselectable. If you allow deselecting it, the bundle becomes a stranded cart
  add.
- Out-of-stock FBT items are filtered out by middleware, not by the frontend.
- The savings %-off is computed at render time, not authored. Don't paste it into copy
  fields.
