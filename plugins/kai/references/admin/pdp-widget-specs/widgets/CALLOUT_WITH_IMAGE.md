# `CALLOUT_WITH_IMAGE`

> A simple text + image callout strip. Used for inline product callouts ("Gifts with
> purchase", "Free delivery on orders > ₹999").

## Identity

- type — `CALLOUT_WITH_IMAGE`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `NUDGE` — inline strip prompt (gift, free delivery, urgency).

### Edit-safety

🟢 `text`, `altText`, `image` URL.
🟡 `text` if it states a guarantee or threshold ("Free delivery on orders > ₹999").
🔴 `variant` enum.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `image` | string | Image URL (left-anchored). |
| `altText` | string | Alt text for SEO/a11y. |
| `text` | string | Callout copy (HTML-supported). |
| `variant` | string | Brand-specific theme key. |

## How it appears on a PDP today

Used for the `giftCallout` RCL section (one common emitter).
