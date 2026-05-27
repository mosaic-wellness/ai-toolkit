# `MEDIA_SLIDER`

> Generic horizontal slider of media items (images, videos, or both). Used for
> ingredient strips, lifestyle imagery, doctor videos.

## Identity

- type — `MEDIA_SLIDER` (also aliased as `CLICKABLE_IMAGE_SLIDER`, `MOBILE_IMAGE_SLIDER`, `DESKTOP_IMAGE_SLIDER` in the frontend map)
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `SHOWCASE` — ingredient strips, lifestyle imagery, doctor videos.

### Edit-safety

🟢 `items[].title`, `items[].subtitle`, alt text, marketing-creative URLs.
🟡 slide CTAs that imply a commitment.
🔴 `items[].cta.actions[]`, `sliderConfig` enums, `tickIcon`/`checkIcon` slots (their presence carries semantic meaning).

## widgetData

Pull the full schema with `mcp__admin-mcp__get_widget_schema MEDIA_SLIDER`. Key fields:

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ media: Media, title?, subtitle?, cta?, ... }` | Each slide. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |
| `aspectRatio` | string `W:H` or number | Slide aspect ratio. |
| `showTitle`, `showSubtitle` | bool | Per-slide text overlay toggles. |
| `tickIcon`, `checkIcon` | Media | Optional checkmark icons rendered on each slide. |
| `cardBackground` | string | Background color. |
| `titleColor`, `subtitleColor` | string | Color overrides. |

## How it appears on a PDP today

Many section transformers emit `MEDIA_SLIDER`:
- `keyIngredients` (the carousel variant)
- `clinicalProof`
- `doctorVideo`
- `reviewsVideo`
- `imageGallery` (variant)
- `mediaSliderBanners` (variant)

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/MediaSlider/MediaSlider.tsx`. Uses
Swiper under the hood. Lazy-loads non-visible slides.

## Gotchas

- The CTA on each slide is independent. Don't try to use a single CTA for the whole
  slider — use the header CTA instead.
- For videos, set `autoplay: false` unless the slider is meant to autoplay on scroll.
- Setting `aspectRatio` per-slide is **required** for CLS budget — variable-ratio
  sliders trigger layout shift.
