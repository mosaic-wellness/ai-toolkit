# `PRODUCT_REVIEW_CARD`

> A single-product review carousel — featured customer reviews specific to this
> product, shown as cards with quotes and ratings.

## Identity

- type — `PRODUCT_REVIEW_CARD`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `PROOF` — single-product review carousel.

### Edit-safety

🟢 `heading`, `subHeading`, review body copy when not asserting a new claim.
🟡 `items[].rating`, `items[].verified`, `items[].author`.
🔴 `category` (analytics), `sliderConfig` enums.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `heading` | string | Section heading. |
| `subHeading` | string | Optional secondary line. |
| `category` | string | Analytics category. |
| `items` | array of `{ author, rating, body, image?, productHandle? }` | The reviews. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |

## How it appears on a PDP today

Authored as `customerReview` (single) RCL section. Transformer:
`transform-customer-review.helper.ts`.
