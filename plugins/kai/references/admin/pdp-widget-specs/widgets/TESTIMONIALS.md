# `TESTIMONIALS`

> Customer / influencer testimonials with photos, star ratings, and quoted text.

## Identity

- type — `TESTIMONIALS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `PROOF` — influencer / expert testimonials.

### Edit-safety

🟢 styling fields (`backgroundColor`, `labelColor`, `pillColor`, `pillTextColor`).
🟡 `items[].name`, `items[].quote`, `items[].rating`, `items[].verified`, `items[].location`. Especially `verified` — has legal implications.
🔴 `starIcon`, `verifiedIcon` slots.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ name, location?, rating?, quote, image?, verified?, label?, pill? }` | Each testimonial card. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |
| `backgroundColor` | string | Slider background. |
| `labelColor` | string | "Verified" label color. |
| `pillColor`, `pillTextColor` | string | Tag pill styling. |
| `starIcon`, `verifiedIcon` | Media | Custom icons. |

## How it appears on a PDP today

Authored as `whatProsSay` or ad-hoc. Transformers handle the specific
section names.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/Testimonials/`.

## Gotchas

- `quote` is plain text, not HTML. To bold or italicize, use the `label` and `pill`
  fields, not inline markup.
- "Verified" is a UX claim with legal implications — only use it for testimonials
  obtained through the brand's verified-review pipeline.
