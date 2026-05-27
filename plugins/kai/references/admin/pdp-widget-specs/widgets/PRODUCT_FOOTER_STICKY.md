# `PRODUCT_FOOTER_STICKY`

> The sticky bottom-of-screen footer with ATC + Buy Now + secondary nudges. The rich
> cousin of `PRODUCT_CALL_TO_ACTION` (sticky variant) — supports more nudges, more
> CTAs, and richer product info.

## Identity

- type — `PRODUCT_FOOTER_STICKY`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `COMMIT` — the rich sticky-footer variant. The richest enrichment on the page; carries cart, OOS, QD, repeat-user state.

### Edit-safety

🟢 `bottomToastConfig` copy, `goToCartCta.label`, `bottomSheetProductsList.title`, copy in `cartRedirectNudge`.
🟡 every price / OOS / preorder / QD field, `dynamicCTAs[]` labels (time-windowed promo language), `outOfStockProduct` copy.
🔴 `productInfo.sku`, `sku`, `productInfo.urlKey`, all action wiring in `bottomStickyAddToCartButton` / `bottomStickyBuyNowButton` / `goToCartCta`, `pdpAtcLoginConfig`, `isBrandInternational`, `virtual_product_type`, all `*Updating` runtime flags.

## widgetData

The richest schema on a PDP. Top-level fields:

| Field | Type | Notes |
| ----- | ---- | ----- |
| `productInfo`, `sku`, `thumbnail`, `source` | mixed | Product context (middleware-injected). |
| `bottomStickyAddToCartButton`, `bottomStickyBuyNowButton` | GenericCta | The two primary CTAs. |
| `buyNow`, `buyNowProductsList` | object, array | Buy-Now flow context — for single-product or multi-product checkout. |
| `bottomSheetProductsList` | object | Upsell bottom-sheet items (when `showBottomSheetOnAtc`). |
| `notifyMeBottomSheetProducts` | array | Notify-Me upsells for OOS products. |
| `goToCartCta`, `cartRedirectNudge` | GenericCta, object | The "Go to cart" CTA and the post-ATC nudge config. |
| `checkLocationCta`, `editLocationCta` | GenericCta | Pincode entry triggers. |
| `checkDeliveryDateSectionData`, `deliveryToastData` | object | Delivery date copy + live data. |
| `isQuickDeliveryEnabled`, `isQuickDeliveryEligible`, `commitmentType`, `qddData` | bool, bool, enum, object | Quick-delivery state. |
| `isOOS`, `outOfStockProduct`, `oosOverlayVisible`, `oosDeliveryToastText` | bool, object, bool, string | OOS state. |
| `pdpAtcLoginConfig` | object | Auth-gated ATC flow config. |
| `dynamicCTAs` | array | Per-context CTAs (varies by repeat-user / subscription / cart-value). |
| `showBottomSheetOnAtc`, `showBottomSheetOnBuyNow` | bool | Toggles for post-CTA sheets. |
| `isBrandInternational` | bool | UAE / US brands have slightly different sticky behaviour. |
| `repeatUser` | bool | Drives messaging variant. |
| `isCartLoading`, `isCartUpdating`, `itemBeingUpdated`, `bottomToastConfig` | mixed | Frontend-managed state. |
| `virtual_product_type` | string | RX / consult flag. |
| `products` | array | Cross-sell products list. |

Pull the full schema with `mcp__admin-mcp__get_widget_schema PRODUCT_FOOTER_STICKY` —
it's the largest single widget schema in the catalog.

## How it appears on a PDP today

Authored as part of `buyNow` or `productFooterSticky` RCL sections. Middleware enriches
heavily via `insertDynamicDataIntoProductPageWidgets.ts:210` (`PRODUCT_FOOTER_STICKY`
case).

## Middleware enrichment

The richest enrichment on the page. Injects: live product info, OOS state, QD
eligibility, cart state, upsell list, login config, repeat-user nudges.

## Frontend component

`apps/storefront-web/src/mono/web-core/auditedWidgets/ProductFooterSticky/` (the
container path varies — trace via `Widgets.Map.ts`).

## Gotchas

- This widget is **mutually exclusive** with the sticky-footer variant of
  `PRODUCT_CALL_TO_ACTION`. Pick one — putting both creates two sticky bars.
- The Buy-Now flow short-circuits cart and goes straight to checkout with this single
  SKU. If there are subscription frequency choices, those still get respected.
- `dynamicCTAs[]` is the right place for time-windowed promo CTAs (e.g. flash-sale
  "Add for ₹X today only"). Don't author them in the inline ATC button.
