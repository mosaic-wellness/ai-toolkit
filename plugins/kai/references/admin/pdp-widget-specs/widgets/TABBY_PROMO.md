# `TABBY_PROMO`

> Tabby BNPL promotional strip — "Split into 4 payments of ₹X" line. UAE-specific
> payment provider.

## Identity

- type — `TABBY_PROMO`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓ (UAE brands)
- **Narrative role** — `LOGISTICS` — UAE BNPL affordability.

### Edit-safety

🟡 `price` (live-injected). All visible text comes from the Tabby SDK iframe — not directly editable from this widget's JSON.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `price` | number | The product price Tabby splits into 4. **Always injected by middleware**. |

The Tabby script itself is loaded client-side via the public Tabby SDK key
(`NEXT_PUBLIC_TABBY_PUBLIC_KEY`).

## How it appears on a PDP today

Authored ad-hoc on UAE brand PDPs (mm-ae, bw-ae, lj-ae, etc.). Middleware enriches via
`insertDynamicDataIntoProductPageWidgets.ts:236` (`TABBY_PROMO` case) — sets `price`
from live Magento data and checks brand config `showTabbyPromotion` to decide whether
to include this widget in the response at all.

## Frontend component

`apps/storefront-web/src/components/shared/.../TabbyPromo/`. Lazy-loads the Tabby SDK
on intersection, then mounts the SDK's auto-rendered promo widget into a ref'd div.

## Gotchas

- Only UAE brands have Tabby. Adding this widget for an India brand will load the SDK
  but the Tabby widget itself errors.
- The SDK's auto-rendered widget can't be styled — it's an iframe.
