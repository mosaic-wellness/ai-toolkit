# `EXPANDED_MEDIA`

> The PDP hero image gallery — full-bleed slider of product images and videos with a
> share button, OOS / discontinued overlays, and a preview-modal lightbox.

## Identity

- type — `EXPANDED_MEDIA`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `HERO` — the product image / video gallery. The visual cousin of `PRODUCT_SUMMARY`.

### Edit-safety

🟢 `items[].alt`, marketing-creative URLs.
🟡 packaging shots that show regulatory copy (FSSAI marks, etc.); `discontinuedProductOverlayText`, `productOSSOverlayText`.
🔴 `productInfo.sku`, `id`, `sliderConfig` enums, `showShareButton`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `id` | string | Re-stated here for some downstream consumers. |
| `items` | array of `{ media, type, thumbnail?, alt? }` | The gallery slides. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |
| `productInfo` | object | The product context (drives OSS / discontinued overlays). |
| `showShareButton` | bool | Renders a share floating action on the gallery. |
| `discontinuedProductOverlayText` | string | Text overlaid when product is discontinued. |
| `productOSSOverlayText` | string | Text overlaid when out-of-stock. |
| `previewModal` | object | Config for the click-to-zoom modal. |

## How it appears on a PDP today

Authored as `imageGallery` RCL section, transformed by
`transform-image-slider.helper.ts` (some brands use
`transform-image-carousel.helper.ts` → `CAROUSEL_WITH_THUMBNAIL` instead).

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:188` (`EXPANDED_MEDIA` case). Injects:

- `items[]` reordered to put live product images first (sometimes admin order is
  preserved).
- `productInfo.outOfStock` / `isProductDiscontinued` flags drive overlay rendering.

## Frontend component

`apps/storefront-web/src/components/shared/.../LJ-PDP/ImageCarousel/` (the new
PDP equivalent under `mono/web-core` is `ExpandedMedia` if present).

## Gotchas

- Video slides autoplay on intersection — the first slide always uses `loading: eager`
  for LCP.
- The "share" floating action uses native share API on mobile; falls back to a copy-link
  toast on desktop.
- Don't use this widget on landing pages — it's hard-coded to expect `productInfo`.
