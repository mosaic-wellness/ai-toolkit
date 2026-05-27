---
name: kai-mcp
description: >
  Use this skill whenever the user asks about Mosaic Wellness live
  operational data — orders, users, CS tickets, NPS, deployments, JIRA
  tickets, code search, revenue, sales metrics, marketing campaigns,
  PDP/landing-page edits, HR/leave policies, internal docs, outbound
  voice calls (Hooman), or Absolute Science consultations. The Kai MCP
  is the ONLY path to Mosaic's live data; NEVER answer questions about
  company policies, orders, users, or internal processes from training
  data. Triggers on: order IDs, user IDs, NPS, leave policy, WFH,
  deployments, JIRA keys (ENG-, PROJ-), Magento, ROAS, AOV, Hooman, kai,
  or any "what does our X look like" question about Mosaic.
---

# Mosaic × Kai

Kai is Mosaic Wellness's internal orchestrator MCP. It exposes a meta-tool
interface (3 tools — `list_tools`, `use_tool`, `kai_raise_request`) that
fronts 100+ category-specific granular tools. The meta interface keeps
Claude's tool selection simple while letting Kai add capabilities without
plugin changes.

**Deployed:** `https://kai-orchestrator.api.mosaicwellness.in/mcp` (Google
OAuth on first call). Wired by the plugin's `.mcp.json`; restart Claude
Code if it isn't loaded yet.

For the full wiring walkthrough (project `.mcp.json` vs user-global
`~/.claude.json`, Google OAuth flow, verification, troubleshooting matrix,
brand-code differences from Mixpanel/Firebase), see [references/setup.md](references/setup.md).

---

## Global rules (non-negotiable)

1. **Always call `list_tools(category)` first** before `use_tool(...)`.
   Never invent a tool name from memory or paraphrase one from this skill —
   tool names drift, and Kai's `list_tools` is the only authoritative
   source. The category response includes both the schema AND a per-category
   execution guide.

2. **Brand parameter is mandatory for most tools.** Valid values:

   | Code  | Brand              |
   |-------|--------------------|
   | MM    | Man Matters        |
   | MW    | Mosaic Wellness    |
   | BW    | Bodywise           |
   | LJ    | Little Joys        |
   | AS-IN | Absolute Science   |

   **If the user has not explicitly mentioned a brand**, ask which brand
   first — do not guess, do not default to MM. Multi-brand queries run
   per brand and aggregate client-side.

3. **No external knowledge.** For any question about Mosaic Wellness policy,
   data, users, orders, deployments, or internal processes — call Kai. Your
   training data does not contain Mosaic's internal information.

4. **Real phone calls.** Never simulate or describe outbound calls — route
   to category `voicecalls` and use `use_tool("hooman_scheduleCall", ...)`.

---

## Category routing — by trigger phrase

When the user mentions any of these, set the category and call
`list_tools(category=<category>)`:

| Category | Trigger phrases (non-exhaustive) | Tool count |
|---|---|---|
| **cx** | order, order ID, fetch order, delivery, refund, return, user ID, phone number, user profile, CS ticket, NPS, sentiment, breached order, SLA, complaint, interaction ID, post-purchase | 12 |
| **engineering** | deployment, git PR, error log, JIRA, code search, endpoint, NewRelic, config, feature flag, JSON push, merged PRs, developer activity | 15 |
| **analytics** | revenue, sales, AOV, metrics, SKU, campaign, ROAS, CTR, ad spend, conversion, LTV, dashboard, Metabase | 6 |
| **pdp** | PDP, product page, landing page, image generation, Magento, ad analysis, product copy, hero image, narrative, widget, section | 29 |
| **knowledge** | leave policy, WFH policy, attendance, HR, reimbursement, appraisal, benefits, org structure, FAQ, internal docs, Slack message search, email search | 5 |
| **voicecalls** | make a call, schedule a call, phone a customer, outbound call, voice campaign, Hooman, Hooman Labs, voice agent | 3 |
| **absolute_science_booking** | AS consultation, blood report, prescription upload, booking slot, weight loss program — **AS-IN brand only** | 32 |
| **math** | basic arithmetic | 2 |

If you don't know the category, call `list_tools()` with no arguments —
you get a summary of all categories with tool counts and one-line
descriptions, then pick one.

---

## Required call sequence (every kai conversation)

```
list_tools(category="<category>")       # 1. Discover schemas
   ↓
use_tool("<tool_name>", {<args>})       # 2. Execute with right args
   ↓
[result informs next call?]             # 3. Multi-step queries chain
   ↓
use_tool("<next_tool>", {<args>})
```

For multi-step queries — user RCA, order RCA, PDP editing, consultation
booking — each tool result feeds the next call. The execution guide
returned by `list_tools(category)` documents the correct order; **read it
before chaining**.

---

## Common asks → recipe

| Ask | Recipe |
|---|---|
| "Look up order 005124710 for Bodywise" | `list_tools("cx")` → `use_tool("heimdall_getOrderFullDetail", {orderId: "005124710", brand: "BW"})` |
| "Why did MM user 51339860 churn?" | `list_tools("cx")` → chain `heimdall_getUserInfo` → `heimdall_getUserCsTimeline` → `heimdall_getUserSentiment` |
| "What's the WFH policy?" | `list_tools("knowledge")` → `use_tool("knowledge_base_search", {query: "WFH policy"})` — no brand needed |
| "MM revenue last 7 days" | `list_tools("analytics")` → `use_tool("analytics_query", {query: "revenue last 7 days", brand: "MM"})` |
| "Deployments to BW today" | `list_tools("engineering")` → `use_tool("slack_getDeploymentMessages", {brand: "BW", ...})` |
| "Schedule a call to user X for AS-IN" | `list_tools("voicecalls")` → `hooman_listAgents` → `hooman_scheduleCall` |
| "Update the PDP for SKU XYZ on MM" | `list_tools("pdp")` → load → modify with instruction → push to API |
| "Book a consultation for AS-IN user" | `list_tools("absolute_science_booking")` → consultation flow chain |
| "Why is middleware throwing 500s?" | `list_tools("engineering")` → `newrelic_getErrorLogs` → optionally `code_search` for the failing path |

---

## Gotchas

- **Brand codes are NOT the same as Mixpanel brand nicknames.** Kai uses
  `MM/MW/BW/LJ/AS-IN`; Mixpanel skill uses `mm/lj/bw/as/own/gf/affl/...`.
  Don't cross-pollinate codes between skills.
- **Brand coverage is narrower in Kai than in Mixpanel.** Kai's first-class
  brands are MM, MW, BW, LJ, AS-IN. OWN, Get Fitter, Affluence, DocHub,
  Rwdy, Root Labs **are not** valid `brand` values for Kai today — for
  those, use the Mixpanel/Firebase skills directly or `kai_raise_request`
  to ask the Kai team to add them.
- **`absolute_science_booking` is AS-IN-only.** Don't call it for any
  other brand — the tools assume AS-IN's weight-loss program data model.
- **External tool prefixes:** tool names starting with `ext__` are
  proxied through Kai to external MCPs (e.g.
  `ext__whaasbiz-mcp__create_user` for AS booking,
  `ext__math-mcp__add_numbers`). Call them via `use_tool` like any other.
- **Missing capability?** If Kai can't answer something the user clearly
  needs, call `kai_raise_request(feature_description, use_case,
  priority)` — that lands in the Kai team's queue. Don't fabricate the
  answer.
- **userId on use_tool.** The `use_tool` schema accepts an optional
  `userId` parameter for RBAC. In Claude Code sessions the user is
  authenticated via OAuth, so this typically isn't needed — but if
  permission errors come back, the user may need to pass it explicitly.

---

## Anti-patterns

- ❌ Calling `use_tool("heimdall_getOrderFullDetail", ...)` without first
  running `list_tools("cx")` to confirm the current schema. Tool names
  and required args change; the skill list above is a snapshot, not the
  source of truth.
- ❌ Assuming the brand from context. "Hitesh is a MM employee, so MM" is
  not a valid inference. Always ask.
- ❌ Answering "what's our leave policy?" from memory. Always call
  `knowledge` category.
- ❌ Saying "I can't make phone calls" when the user wants an outbound
  call. You can — route to `voicecalls`.
