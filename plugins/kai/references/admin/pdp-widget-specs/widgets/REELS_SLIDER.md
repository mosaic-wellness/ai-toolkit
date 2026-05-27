# `REELS_SLIDER`

> Vertical-video / "reels" carousel — short-form videos with optional product overlay.

## Identity

- type — `REELS_SLIDER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `SHOWCASE` — vertical-video reels for social-style content.

### Edit-safety

🟢 `items[].title`, `bottomCta.label`, decorative icons.
🟡 video content via `items[].media.source` URL — the video itself may contain claims.
🔴 `items[].products[]` ref, `variant`, `sliderConfig`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ media (video), thumbnail?, title?, cta?, products? }` | Each reel slide. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |
| `variant` | string | Brand-specific style key. |
| `bottomCta` | GenericCta | Optional CTA below the slider. |
| `crossIcon` | Media | Close icon for the fullscreen reel view. |

## How it appears on a PDP today

Authored as the `stories` or `reelsSlider` RCL section. Transformers:
`transform-reels-slider.helper.ts` and `transform-reel-slider.helper.ts`.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/ReelsSlider/`. Tapping a reel opens a
fullscreen modal player with autoplay/loop and product-tag overlays.

## Gotchas

- Reels are heavy bandwidth — only render below the fold. The slider intersects-then-loads.
- Each reel can tag one product; `products` field is an array but the modal player
  shows max one tag at a time.
- Don't use this widget for long-form video. Use `YOUTUBE_CAROUSEL` instead.
