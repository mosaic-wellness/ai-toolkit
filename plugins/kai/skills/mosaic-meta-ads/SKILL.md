---
name: mosaic-meta-ads
description: >
  Use this skill for any Meta / Facebook / Instagram Ads question on
  Mosaic Wellness brands — campaign performance, spend, ROAS, CPM, CPC,
  CTR, frequency, audience insights, creative breakdowns, industry
  benchmarks, ad-account discovery, or "is X live right now". Triggers
  on: Meta Ads, Facebook Ads, Instagram Ads, ad spend, ROAS, campaign,
  adset, creative, audience, custom audience, lookalike, FB pixel,
  Conversions API, dataset (when in an ads context), opportunity score,
  industry benchmark, plus brand nicknames in an ads context (MM, LJ,
  AS-IN, BBW, OTC, MWL UAE, BBW UAE). This skill is **read-only** —
  if the user wants to launch, pause, or edit an ad/campaign/adset/audience,
  this skill explains why kai refuses and directs them to Ads Manager.
---

# Mosaic × Meta Ads

The Meta Ads MCP gives kai a live read of every active ad account
Mosaic Wellness has access to — Man Matters, Little Joys, Absolute
Science, Bodywise, OTC Products, MWL UAE, BBW UAE, and more. Use this
skill when someone asks a performance, audience, or "what's live"
question that needs Meta data.

This skill is **strictly read-only by design.** All `ads_create_*`,
`ads_update_*`, and `ads_activate_entity` tools are blocked at the
hook layer. Don't try to work around the block — see [§ Read-only
scope](#read-only-scope) for why.

---

## Setup — the only supported path is Claude Desktop's Custom Connector

**Meta does NOT support stdio-style MCP config via `.mcp.json`.** Meta's
OAuth flow runs through the browser and binds tokens to a Claude
account; a JSON entry can't carry it. Anyone who tries the JSON path
will hit an opaque auth failure at Meta's end.

The only working setup is Claude Desktop → Settings → Connectors → Add
Custom Connector → authorize via Meta's OAuth screen. Click-by-click
instructions live in [references/setup.md](references/setup.md). If a
teammate says "the MCP isn't working", confirm they used the connector
flow first — that's the #1 cause of "Meta MCP not connecting" tickets.

---

## Mosaic org context

Mosaic's Meta footprint spans **3 business managers** and ~14 ad
accounts across India (INR) and Middle East (AED). The authoritative
map — businesses, account IDs, currencies, which accounts have the MCP
enabled today — lives in
[references/org-context.md](references/org-context.md).

**Don't ask the user for the ad account ID.** Read it from the
reference, or call `ads_get_ad_accounts` to confirm the current state.
Always confirm the brand the user means before picking an account —
Bodywise alone has **4 separate ad accounts** across 2 businesses.

---

## Required call order

1. **Resolve the account first.** Use the brand → ad_account_id table
   in [references/org-context.md](references/org-context.md). If the
   brand is ambiguous (e.g. "Bodywise" → which of the four BBW
   accounts?), ask the user.
2. **Check `is_ads_mcp_enabled`.** A handful of Mosaic accounts are
   still rolled-out-pending at Meta's end. If the account you need is
   disabled, surface it directly: "BBW India `221577225783646` doesn't
   have the Ads MCP enabled yet — Meta is rolling it out gradually.
   You can use Ads Manager for now, or check back later." Do NOT
   silently substitute another account.
3. **For metrics**, default to the smallest field set that answers
   the question. Meta returns large rows when you ask for everything.
4. **For unfamiliar fields**, call `ads_get_field_context` before
   constructing filters — it returns the canonical name, allowed enum
   values, and which level (campaign/adset/ad/account) supports the
   field.

---

## Read-only scope

The full read-tool catalogue, plus the exhaustive list of blocked
write tools, lives in
[references/read-only-tools.md](references/read-only-tools.md). The
short version:

- **Allowed:** every `ads_get_*`, `ads_insights_*`, and
  `ads_catalog_get_*` tool — discovery, performance, audience reads,
  catalog reads, benchmarks, opportunity scores.
- **Blocked at the hook:** `ads_create_*` (ad/adset/campaign/creative/
  custom-audience/catalog/product-set), `ads_update_entity`,
  `ads_update_custom_audience_users`, `ads_activate_entity`. The
  PreToolUse hook (`plugins/kai/hooks/block-meta-writes.sh`) exits 2
  before these tools run, so kai cannot launch, pause, edit, or
  duplicate ads regardless of how the user phrases the ask.

If the user wants to write, route them out:

> "kai won't make changes to live Meta ads — too easy to spend real
> money by mistake. Use Ads Manager (or your media buyer) for any
> create/edit/activate action. I can pull the data you need to make
> the change with confidence — what would help?"

This is policy, not a missing feature. Don't apologise for it.

---

## Common asks → recipes

| User asks… | Recipe |
|---|---|
| "How's Man Matters ads spending this week?" | Look up MM account from org-context → `ads_get_ad_entities(level='campaign', account_id, fields=['name','status','spend','impressions','clicks'], date_preset='last_7_days')` |
| "ROAS for Little Joys campaigns this month" | LJ account → `ads_get_ad_entities(level='campaign', fields=['name','spend','purchase_roas'], date_preset='this_month')`. If `purchase_roas` is missing, `ads_get_field_context(['roas','purchase_roas'])` to confirm canonical name |
| "Which creatives are working best on Absolute Science?" | AS account → `ads_get_ad_entities(level='ad', fields=['name','spend','ctr','purchase_roas'], date_preset='last_14_days', sort='spend_desc', limit=10)` → then `ads_get_creatives(ad_ids=[...])` for the visual creative refs |
| "What custom audiences do we have on BBW UAE?" | BBW UAE account → `ads_get_ad_account_custom_audiences(account_id)`. Read-only — don't offer to create lookalikes |
| "Is the men's hair campaign live?" | MM account → `ads_get_ad_entities(level='campaign', filter on name contains 'hair', fields=['name','effective_status','daily_budget'])` |
| "How are we vs industry on hair-care?" | `ads_insights_industry_benchmark` for the relevant vertical + objective |
| "Anomaly check on yesterday's MM spend" | `ads_insights_anomaly_signal(account_id, date='yesterday')` |
| "Why did this campaign underdeliver?" | `ads_insights_auction_ranking_benchmarks` + `ads_get_opportunity_score` — read-only diagnostic combo |
| "Pause that ad" / "Turn off this campaign" / "Increase the budget" | **Refuse.** Quote the refusal line above and offer to pull data instead |

---

## Account discovery vs. cache

`ads_get_ad_accounts` is paginated and returns up to 50 per page. It's
also expensive to call repeatedly. The static map in
[references/org-context.md](references/org-context.md) is the fast
path for routing. Only call `ads_get_ad_accounts` when:

- The user references an account that isn't in the static map (new
  brand or new geo).
- You need the live `is_ads_mcp_enabled` flag — it changes as Meta
  rolls out access.
- The user explicitly says "list all accounts".

---

## Field resolution gotchas

- **Aliases.** Meta uses both `spend` and `amount_spent`, both `roas`
  and `purchase_roas`. `ads_get_field_context` resolves either way.
- **Level matters.** `purchase_roas` exists at campaign, adset, AND ad
  level but with different semantics. Pass the right `level` to
  `ads_get_ad_entities`.
- **Effective status ≠ status.** `status` is what the user set;
  `effective_status` is what Meta is actually running (an ad can be
  status=ACTIVE but effective_status=DISAPPROVED). For "is this live?"
  always read `effective_status`.
- **Action breakdowns.** Conversions come back nested under `actions`
  / `action_values`. To get "purchases", filter for
  `action_type='purchase'` or use the alias `purchase` via
  `ads_get_field_context`.

---

## Cross-platform reading order

Most performance questions involve more than Meta. When the user asks
"why did sales drop yesterday", check Meta in parallel with other
plugins:

- **Meta** (this skill) — paid acquisition spend, CPM, ROAS, frequency
- **mosaic-mixpanel** — on-site funnel (PDP → cart → checkout)
- **kai-mcp** — orders / refunds / CS tickets
- **mosaic-newrelic** — site latency / errors

If the funnel is clean but Meta CPM spiked or frequency capped, that's
your story. Don't conclude from Meta alone.

---

## Gotchas

- **Bodywise has 4 ad accounts across 2 businesses.** Always ask
  "which Bodywise — India MWL, India Bodywise BM, BBW UAE, or
  Be.Bodywise?" before pulling numbers.
- **MWL UAE ≠ Mosaic Wellness.** They're separate business managers
  (`4126727984040208` vs `204205877656971`). Currency is AED for UAE
  accounts, INR for India.
- **`min_daily_budget_cents` is in 1/100 of the account currency** —
  9654 INR cents = ₹96.54, not ₹9654. (Meta's "cents" naming is the
  minor unit; Indian accounts use paise.)
- **`is_ads_mcp_enabled=false` accounts can still be `is_queryable`**
  for the generic Marketing API. Don't assume one implies the other —
  always check `is_ads_mcp_enabled` before routing to MCP tools.
- **Test / personal accounts show up in the list.** `Test | Hitesh`
  (`26465542243054767`) and the unnamed `5138605722829253` are not
  production — never default to them.
- **Custom-audience reads expose PII counts but not PII content.** Safe
  to summarise audience sizes; never paste raw audience definitions
  containing emails/phones into chat.
- **Industry benchmarks have geo/vertical knobs.** Default geo for
  Mosaic IN brands is India; for MWL UAE/BBW UAE/LJ KSA, switch to the
  relevant Middle East geo.
