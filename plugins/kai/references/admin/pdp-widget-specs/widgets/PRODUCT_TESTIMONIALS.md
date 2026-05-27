# `PRODUCT_TESTIMONIALS`

> A testimonial carousel where each card also links to a product. Used for
> "real customer results" galleries on multi-product PDPs.

## Identity

- type — `PRODUCT_TESTIMONIALS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `PROOF` — testimonial cards linked to sibling products.

### Edit-safety

🟢 `products[].customerName`, `products[].testimonial` (when no new claims).
🟡 `products[].rating`, claim-bearing testimonial copy.
🔴 `products[].urlKey`, `carouselConfig`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `products` | array of `{ name, urlKey, image, testimonial, customerName, rating }` | Each card is a product + testimonial pair. |
| `carouselConfig` | object | See [`_common.md`](_common.md). |

## How it appears on a PDP today

Used ad-hoc. Less common than `TESTIMONIALS`.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/TestimonialProductCardCarousel/`.

## Gotchas

- Each card's `urlKey` should be a sibling product PDP. Linking to non-product pages
  defeats the purpose of the widget.
