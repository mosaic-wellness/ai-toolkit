# `PRODUCT_CALL_TO_ACTION`

> The Add-to-Cart / Buy-Now buttons on a PDP — both the inline placement and the
> sticky-footer placement.

## Identity

- **type** — `PRODUCT_CALL_TO_ACTION`
- **headerSupported** — true
- **layoutSupported** — true
- **PDP relevance** — ✓ (every PDP has one; configures both inline and sticky-footer)
- **Narrative role** — `COMMIT` — the conversion moment. The widget that turns intent into a cart line. Always paired with [`PRODUCT_SUMMARY`](PRODUCT_SUMMARY.md)'s HERO and persists as the sticky footer.

### Edit-safety summary

🟢 AI-safe: `ctaLabel`, `goToCartLabel`, `bottomSheetProductsList.title`, copy fields on bottom-sheet products (`instruction`, `instructionList[]`, `duration`, `name`).
🟡 Sensitive: `productInfo.*` price / OOS / rating fields, `productInfo.preorder.*`, `productInfo.highlights[].text`, `bottomSheetProductsList.products[].price`, `selectedFrequency`, anything that reads as a commitment to the customer.
🔴 Structural: `productInfo.sku`, `productInfo.urlKey`, `bottomSheetProductsList.products[].id`, `bottomSheetProductsList.products[].sku`, `stickyFooterVariant`, `isStickyFooter`, `showBottomSheetOnAtc`, action wiring inside any CTA.

## When to use

Always present on a buyable PDP. Two visual variants are controlled by
`isStickyFooter`:

- `isStickyFooter: false` → renders inline (e.g. under `PRODUCT_SUMMARY`).
- `isStickyFooter: true` → renders as a fixed footer at the bottom of the viewport.

Some PDPs declare two `PRODUCT_CALL_TO_ACTION` widgets — one inline, one sticky-footer.

## widgetData

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `productInfo` | object | yes | Live-price + stock state, set by middleware. See `productInfo` table below. |
| `ctaLabel` | string | no | Override for the primary button label (e.g. "Add to cart"). If absent, brand default. |
| `goToCartLabel` | string | no | Label shown after the product is already in cart. |
| `isStickyFooter` | bool | yes | Variant switch. |
| `stickyFooterVariant` | string | yes | Brand-specific layout key (`default`, `compact`, `with-thumbnail`, etc.). |
| `showStickyFooterPermanent` | bool | no | If true, sticky footer stays visible even when inline CTA is in view. Default false. |
| `showProductInfoOnStickyFooter` | bool | no | If true, sticky footer shows mini product card alongside CTA. |
| `showBottomSheetOnAtc` | bool | yes | If true, opens an upsell bottom sheet after ATC. |
| `showCtaInProductDescription` | bool | no | Renders a small CTA inside long product description. |
| `bottomSheetProductsList` | `{ title, products: BottomSheetProduct[] }` | only if `showBottomSheetOnAtc` true | Upsell products. |

### `productInfo` sub-object

Set entirely by middleware enrichment — admins shouldn't author these manually.

| Sub-field | Type | Notes |
| --------- | ---- | ----- |
| `name`, `subtitle`, `urlKey`, `sku` | string | Product identity. |
| `actualPrice`, `discountedPrice` | number | Live from Magento. |
| `actualPriceLabel`, `discountedPriceLabel`, `discountText` | string \| null | |
| `taxesLabel`, `showTaxesLabel` | string, bool | |
| `outOfStock`, `outOfStockLabel` | bool, string \| null | Drives Notify-Me variant. |
| `preorder` | `{ status, label, subtitle }` | If `status` true, ATC label becomes "Preorder". |
| `redirectToCart` | bool | If true, the action after ATC is "go to cart" not the upsell sheet. |
| `productImg` | string | Used in sticky-footer mini product card. |
| `rating`, `reviewCount`, `reviews` | number, number, string | |
| `recommendation` | string | "Best for…" tagline. |
| `currentlyViewing` | `{ currentlyViewingBase, noiseRange }` | Optional social proof. |
| `headingLevel`, `subHeadingLevel` | number | SEO heading level overrides (rare). |
| `ctaLayout` | enum `simple` / `standard` | Visual variant. |
| `unitsSold` | number | |
| `highlights` | `{ text: string }[]` | Inline highlight bullets in sticky-footer expanded state. |
| `hidePrice` | bool | RX products. |

### `bottomSheetProductsList.products[]`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id`, `name`, `category` | string | Identity. |
| `image` | string | |
| `price` | number | |
| `quantity` | number | Pre-filled qty. |
| `duration` | string | "30 days" — display label. |
| `frequencyList` | `{ label, value }[]` | Subscription frequency options. |
| `selectedFrequency` | string | Default frequency. |
| `instruction`, `instructionList[]` | string | "Take 1 capsule daily" + list of bullets. |
| `selected` | bool | Pre-selected in the sheet. |
| `subcategory[]`, `tags[]` | string[] | |

## Example

```json
{
  "id": "pdp-cta-sticky",
  "type": "PRODUCT_CALL_TO_ACTION",
  "widgetData": {
    "isStickyFooter": true,
    "stickyFooterVariant": "with-thumbnail",
    "showStickyFooterPermanent": false,
    "showProductInfoOnStickyFooter": true,
    "showBottomSheetOnAtc": true,
    "ctaLabel": "Add to cart",
    "goToCartLabel": "Go to cart",
    "productInfo": {
      "name": "Shilajit Gummies",
      "subtitle": "60 gummies",
      "urlKey": "shilajit-gummies",
      "sku": "MM-SHIL-60",
      "actualPrice": 999,
      "discountedPrice": 699,
      "discountedPriceLabel": "Best Price",
      "actualPriceLabel": "MRP",
      "discountText": "30% OFF",
      "taxesLabel": "Inclusive of all taxes",
      "showTaxesLabel": true,
      "outOfStock": false,
      "outOfStockLabel": null,
      "preorder": { "status": false, "label": "", "subtitle": "" },
      "redirectToCart": false,
      "productImg": "https://cdn/shilajit.jpg",
      "rating": 4.6,
      "reviewCount": 12847,
      "reviews": "12,847 reviews",
      "recommendation": "Best for men 25+",
      "ctaLayout": "standard",
      "unitsSold": 50000,
      "highlights": [{ "text": "Boosts energy" }],
      "hidePrice": false,
      "headingLevel": 1,
      "subHeadingLevel": 2,
      "currentlyViewing": { "currentlyViewingBase": "80", "noiseRange": "30" }
    },
    "bottomSheetProductsList": {
      "title": "Customers also bought",
      "products": [ { "id": "MM-BIOTIN-30", "name": "Biotin Tablets", "category": "supplements", "duration": "30 days", "instruction": "Take 1 daily", "instructionList": ["After breakfast"], "frequencyList": [{ "label": "Monthly", "value": "30" }], "selectedFrequency": "30", "selected": false, "quantity": 1 } ]
    }
  }
}
```

## How it appears on a PDP today

Authored as the `buyNow` RCL section. Static-service transforms via
`transform-add-to-cart-cta.helper.ts` (specifically
`extractAndTransformAddToCartCtaForBuyOptions`).

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:343` (`PRODUCT_CALL_TO_ACTION` case):

- Injects entire `productInfo` from `updatedProductInfo` (the result of merging
  Magento product data with auth/repeat-user context).
- Sets `outOfStock`, `outOfStockLabel` from stock service.
- Drops the upsell `bottomSheetProductsList` if `showBottomSheetOnAtc` is false (saves
  payload size).
- Sets `preorder` from product attribute when product is in preorder window.

## Frontend component

- `apps/storefront-web/src/mono/web-core/auditedWidgets/ProductCallToAction/ProductCallToActionContainer.tsx`
- Uses `useGenericCtaV2` to wire ATC, Buy-Now, Notify-Me, and Go-to-Cart click handlers.
- Subscribes to `useCartStore` so when this item is in cart, the label switches to
  `goToCartLabel`.
- Triggers `EVENT_MAP.ATC_CLICKED` and `EVENT_MAP.BUY_NOW_CLICKED` with full product
  context.

## Gotchas

- A PDP can have **two** `PRODUCT_CALL_TO_ACTION` widgets (one inline + one sticky).
  They share state via the cart store, not via the widget tree.
- For out-of-stock variants, the ATC button auto-converts to a "Notify me" CTA — no
  separate widget needed.
- `showStickyFooterPermanent` overrides the intersection-observer-based hide. Use only
  for promo events where you want the CTA always present.
- The bottom-sheet upsell list is **separately enriched** by middleware — if the
  upsell products are out of stock at read time, they get filtered out of the list.
