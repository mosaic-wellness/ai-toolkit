# `PRODUCT_SWITCHES`

> Variant selector — quantity / size / pack-size / flavour switches that swap the
> selected SKU within a single PDP.

## Identity

- type — `PRODUCT_SWITCHES`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `CALIBRATE` — the "pick the version that fits you" beat. Each option is a sibling SKU.

### Edit-safety

🟢 `products[].label`, `products[].name`, `source`.
🟡 `products[].price`, `products[].discountedPrice`, `products[].badge` ("BEST VALUE", "SAVE 33%" are persuasion claims), `productSku` (drives which variant is selected).
🔴 `products[].sku`, `urlKeyOfBasePdp`, all `*Updating` runtime flags, action wiring.

## widgetData

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `products` | array of `{ sku, name, label, price, discountedPrice, image?, badge?, isOutOfStock?, ... }` | yes | The selectable variants. |
| `productInfo` | object | yes | Current selection's product info (middleware-injected). |
| `productSku` | string | yes | The SKU of the currently selected variant. |
| `urlKeyOfBasePdp` | string | yes | The PDP url key (used to construct switch deep-links). |
| `source` | string | no | Analytics source key (e.g. `pdp-variant-switcher`). |
| `showATCButton`, `shouldShowAtcButtonOnProductSwitch`, `showAtcButtonOnProductSwitch` | bool | no | Variants exist on whether each tile has its own ATC button. Inconsistent naming is legacy — usually only `showATCButton` is honoured. |
| `isCartUpdating`, `itemBeingUpdated` | bool, string | no | Set by frontend — leave null when authoring. |

## Example

```json
{
  "id": "pdp-variants",
  "type": "PRODUCT_SWITCHES",
  "widgetData": {
    "productSku": "MM-SHIL-60",
    "urlKeyOfBasePdp": "shilajit-gummies",
    "showATCButton": false,
    "source": "pdp-variant-switcher",
    "products": [
      { "sku": "MM-SHIL-30", "label": "1 month",  "name": "30 gummies",  "price": 599, "discountedPrice": 499, "badge": null },
      { "sku": "MM-SHIL-60", "label": "2 months", "name": "60 gummies",  "price": 999, "discountedPrice": 699, "badge": "BEST VALUE", "isOutOfStock": false },
      { "sku": "MM-SHIL-90", "label": "3 months", "name": "90 gummies",  "price": 1499, "discountedPrice": 999, "badge": "SAVE 33%" }
    ],
    "productInfo": { /* same shape as PRODUCT_CALL_TO_ACTION.productInfo */ }
  }
}
```

## How it appears on a PDP today

Authored as `productSwitches` RCL section. Transformer:
`transform-products-switches.helper.ts`. Middleware enriches via
`insertDynamicDataIntoProductPageWidgets.ts:224` (`PRODUCT_SWITCHES` case).

## Middleware enrichment

For every variant in `products[]`:

- Live Magento `price`, `discountedPrice` injected.
- `isOutOfStock` flag set from inventory.
- `image` injected if not authored.
- A `badge` like "BEST VALUE" or "SAVE 33%" is computed from per-unit price math when
  brand config opts in.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/ProductSwitch/` (re-exported as
`ProductSwitch`).

Clicking a variant navigates the user to that variant's PDP via `useVariantSwitchActions`
— it doesn't update state in-place, it pushes a new route. The route push is shallow so
the page doesn't re-fetch everything.

## Gotchas

- The legacy `PRODUCT_SWITCHER` (singular) widget is a different layout — a row of
  switcher cards used for cross-product nav (e.g. "you may also like"), not variant
  selection within one product. Don't confuse the two.
- `productSku` must match an entry in `products[]` — otherwise the widget renders no
  selection.
- A SKU appearing in `products[]` but missing from Magento gets dropped silently.
