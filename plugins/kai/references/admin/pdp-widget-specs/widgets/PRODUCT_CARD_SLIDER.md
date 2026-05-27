# `PRODUCT_CARD_SLIDER`

> Horizontal slider of product cards. Used for "Related", "Recently viewed", "You may
> like", etc.

## Identity

- type — `PRODUCT_CARD_SLIDER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EXPAND` — "related / explore range" horizontal slider.

### Edit-safety

🟢 `emptyState` copy, `source`.
🟡 `products[]` price / discountedPrice.
🔴 `products[].sku`, `products[].urlKey`, `productImageAspectRatio`, `miniPdpCta`, `shouldOpenMiniPdp`, `sliderConfig` enums.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `products` | array of product cards (`{ urlKey, name, image, price, discountedPrice, rating?, ... }`) | The slider items. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |
| `productImageAspectRatio` | string | Image aspect ratio for each card. |
| `cartItems` | array | Cart-state (frontend-injected). |
| `emptyState` | object | Shown if `products` is empty. |
| `enableQuantityIndicator` | bool | Show qty badge on cards already in cart. |
| `isCartUpdating`, `itemBeingAddedToCart` | bool, string | Frontend-managed. |
| `miniPdpCta`, `shouldOpenMiniPdp` | object, bool | Whether tapping the card opens a mini-PDP bottom sheet vs navigating. |
| `showATC` | bool | Show ATC button per-card. |
| `showEmptyState` | bool | Render the empty state when zero items. |
| `source` | string | Analytics source. |

## How it appears on a PDP today

Many emitters: `recentlyViewed` → `RECENTLY_VIEWED_PRODUCT_CARD_SLIDER`,
`whatItWorksBestWith` → `PRODUCT_CARD_SLIDER` directly, FBT fallback.

## Middleware enrichment

For each product in `products[]`, middleware fetches live Magento data and overrides
price/stock/image.
