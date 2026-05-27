# `YOUTUBE_CAROUSEL`

> A horizontal carousel of YouTube video cards — used for doctor explainers,
> testimonials, "watch how it works" content.

## Identity

- type — `YOUTUBE_CAROUSEL`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `SHOWCASE` — doctor explainers / expert long-form video.

### Edit-safety

🟢 `items[].title`, `items[].subtitle`, custom `thumbnail` URLs, `playIcon`.
🟡 expert / doctor names in `items[].channel` (authority claim).
🔴 `items[].videoId` (YouTube ID — never auto-edit; wrong ID breaks the embed), `carouselConfig` / `sliderConfig` enums.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ videoId, title?, subtitle?, thumbnail?, channel?, duration? }` | Each card. `videoId` is the YouTube ID, not the full URL. |
| `sliderConfig`, `carouselConfig` | object | Either is honoured — see [`_common.md`](_common.md). |
| `playIcon` | Media | Optional custom play icon overlaid on thumbnails. |

## How it appears on a PDP today

Authored as `doctorYoutubeVideo` or ad-hoc. Transformer:
`transform-doctors-youtube-video.helper.ts`.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/...` — trace via `Widgets.Map.ts`. Uses
the YouTube iframe API; lazy-mounts only on tap to avoid loading the script eagerly.

## Gotchas

- YouTube SDK is heavy. Each video card defers actual iframe mount until tap.
- `thumbnail` is optional — if missing, the YT-provided thumbnail (480p) is fetched.
  Author a custom thumbnail for LCP / visual control.
- Don't paste the full YouTube URL in `videoId`. The regex parsing is strict — see
  `static-service/src/modules/staticService/helpers/mappers/rcl-pdp-to-widetized-pdp/constant.ts`
  for the `YOUTUBE_ASSET_URL_REGEX`.
