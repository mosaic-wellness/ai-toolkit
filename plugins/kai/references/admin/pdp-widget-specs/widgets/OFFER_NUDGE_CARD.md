# `OFFER_NUDGE_CARD`

> A promotional / wallet / coupon nudge card. Often used as a sticky banner near the
> top of a PDP to draw attention to an active offer.

## Identity

- type — `OFFER_NUDGE_CARD`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `NUDGE` — wallet / coupon nudge banner.

### Edit-safety

🟢 `title`, `subtitle`, `preTitle`, `tag`, decorative `media`.
🟡 `cta.label` when it implies a payout; visible offer amounts.
🔴 `cta.actions[]`, `productInfo.sku`, `urlKey`, `shouldShow` / `showAffiliateCard` / `showWalletNudgeNew` (middleware-set toggles).

## widgetData

Identical schema to [`AFFILIATE_CARD`](AFFILIATE_CARD.md) — same component renders both
with different copy / actions. See that spec for the full field set.

## How it appears on a PDP today

Authored as `walletNudge` or `offerNudge` RCL section. Transformer:
`transform-wallet-nudge.helper.ts`. Middleware enriches via
`insertDynamicDataIntoProductPageWidgets.ts:332` (`OFFER_NUDGE_CARD` case).

## Middleware enrichment

- `shouldShow` set based on whether an offer is active for the user/product/cart.
- `cta` payload may include the coupon code to apply.
- Wallet/affiliate user data populated from auth context.
