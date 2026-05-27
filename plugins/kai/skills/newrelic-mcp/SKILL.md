---
name: newrelic-mcp
description: >
  Use this skill for any New Relic question on Mosaic Wellness backend
  services — error logs, latency, error rate, throughput, traces, NRQL
  queries, alert configuration, or incident RCA. Triggers on: New Relic,
  NRQL, latency, error rate, throughput, alert, dashboard, 5xx
  (502/503/504), trace, request ID, `rid`, "performance regression". Use
  this when raw NRQL, alerts, or dashboard work matters; for brand-aware
  error-log summaries route through kai-mcp's engineering tools first
  (it does the brand→entity mapping).
---

# Mosaic × New Relic

For the Mosaic-specific NR token setup (where to mint a User API key,
the US/EU region note, rotation cadence), see [references/setup.md](references/setup.md). The
`tools-init` skill automates this flow with live probe validation.

---

There are **two paths** to NR from Claude inside the Mosaic stack:

1. **Kai (preferred for most asks)** — the Kai `engineering` category
   exposes `newrelic_getErrorLogs` and `newrelic_getMetrics`. You pass a
   brand code (`MM/MW/BW/LJ/AS-IN`) and Kai resolves the entity, applies
   the brand filter, and groups duplicates. No NR API key or NRQL needed
   on your side. **This is the right default.**
2. **Direct NR MCP** — for raw NRQL, alert configuration, dashboard
   management, or NR-specific tools Kai doesn't proxy. Requires the
   `newrelic-mcp` MCP server to be wired (set
   `NEW_RELIC_API_KEY` via `/kai tools-init newrelic`) and
   knowledge of NR entity names.

When in doubt, route through Kai first — fall back to direct NR MCP only
if Kai's engineering category doesn't cover the request.

---

## Brand → service entity (current knowledge)

Mosaic's NR setup uses **shared service entities** with brand discrimination
done via log content fields, not via separate NR entities per brand. So
one `Middleware-Prod` entity carries log lines for all brands; the brand
is encoded in the `brand:` / `b:` field of every log message.

| Service              | NR entity (Prod) | Notes |
|----------------------|------------------|-------|
| middleware           | `Middleware-Prod` | Confirmed — handles all brands (MM/MW/BW/LJ/AS-IN). Use Kai with `brand: "<BRAND>"` to filter. |
| static-service       | `<verify>`        | Likely `Static-Service-Prod` or `StaticService-Prod` — query Kai with the service term in `query` to confirm |
| health-service       | `<verify>`        | Likely `Health-Service-Prod` |
| oms-service          | `<verify>`        | Likely `OMS-Service-Prod` |
| affluence-service    | `<verify>`        | |
| mediconnect          | `<verify>`        | |
| nexus                | `<verify>`        | Python service |
| shrinkly             | `<verify>`        | URL shortener |
| admin-dashboard-be   | `<verify>`        | PHP CodeIgniter |
| mosaic-console       | `<verify>`        | Nx monorepo (Fastify + React) |

The `<verify>` entries are gaps — fill them in by running NR probes through
Kai for each service. The pattern observed so far is `<ServiceName>-Prod`
title-case with a hyphen separator.

Staging entities exist (`-Stg` / `-Staging` suffix) but default to `-Prod`
unless the user explicitly says staging.

---

## Standard log message format (middleware)

Errors from `Middleware-Prod` follow this shape:

```
[ERROR] Place: <fnName> token: <opaque-user-token> | brand: <BRAND>.
message :: <error message> | <JSON context>
```

The JSON context carries:

| Field   | Meaning |
|---------|---------|
| `rid`   | Request ID (the canonical trace pivot — use this to correlate across services) |
| `nrtid` | NR distributed trace ID — empty string on requests that didn't propagate the trace header |
| `b`     | Brand code (`MM`, `MW`, `BW`, `LJ`, `AS-IN`) |
| `p`     | Platform — `web`, `android`, `ios` |
| `url`   | Request path (incl. query string) |
| `method`| HTTP method |
| `uid`   | User ID, if known at request time |
| `osv`   | OS version (mobile only) |
| `appvc` | App version code (mobile only — Android-style integer) |
| `appv`  | App version string (mobile only — e.g. `12.3.0`) |

When debugging an issue:
1. Grab `rid` from the user's report (or surface it from logs).
2. Search for `rid:<value>` across `*-Prod` entities to trace the request
   through the stack.
3. If the user is mobile, note `p`/`appv` — the bug may be version-pinned.

---

## Required call order (via Kai)

For most NR asks:

1. Resolve the brand if not specified (Kai requires `brand` for both
   `newrelic_getErrorLogs` and `newrelic_getMetrics`).
2. `list_tools(category="engineering")` to confirm the current tool
   schema.
3. `use_tool("newrelic_getErrorLogs", { query, brand, days_back, ... })`
   or `use_tool("newrelic_getMetrics", { query, brand, days_back })`.
4. If the user mentions an incident with a deployment correlation, also
   call `slack_getDeploymentMessages` in parallel — Kai's engineering
   execution guide explicitly recommends this pairing.

For NRQL / dashboard / alert work, fall through to the direct NR MCP.

---

## Common asks → recipes

| Ask | Recipe |
|---|---|
| "Why are MM users seeing 504s on `/portal/user`?" | Kai `newrelic_getErrorLogs` with `brand: "MM"`, `query: "getUserDataV2 504"` → group by `rid`, correlate to deployment timeline via `slack_getDeploymentMessages` |
| "Latency on BW middleware last 24h" | Kai `newrelic_getMetrics` with `brand: "BW"`, `query: "response time"`, `days_back: 1` |
| "Is anything alerting right now?" | Direct NR MCP (Kai doesn't expose live alerts today) — needs `${NEW_RELIC_API_KEY}` set via `tools-init` |
| "Show me all error rates across services" | Kai per-brand probes are scoped; for org-wide, hit NR MCP NRQL directly: `SELECT rate(count(*), 1 minute) FROM Transaction WHERE error IS true FACET appName SINCE 1 hour ago` |

---

## Gotchas

- **Don't assume brand from context.** `Middleware-Prod` carries traffic
  from every brand — without an explicit brand filter, error counts are
  meaningless ("there are a lot of errors" — for *which brand*?).
- **`rid` is the cross-service correlation key**, not `nrtid`. The NR
  distributed trace ID (`nrtid`) is often empty on mobile traffic because
  the React Native HTTP layer doesn't propagate the W3C trace header
  consistently. Always prefer `rid` for tracing.
- **Mobile vs web in the same query** — when filtering by brand, results
  include both `p:web` and `p:android`/`p:ios`. If the symptom is platform-
  specific, add a platform filter in the `query` string or post-filter
  after Kai returns the groups.
- **Service entities use `-Prod` suffix** — `Middleware`, `Middleware-Stg`,
  `Middleware-Prod`. Default to `-Prod` unless told otherwise.
- **App version pinning** — mobile errors often correlate to a specific
  `appv`. When a regression appears for one brand only, check whether a
  rollout window matches.
- **Kai's NR is read-only by design** — for write operations (alert
  modification, dashboard edits), you must use direct NR MCP, NOT Kai.

---

## Filling the entity map

The `<verify>` rows in the entity table above should be filled in over
time as you query each service. When you confirm a real entity name from
NR output, update this skill with the confirmed value. Look for
`entity_name` in Kai's NR response metadata — that's the authoritative
mapping for the brand you queried.
