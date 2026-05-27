# `PRODUCT_SUMMARY`

> The above-the-fold product card: name, price, discount, rating, callouts, installment
> options, snapmint banner. The "buy box" of a PDP without the ATC button itself.

## Identity

- **type** — `PRODUCT_SUMMARY`
- **headerSupported** — true
- **layoutSupported** — true
- **PDP relevance** — ✓ (every PDP has exactly one)
- **Narrative role** — `HERO` — the buy-box. The single most-load-bearing widget on the page: name, price, discount, rating, key highlights. The first thing the user reads after the gallery.

## When to use

Always present at the top of a PDP. Pair it with [`PRODUCT_CALL_TO_ACTION`](PRODUCT_CALL_TO_ACTION.md) for the ATC behaviour and [`EXPANDED_MEDIA`](EXPANDED_MEDIA.md) or [`CAROUSEL_WITH_THUMBNAIL`](CAROUSEL_WITH_THUMBNAIL.md) for the image gallery. There should only be one `PRODUCT_SUMMARY` per page.

## widgetData

All fields are required by the schema. Most are populated by static-service at
transform-time and overridden by middleware at read-time with live data.

Edit-safety legend: 🟢 AI-safe · 🟡 Sensitive (operator review) · 🔴 Structural (engineer only). See [`_conventions.md`](_conventions.md).

| Field | Type | Edit | Notes |
| ----- | ---- | ---- | ----- |
| `productSummary` | object | (per sub-field) | The price/rating block (see below). |
| `callouts` | array | 🟡 | Above-summary callout strip (wallet bonus, applied coupon). Commercial copy. |
| `cashbackInfo` | object | 🟡 | Wallet-bonus info box. `cashbackAmount` 🟡; `infoText`, `dialogBox.headerText`, `dialogBox.text` 🟢; `infoImage` URL 🟢. |
| `installMentOptionType` | enum `simpl` / `snapmint` | 🔴 | Provider key — switching providers is an engineering change. |
| `isPayLater` | bool | 🟡 | Toggles BNPL variant. |
| `showInstallmentOptions` | bool | 🟡 | Master toggle for EMI line. |
| `snapMintData` | object | 🟡 | `price` is live-injected; `showSnapMintPayOnSalary` 🟡. |
| `snapmintPayOnSalaryWidget` | object | 🟡 | `isEnabled` 🟡; `maximumPrice` 🟡. |
| `widgetContent` | string (HTML) | 🟢 | Free-form HTML below the summary. Safe to rewrite if no new claims. |
| `onRatingsClick` | object | 🔴 | `actions[]` is action wiring — never rewrite. |

### `productSummary` sub-object

| Sub-field | Type | Edit | Notes |
| --------- | ---- | ---- | ----- |
| `name` | string | 🟡 | Product name. Brand-controlled identity. |
| `subtitle` | string | 🟢 | "60 capsules · 30-day supply" — safe copy. |
| `actualPrice` | number | 🟡 | MRP. Live-injected; manual edit is a pricing event. |
| `actualPriceLabel` | string | 🟢 | "MRP" label. |
| `discountedPrice` | number | 🟡 | Live-injected. Same as `actualPrice`. |
| `discountedPriceLabel` | string | 🟢 | "Best Price" label. |
| `discountText` | string | 🟡 | "30% OFF" — derived from prices, sensitive. |
| `discountTagImage` | string (URL) | 🟢 | Decorative badge asset. |
| `hidePrice` | bool | 🟡 | Hides price entirely — RX/consult only. |
| `rating` | string | 🟡 | Aggregate rating — live-injected; auto-rewrite would mislead. |
| `reviewCount` | string | 🟡 | Same. |
| `productReviewedText` | string | 🟢 | "verified reviews" label. |
| `showReviewedLabel` | bool | 🟢 | Toggle. |
| `showTaxesLabel` | bool | 🟢 | Toggle. |
| `taxesLabel` | string | 🟡 | Tax-inclusive language is regulatory. |
| `unitsSold` | string | 🟡 | "50,000+ sold" — social proof claim. |
| `highlights[]` | `{ text }[]` | 🟢 | Bullet copy. Safe if no new claims. |
| `priceAndRatingDetailsPosition` | enum | 🟢 | Layout switch. |
| `currentlyViewing` | object | 🟡 | Social-proof noise base — synthetic but a "fact-like" number. |

## Example

```json
{
  "id": "product-summary-top",
  "type": "PRODUCT_SUMMARY",
  "layout": {
    "type": "CONTAINED",
    "verticalSpacing": { "top": "COMPACT", "bottom": "GENEROUS" }
  },
  "widgetData": {
    "productSummary": {
      "name": "Shilajit Gummies",
      "subtitle": "60 gummies · 30-day supply",
      "actualPrice": 999,
      "actualPriceLabel": "MRP",
      "discountedPrice": 699,
      "discountedPriceLabel": "Best Price",
      "discountText": "30% OFF",
      "discountTagImage": "https://cdn/discount-tag.png",
      "hidePrice": false,
      "rating": "4.6",
      "reviewCount": "12,847 reviews",
      "productReviewedText": "verified reviews",
      "showReviewedLabel": true,
      "showTaxesLabel": true,
      "taxesLabel": "Inclusive of all taxes",
      "unitsSold": "50,000+ bottles sold",
      "highlights": [
        { "text": "Boosts energy & stamina" },
        { "text": "Plant-based · sugar-free" }
      ],
      "priceAndRatingDetailsPosition": "TOP",
      "currentlyViewing": {
        "currentlyViewingBase": 80,
        "minNoiseRange": 5,
        "noiseRange": 30
      }
    },
    "callouts": [
      {
        "type": "wallet",
        "primaryText": "Earn ₹50 wallet cashback",
        "secondaryText": "on this order",
        "cta": { },
        "walletTier": { "amount": 50, "bonus": 0 }
      }
    ],
    "cashbackInfo": {
      "cashbackAmount": 50,
      "infoText": "Use it in your next order",
      "infoImage": "https://cdn/wallet.svg",
      "dialogBox": {
        "headerText": "How wallet works",
        "text": "Wallet credits…"
      }
    },
    "installMentOptionType": "snapmint",
    "isPayLater": false,
    "showInstallmentOptions": true,
    "snapMintData": { "price": 699, "showSnapMintPayOnSalary": false },
    "snapmintPayOnSalaryWidget": { "isEnabled": false, "maximumPrice": 1500 },
    "widgetContent": "",
    "onRatingsClick": {
      "actions": [
        { "actionName": "SCROLL", "params": { "widgetId": "ratings-and-reviews" } }
      ]
    }
  }
}
```

## How it appears on a PDP today

Authored as the `productInfo` (and partial `order`) RCL sections. Static-service
transforms via `transform-pdp-hero-section.helper.ts` and
`transform-product-summary.helper.ts`.

## Middleware enrichment

`PRODUCT_SUMMARY` is the **most enriched widget** on a PDP. Middleware's
`insertDynamicDataIntoProductPageWidgets.ts:134` injects:

- `productSummary.name`, `actualPrice`, `discountedPrice`, `discountText` from live
  Magento.
- `productSummary.rating`, `reviewCount` from `getRatingAggregateData`.
- `productSummary.unitsSold` (when enabled) from product attribute.
- `cashbackInfo.cashbackAmount` from `walletBonusJson` and brand wallet config.
- `snapMintData.price` from live discounted price (so EMI math is correct).
- `currentlyViewing.currentlyViewingBase` is sometimes recomputed from
  `pdpTrafficDensity` (live traffic signal).
- `installMentOptionType` selected from brand config + cart-value gating.

If a field is admin-authored and a live value also exists, the **live value wins** for
price / rating / SKU.

## Frontend component

- `apps/storefront-web/src/mono/web-core/auditedWidgets/ProductSummary/ProductSummaryContainer.tsx`
- Mounts a tracker for ratings clicks (`onRatingsClick.actions[]`).
- On variant switch, this widget is **not** re-mounted — only its props update from the
  cart store.

## Gotchas

- The summary's `discountedPrice` is bound to *the currently-selected variant*, not the
  product as authored. If you switch variants, the widget rerenders with new numbers.
- `hidePrice: true` is reserved for products that go through a consult flow before
  pricing is known (RX products). Don't use it as a "price coming soon" placeholder.
- The `currentlyViewing` value is **client-deterministic** (seeded by URL key) — two
  users see the same number at the same moment, by design. Don't try to make it live.
- `widgetContent` accepts raw HTML — sanitize before injecting user input. Admin UI
  trusts admin authors here.
