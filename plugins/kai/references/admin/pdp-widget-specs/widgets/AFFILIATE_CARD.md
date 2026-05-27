# `AFFILIATE_CARD`

> Affiliate-program promo card shown to affiliate users — earnings nudge, share link,
> CTA to refer.

## Identity

- type — `AFFILIATE_CARD`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓ (affiliate users only)
- **Narrative role** — `NUDGE` — affiliate "share & earn" personalised prompt.

### Edit-safety

🟢 `title`, `subtitle`, `preTitle`, `tag`.
🟡 `cta.label`, `media`, any payout-implying amount, `membershipPassNudge` copy.
🔴 `affiliateUser.id`, `urlKey`, `productInfo.sku`, `shouldShow` / `showAffiliateCard` / `showWalletNudgeNew` (middleware-set), `cta.actions[]`.

## widgetData

Same shape as [`OFFER_NUDGE_CARD`](OFFER_NUDGE_CARD.md). Notable fields:

| Field | Type | Notes |
| ----- | ---- | ----- |
| `affiliateUser` | object | The affiliate user context (id, name, level). |
| `shouldShow` / `showAffiliateCard` / `showWalletNudgeNew` | bool | Visibility toggles — usually driven by middleware enrichment. |
| `cta` | GenericCta | "Share link" / "Refer & earn". |
| `title`, `subtitle`, `preTitle`, `tag` | string | Copy. |
| `media` | Media | Card visual. |
| `color` | string | Card accent color. |
| `urlKey` | string | Product context. |
| `productInfo` | object | The product the affiliate would share. |
| `copied` | bool | Frontend-managed — show "copied!" toast state. |
| `isLoading` | bool | Frontend-managed. |
| `isFullCardClickable` | bool | Whether the whole card triggers the CTA. |
| `membershipPassNudge` | object | Cross-promo for paid membership. |

## How it appears on a PDP today

Authored ad-hoc. Middleware enriches via
`insertDynamicDataIntoProductPageWidgets.ts:322` (`AFFILIATE_CARD` case) — gates
`shouldShow` based on the user's affiliate status, sets `affiliateUser` data.

## Gotchas

- Non-affiliate users should never see this widget. Middleware enrichment is what
  hides it — don't author conditional logic in the JSON.
- The share URL is built from `urlKey` + the affiliate's unique slug.
