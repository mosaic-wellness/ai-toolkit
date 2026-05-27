# `MEDIA_TEXT_BLOCK`

> A block of media paired with text. Used for "About the product" hero blocks and
> narrative storytelling sections.

## Identity

- type — `MEDIA_TEXT_BLOCK`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `STORY` — brand narrative beat. The "about this product" voice.

### Edit-safety

🟢 `items[].title`, `items[].subtitle`, `items[].body` (when no new claims).
🟡 `items[].body` when asserting health / regulatory claims.
🔴 `items[].cta.actions[]`, `items[].mediaPosition`, `items[].layout` (visual contract).

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ media, title?, subtitle?, body?, cta?, mediaPosition?, layout? }` | One or more text-media blocks. |

Each item:
| Sub-field | Type | Notes |
| --------- | ---- | ----- |
| `media` | Media | Image / video / lottie. |
| `title`, `subtitle`, `body` | string | Text content. `body` supports HTML. |
| `cta` | GenericCta | Optional CTA. |
| `mediaPosition` | enum `left` / `right` / `top` / `bottom` | |
| `layout` | string | Brand-specific variant. |

## How it appears on a PDP today

Used ad-hoc. Some section transformers emit it as a fallback when no more specific
widget fits (`productDescription`, `productDescriptionWithMedia`).

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/MediaTextBlock/` or similar — trace
via `Widgets.Map.ts`.
