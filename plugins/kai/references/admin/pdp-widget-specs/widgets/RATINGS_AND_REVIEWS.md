# `RATINGS_AND_REVIEWS`

> The ratings overview + top reviews block. Renders the avg-rating, star breakdown,
> top-N reviews, and a "view all reviews" CTA.

## Identity

- type — `RATINGS_AND_REVIEWS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `PROOF` — the social-validation beat. The default proof widget on every PDP.

### Edit-safety

🟢 `topReviewsLabel`, `starLabels.*` copy, `writeReviewCta.label`, `allReviewsCtaLabel`.
🟡 `ratingOverview.average`, `ratingOverview.total`, `ratingOverview.breakdown.*` (numeric ratings — auto-injected, never manually rewrite); `topReviews[].body`, `topReviews[].rating`, `topReviews[].verified`, `customerSay` AI summary.
🔴 `urlKey`, `productInfo.sku`, `endpointData.url`, `endpointData.method`, `writeReviewCta.actions[]`, `allReviewsCta.actions[]`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `productInfo` | object | Identity (sku, urlKey). |
| `urlKey` | string | Used to construct "/all-reviews" deep link. |
| `ratingOverview` | `{ average: number, total: number, breakdown: { "5": pct, "4": pct, ... } }` | Avg rating + per-star %. |
| `starLabels` | `{ "5": "Excellent", "4": "Very good", ... }` | Per-star text labels. |
| `topReviews` | array of `{ author, rating, title?, body, date, verified, helpfulCount, media? }` | The first 3–5 reviews. |
| `topReviewsLabel` | string | Section heading for the reviews carousel. |
| `customerSay` | object | Optional AI-generated summary (from `aiGeneratedCustomerSayData`). |
| `allReviewsCta` | GenericCta | "Read all reviews" CTA — typically `NAVIGATE` to `/products/<urlKey>/all-reviews`. |
| `allReviewsCtaLabel` | string | Plain-text override for the CTA label. |
| `showAllReviewCta`, `showWriteReview` | bool | Toggles for the two CTAs. |
| `writeReviewCta` | GenericCta | "Write a review" CTA. |
| `newReview` | object | Empty in the JSON — frontend writes into it. |
| `endpointData` | `{ url, method }` | The review-fetch endpoint for pagination. |

## How it appears on a PDP today

Authored as `reviews` RCL section, transformed to `RATINGS_AND_REVIEWS` widget by the
section transformer chain. Middleware enriches via
`insertDynamicDataIntoProductPageWidgets.ts:296` with the live rating aggregate from
`getRatingAggregateData`.

## Middleware enrichment

- `ratingOverview.average`, `total`, `breakdown` from `getRatingAggregateData`.
- `topReviews[]` re-fetched only if missing from authored JSON; otherwise pass-through.
- `customerSay` injected from `aiGeneratedCustomerSay` (AI summarisation per product).

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/RatingsAndReviews/`.

Pagination: clicking `allReviewsCta` navigates to `/products/<urlKey>/all-reviews` which
is its own Next.js page (not a widget).

Adds JSON-LD `Product.aggregateRating` for rich snippets.

## Gotchas

- If a product has no reviews, this widget either hides itself or shows a "be the first
  to review" empty state — controlled by brand config, not per-widget.
- The star breakdown percentages are computed at server time; don't expect them to update
  in-session when a user submits a new review (the page would need to refresh).
- `customerSay` AI summary refreshes on a slower cadence (daily batch). The text may lag
  the latest reviews.
