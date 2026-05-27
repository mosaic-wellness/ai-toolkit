# `SOCIAL_REVIEW_LIST`

> A vertical list of social-style review cards with photos and short quotes — designed
> to look like an Instagram/UGC feed.

## Identity

- type — `SOCIAL_REVIEW_LIST`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `PROOF` — Instagram-style UGC feed.

### Edit-safety

🟢 `reviews[].author`, body copy.
🟡 `reviews[].rating`, `reviews[].verified`, `reviews[].photo` (UGC has rights implications).
🔴 `reviews[].productHandle`, `cta.actions[]`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `reviews` | array of `{ author, photo?, rating?, body, date?, productHandle?, verified? }` | Each card. |
| `showButton` | bool | Whether to render the trailing CTA. |
| `cta` | GenericCta | "Read more reviews" or similar. |

## How it appears on a PDP today

Used ad-hoc, often as a sibling of `RATINGS_AND_REVIEWS` for richer social proof.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/SocialReviewList/`.
