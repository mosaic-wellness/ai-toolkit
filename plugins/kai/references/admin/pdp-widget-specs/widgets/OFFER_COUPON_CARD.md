# `OFFER_COUPON_CARD`

> A coupon-code card with "tap to copy" UX.

## Identity

- type — `OFFER_COUPON_CARD`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `NUDGE` — coupon-code reveal.

### Edit-safety

🟢 `buttonText`, `copiedButtonText`, `useCodeText`.
🟡 `offerText`, `subText` (commercial copy; T&C language).
🔴 `couponCode` — never auto-rewrite the code itself. Couponcode collisions or typos break checkout discount math.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `couponCode` | string | The code (e.g. `MONSOON30`). |
| `offerText` | string | The offer description ("Flat 30% off"). |
| `subText` | string | Terms / conditions. |
| `useCodeText` | string | Helper text ("Use code at checkout"). |
| `buttonText` | string | Button label. |
| `copiedButtonText` | string | Label after copy. |

## How it appears on a PDP today

Authored as `offerCouponCard` RCL section. Transformer:
`transform-offer-coupon-card.helper.ts`.

## Gotchas

- The button triggers `SET_IN_SESSION_STORAGE` + `SHOW_INFO_MODAL` to confirm copy.
  Don't try to write a custom action — the existing one handles iOS quirks.
