# Meta Ads MCP — Read-Only Tool Catalogue

This file is the contract between this skill and the Meta MCP. Tools
on the **allow list** are safe to call. Tools on the **block list**
are refused at the PreToolUse hook layer (`hooks/block-meta-writes.sh`)
and will return exit code 2 — even if you call them, the hook stops
execution before they reach Meta.

If a tool is missing from both lists, treat it as blocked until added
to the allow list explicitly. New Meta tools may be added by Meta at
any time; conservative defaults protect against surprise writes.

---

## ✅ Allowed (read-only)

### Account & page discovery

| Tool | Use for |
|---|---|
| `ads_get_ad_accounts` | List accounts the user can access (paginated, 50/page) |
| `ads_get_user_pages` | List FB Pages the user can advertise from |
| `ads_get_pages_for_business` | List Pages owned by a specific business |
| `ads_get_ad_account_pages` | List Pages an ad account can advertise from |

### Ad / adset / campaign / creative reads

| Tool | Use for |
|---|---|
| `ads_get_ad_entities` | The workhorse — query campaigns/adsets/ads/account with field selection, filters, date ranges, sorting |
| `ads_get_creatives` | Fetch creative objects by ID |
| `ads_get_creative_ads` | Reverse lookup — which ads use this creative |
| `ads_get_ad_images` | Image asset metadata |
| `ads_get_ad_videos` | Video asset metadata |
| `ads_get_field_context` | Resolve field aliases / get enum values / check which levels a field is valid at |

### Audience reads

| Tool | Use for |
|---|---|
| `ads_get_ad_account_custom_audiences` | List audiences on an account |
| `ads_get_custom_audience` | Audience details (size, status, rule, retention) |

### Catalog reads (commerce)

| Tool | Use for |
|---|---|
| `ads_catalog_get_catalogs` | List catalogs owned by a business |
| `ads_catalog_get_details` | Catalog metadata |
| `ads_catalog_get_diagnostics` | Catalog-level health/error counts |
| `ads_catalog_get_feed_rules` | Feed transformation rules |
| `ads_catalog_get_product_details` | Per-product details |
| `ads_catalog_get_product_feed_details` | Feed config |
| `ads_catalog_get_product_set_products` | Products in a set |
| `ads_catalog_get_product_sets` | List product sets |
| `ads_catalog_get_products` | List products |
| `ads_catalog_search_product` | Search products by keyword |

### Datasets (Pixel / CAPI)

| Tool | Use for |
|---|---|
| `ads_get_datasets` | List datasets (pixels, conversions APIs) on an account |
| `ads_get_dataset_details` | Dataset config |
| `ads_get_dataset_quality` | Event match quality / coverage |
| `ads_get_dataset_stats` | Event volume stats |

### Insights & diagnostics

| Tool | Use for |
|---|---|
| `ads_insights_advertiser_context` | Recent activity overview for the advertiser |
| `ads_insights_anomaly_signal` | Detect spend/perf anomalies on a date |
| `ads_insights_auction_ranking_benchmarks` | Quality/engagement/conversion rankings vs auction |
| `ads_insights_industry_benchmark` | Industry-vertical benchmarks |
| `ads_insights_performance_trend` | Trended perf over a window |
| `ads_get_opportunity_score` | Meta's structural-quality score for the account |
| `ads_get_errors` | Recent API/ad-delivery errors |
| `ads_get_help_article` | Read a Meta help article |
| `ads_get_field_context` | (also listed above — read-only metadata about fields) |

---

## 🚫 Blocked (write / mutating)

These are blocked by the `block-meta-writes.sh` PreToolUse hook. **Do
not attempt to call them.** If the user asks for one of these actions,
quote the refusal line from SKILL.md and offer to pull data instead.

### Creates (spend live money or alter state)

| Tool | What it does | Why blocked |
|---|---|---|
| `ads_create_campaign` | Launches a new campaign | Can immediately start spending on approval |
| `ads_create_ad_set` | Creates ad set inside a campaign | Sets daily/lifetime budget, audience, schedule |
| `ads_create_ad` | Creates an ad inside an ad set | Goes live on review |
| `ads_create_creative` | Creates a creative asset | Surface for ads — even unused creatives count against asset limits |
| `ads_create_custom_audience` | Creates a CA from rules/file | Touches PII via uploaded user lists |
| `ads_catalog_create` | Creates a product catalog | Structural — affects downstream Advantage+ shopping |
| `ads_catalog_create_product_set` | Creates a product set in a catalog | Used as targeting; mis-config can misroute spend |

### Updates / activations (alter existing state)

| Tool | What it does | Why blocked |
|---|---|---|
| `ads_update_entity` | Updates any campaign/adset/ad field (incl. status, budget, name) | Budget bumps, pauses, status changes — high blast radius |
| `ads_activate_entity` | Turns an entity ON | One call can resume a paused $100K/day campaign |
| `ads_update_custom_audience_users` | Adds/removes users from a CA | PII writes; potentially compliance-relevant |

### Other write-adjacent tools

`ads_get_help_article` — read-only despite the create-adjacent
companions. Keep it on the allow list.

---

## Why a hard block instead of "be careful"?

The skill body explains the policy in user-facing terms. Internally,
the rationale is:

1. **One call can cost money.** `ads_activate_entity` on a paused
   high-budget campaign is irreversible damage measured in hours of
   wasted spend before someone catches it.
2. **LLM context is fragile.** Users sometimes paste paragraphs that
   read as authorization ("yes go ahead launch it"). A hook layer is a
   second gate that doesn't depend on Claude correctly parsing intent.
3. **kai is used by non-engineering teams.** They're closer to the ad
   buying surface than the average Claude Code user — the cost of a
   mistake here is asymmetric with the rare benefit of "kai could have
   pushed the change directly".
4. **Ads Manager is right there.** Meta's UI exists for these
   actions, has proper review screens, and respects the
   organisation's approval flows.

Read more on the policy framing in the SKILL.md "Read-only scope"
section.

---

## When Meta adds new tools

When Meta releases a new MCP tool not listed here:

1. **Default: blocked.** The hook's allow-list pattern means an
   unknown `ads_*` tool that doesn't match an explicit write pattern
   will still run — so the conservative path is: add it to this file's
   block list AND to the hook's regex, then unblock individual reads
   after review.
2. Update both this file AND `plugins/kai/hooks/block-meta-writes.sh`
   together — the file is documentation, the hook is the enforcement.
3. Update the live snapshot in `org-context.md` if the new tool
   surfaces new account/business data.
