# Mosaic × Meta — Org Context

This file is the authoritative map of Mosaic's Meta footprint as seen
through the Ads MCP. **Pulled live from `ads_get_ad_accounts` on
2026-05-27.** Re-run that tool if any account flag below looks stale.

---

## Business managers (3)

| Business name | Business ID | Geo | Notes |
|---|---|---|---|
| **Mosaic Wellness** | `204205877656971` | India (INR) | Main BM. Houses MM, LJ, AS, BBW IN, OTC, Little Gem, second Be.Bodywise. |
| **Bodywise** | `920191315158839` | India (INR) | Sibling BM owning a second Be Bodywise account. |
| **MWL UAE** | `4126727984040208` | UAE / KSA (AED) | Middle East BM — MWL UAE, LJ UAE, LJ KSA, BBW UAE. |

When `ads_get_ad_accounts` returns an empty `business_id`, the account
has no owning business (the test/personal account behaves this way).

---

## Brand → ad account routing table

The Ads MCP works on **one ad_account_id at a time.** Always pass the
account ID explicitly — don't rely on Meta to "guess" from the
business.

### India (INR, Mosaic Wellness BM unless noted)

| Brand | Ad account ID | MCP enabled? | Payment? | Notes |
|---|---|---|---|---|
| **Man Matters** | `184588589658083` | ✅ | ✅ | Default for any unqualified "MM ads" question |
| **Little Joys** | `1128749221260330` | ✅ | ✅ | Default for any unqualified "LJ ads" question |
| **Absolute Science** | `1187604529852792` | ✅ | ✅ | "AS" / "AS-IN" |
| **OTC Products** | `306574193752207` | ✅ | ✅ | OTC catalogue across brands |
| **Be Bodywise** (Mosaic BM) | `221577225783646` | ❌ rollout-pending | ✅ | One of FOUR BBW accounts — ask the user |
| **Be.Bodywise** (Mosaic BM, alt) | `556189745496035` | ❌ rollout-pending | ✅ | Second BBW under Mosaic BM |
| **Be Bodywise** (Bodywise BM) | `286892339082195` | ❌ rollout-pending | ✅ but `UNSETTLED` | Bodywise-BM owned. Surface payment status if user picks this. |
| **Little Gem** | `267786185112345` | ❌ rollout-pending | ✅ | Premium baby skincare line |

### Middle East (AED, MWL UAE BM)

| Brand | Ad account ID | MCP enabled? | Payment? | Notes |
|---|---|---|---|---|
| **MWL UAE** (Man Matters UAE) | `722356102562577` | ✅ | ✅ | Currency: AED |
| **BBW UAE** | `3386561654823670` | ✅ | ✅ | Currency: AED |
| **Little Joys UAE** (MWL) | `217921814685483` | ❌ rollout-pending | ✅ | |
| **Little Joys KSA** | `1944083336109951` | ❌ rollout-pending | ✅ | Saudi Arabia (still in AED on the account) |

### Not for production use

| Account name | Ad account ID | Why excluded |
|---|---|---|
| `Test \| Hitesh` | `26465542243054767` | Personal test account — no payment method, no production data |
| (unnamed, no BM) | `5138605722829253` | Orphan account; no business; no MCP access |

---

## Currency & budget gotcha

`min_daily_budget_cents` in the API response is in the **minor unit of
the account currency**:

- India (INR) accounts: `9654` → ₹96.54 (94.54 paise = 0.0001 INR is
  Meta's internal precision; the response rounds to 2 decimals)
- UAE/KSA (AED) accounts: `369` → د.إ3.69

Never quote the raw `_cents` number to the user.

---

## `is_ads_mcp_enabled` is a live flag

Meta is rolling out MCP access gradually. The truth table above is a
snapshot from 2026-05-27 — re-pull via `ads_get_ad_accounts` if you
want today's truth. When an account is disabled:

- `ads_get_ad_entities` will fail with `not_queryable_reason`
- `ads_get_creatives`, `ads_get_ad_account_custom_audiences`, etc. may
  return empty or error

If the user asks about a disabled account, surface it directly. Don't
silently fall back to a different account just because it's enabled —
that produces wrong numbers.

---

## Brand-code translations (Meta ↔ rest of kai)

The Mosaic ecosystem uses brand codes inconsistently. Use this when
the user types one code and the Meta data uses another.

| Brand | Meta account name | Mixpanel BC | Kai brand code | Firebase project |
|---|---|---|---|---|
| Man Matters (IN) | "Man Matters" | `mm` | `MM` | `man-matters-android` |
| Little Joys (IN) | "Little Joys" | `lj` | `LJ` | `our-little-joys` |
| Absolute Science (IN) | "Absolute Science" | `as` | `AS-IN` | `absolutescience-43002` |
| Be Bodywise (IN) | "Be Bodywise" / "Be.Bodywise" | `bw` | `BW` | `be-bodywise` |
| MWL UAE | "MWL UAE" | (—) | `MM-UAE` | (—) |
| BBW UAE | "BBW UAE" | `bw` UAE | `BW-UAE` | (—) |
| Little Joys UAE | "Little Joys UAE MWL" | `lj` UAE | `LJ-UAE` | `middle-east-a7a72` |
| Little Joys KSA | "Little Joys - KSA" | (—) | `LJ-KSA` | (—) |

Cross-reference with `plugins/kai/skills/mosaic-mixpanel/SKILL.md` (the
"3 codes, same brand" table) and `mosaic-firebase/SKILL.md` (brand →
Firebase project map) when stitching cross-platform answers.

---

## Refreshing this file

If account access changes — Mosaic adds a brand, MWL UAE adds KSA, or
Meta flips an account to MCP-enabled — re-run:

```
ads_get_ad_accounts (paginate via cursor until next_cursor is null)
```

Compare to the tables above and update. The file is a static cache;
the live call is the source of truth.
