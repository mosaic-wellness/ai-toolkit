# `CAROUSEL_WITH_THUMBNAIL`

> Image gallery with a thumbnail strip below. Alternative to `EXPANDED_MEDIA` —
> typically used on legacy LJ-PDP layouts.

## Identity

- type — `CAROUSEL_WITH_THUMBNAIL`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `HERO` — gallery variant of `EXPANDED_MEDIA`. Same job, different layout.

### Edit-safety

🟢 `items[].alt`, decorative thumbs.
🟡 image URLs if regulated packaging.
🔴 `productInfo.sku`, `sliderConfig` enum values, `thumbnailConfig.position`.

## widgetData

Pull the full schema with `mcp__admin-mcp__get_widget_schema CAROUSEL_WITH_THUMBNAIL`.
The catalog summary reports an empty top-level — fields are deeply nested. Key shape:

| Field | Notes |
| ----- | ----- |
| `items` | Gallery items — `{ media, thumbnail }`. |
| `sliderConfig` | See [`_common.md`](_common.md). |
| `thumbnailConfig` | `{ slidesPerView, spaceBetween, position }` — separate config for the thumbnail strip. |
| `productInfo` | OSS / discontinued overlay context. |

## How it appears on a PDP today

Authored as `imageGallery` or `imageCarousel` RCL section. Transformer:
`transform-image-carousel.helper.ts`. Middleware enriches the gallery via
`insertDynamicDataIntoProductPageWidgets.ts:278` (`CAROUSEL_WITH_THUMBNAIL` case).

## Gotchas

- The thumbnail strip's `position` (`bottom` / `right`) is brand-dependent. Don't change
  it without UX sign-off.
- Variant changes update `items[]` reactively — make sure the thumbnail strip resets
  to the first slide on variant switch.
