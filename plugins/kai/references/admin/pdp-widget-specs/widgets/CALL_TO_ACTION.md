# `CALL_TO_ACTION`

> A standalone CTA button (or button-group) — for nudge-style sections like
> "Take the quiz", "Consult a doctor", "Refer & earn".

## Identity

- type — `CALL_TO_ACTION`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `NUDGE` — non-ATC CTA ("Take quiz", "Consult", "Refer").

### Edit-safety

🟢 `items[].label`, `items[].subText`.
🟡 `items[].label` when promising a service ("Consult a doctor in 5 min" is a commitment).
🔴 `items[].actions[]`, `source`, `stickyFooterVariant`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of GenericCta | The CTA(s). |
| `direction` | enum `horizontal` / `vertical` | Stack direction for multi-CTA. |
| `isSticky`, `isStickyFooter` | bool | Whether the CTA pins to the viewport. |
| `stickyFooterVariant` | string | Visual variant when sticky. |
| `isArrowAnimatedButton` | bool | Adds the "arrow shoots forward" hover animation. |
| `source` | string | Analytics source key. |

## Gotchas

- Don't use `CALL_TO_ACTION` for ATC — that's `PRODUCT_CALL_TO_ACTION`'s job.
- For inline doctor-consult or quiz CTAs, this is the right widget.
