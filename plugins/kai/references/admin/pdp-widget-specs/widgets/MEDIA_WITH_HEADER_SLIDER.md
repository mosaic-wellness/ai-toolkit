# `MEDIA_WITH_HEADER_SLIDER`

> A slider where each slide has its own header (title + subtitle) above the media.

## Identity

- type — `MEDIA_WITH_HEADER_SLIDER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `SHOWCASE` — slides with per-slide titles. Most common emitter for "how it works", "safe & effective", "why choose us".

### Edit-safety

🟢 per-slide title / subtitle / alt text.
🟡 slide subtitle / badge when asserting a claim ("clinically proven", "doctor-recommended").
🔴 `slidesUiType`, `sliderConfig` enums, slide `cta.actions[]`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ title, subtitle, media, cta?, badge? }` | Each slide. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |
| `slidesUiType` | string | Brand-specific variant key (e.g. `gradient`, `bordered`). |
| `titleColor`, `subtitleColor` | string | Color overrides. |
| `cardBackground` | string | Per-card background. |
| `checkIcon` | Media | Optional badge icon. |

## How it appears on a PDP today

Most common emitter is the `howItWorks`, `safeAndEffective`, `whyChooseMM`, and
`mmHowToUseV2` RCL sections. Transformers: `transform-how-it-works.helper.ts`,
`transform-safe-and-effective-data.helper.ts`, `transform-why-choose-mm.helper.ts`,
`transform-how-to-use.helper.ts`.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/MediaWithHeaderSlider/`.

## Gotchas

- The per-slide header makes this widget heavier than `MEDIA_SLIDER`. Use only when
  every slide *needs* distinct text.
- Long titles wrap to two lines and push the media down — verify on mobile.
