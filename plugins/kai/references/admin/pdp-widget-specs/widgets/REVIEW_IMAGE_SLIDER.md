# `REVIEW_IMAGE_SLIDER`

> A slider of customer-submitted photos with ratings overlay. Used for the
> "real photos from customers" section.

## Identity

- type — `REVIEW_IMAGE_SLIDER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `PROOF` — UGC photo strip.

### Edit-safety

🟢 `items[].customerName`, body copy.
🟡 `items[].rating`, `customerRating` aggregate.
🔴 `items[].productHandle`, `aspectRatio`, `sliderConfig`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ image, customerName?, rating?, body?, productHandle? }` | Each slide. |
| `customerRating` | object | Aggregate rating overlay shown on the strip. |
| `aspectRatio` | string `W:H` | Per-image ratio (usually `1:1`). |
| `sliderConfig` | object | See [`_common.md`](_common.md). |

## How it appears on a PDP today

Authored as `reviewsVideo` or `reviewImages` RCL section. Transformer:
`transform-reviews-video.helper.ts`.
