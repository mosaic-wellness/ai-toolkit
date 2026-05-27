# `PRODUCT_SUBSCRIPTION`

> "Subscribe and save" widget — lets the user pick a delivery frequency and get a
> recurring-order discount instead of a one-time buy.

## Identity

- type — `PRODUCT_SUBSCRIPTION`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `CALIBRATE` — "lock in a recurring order at a better price." Per-frequency commit.

### Edit-safety

🟢 `title`, `toolTip.title`, `toolTip.body`, `options[].label`, `options[].savingsText`.
🟡 `options[].discountPercent`, `options[].frequency`, `subscriptionInfo.*` (the subscription provider config carries commercial commitments), `oneTimeOrderCta.label` (when it offers an alternative price).
🔴 `productInfo.sku`, `subscriptionInfo.planId`, `options[].id`, action wiring.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `productInfo` | object | Identity (sku, urlKey, price). |
| `subscriptionInfo` | object | Subscription provider config — id, plan ids, base discount %. |
| `options` | array of `{ id, label, frequency, discountPercent, savingsText, isDefault }` | Frequency options ("Monthly", "Every 2 months", ...). |
| `oneTimeOrderCta` | GenericCta | Toggle to "buy once" — usually navigates back to the standard ATC. |
| `title` | string | "Subscribe & save" heading. |
| `toolTip` | object | Educational tooltip — `{ title, body, ctaLabel }`. |

## How it appears on a PDP today

Authored as `subscribeAndSave` or `productSubscription` RCL section. Middleware enriches
via `insertDynamicDataIntoProductPageWidgets.ts:355` (`PRODUCT_SUBSCRIPTION` case) —
sets live `productInfo.discountedPrice` and recomputes per-option savings.

## Frontend component

`apps/storefront-web/src/components/shared/.../SubscribeAndSave/`. The selected
frequency is stored in component state; on ATC, the subscription metadata is added to
the cart line item so checkout knows to create a recurring order.

## Gotchas

- Subscription is brand × product-scoped — products that aren't subscription-eligible
  just don't include this widget (display-order resolver excludes it).
- Cancellation policy and SLA copy belong in the `toolTip`, not the inline subtitle —
  most users expect to learn cancellation rules from a tooltip.
