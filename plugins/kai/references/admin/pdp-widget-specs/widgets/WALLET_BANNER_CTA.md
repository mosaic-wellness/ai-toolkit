# `WALLET_BANNER_CTA`

> A banner showing the user's wallet balance and a CTA to use / earn more. Top-level
> `widgetData` fields are empty — all content is middleware-injected at read time.

## Identity

- type — `WALLET_BANNER_CTA`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `NUDGE` — wallet balance / use-credits banner.

### Edit-safety

🟢 the brand-config copy that produces title / subtitle (edited at brand-config level, not here).
🟡 wallet amounts (auto-injected; manual rewrite mis-states balance).
🔴 `cta` actions (all routing).

## widgetData

Empty top-level fields per the catalog. Middleware injects:

| Injected field | Source |
| -------------- | ------ |
| `balance` | wallet service via `walletBonusJson` |
| `bonusAmount` | per-product wallet-bonus calc |
| `title`, `subtitle` | brand wallet config |
| `cta` | brand wallet CTA config |

## How it appears on a PDP today

Authored as `walletDiscountBanner` RCL section. Transformer:
`transform-wallet-discount-banner.helper.ts`. Middleware enriches via
`insertDynamicDataIntoProductPageWidgets.ts:374` (`WALLET_BANNER_CTA` case).

## Gotchas

- For anonymous users, this widget either hides itself or shows a "Sign in to see your
  wallet" variant. Behaviour is brand-configured, not widget-configured.
