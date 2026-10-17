---
name: admin-essentials
description: >
  Core knowledge for using admin-mcp tools: brand codes, URL-to-identifier resolution,
  identifier format rules, staging-only guardrail, and critical gotchas. Auto-activates
  whenever admin-mcp MCP tools are being used or when the user asks about page configs,
  PDPs, widget pages, experiments, or brand settings for Mosaic Wellness brands.
---

# Admin MCP Essentials

You are working with the **admin-mcp** MCP server — a staging-only tool for managing Mosaic Wellness page configurations (PDPs, widget pages, experiments, brand settings) stored as JSON in S3.

## Staging-Only Guardrail

**All writes via admin-mcp go to staging.** Production publishing requires the admin dashboard UI at Zeus (`https://stg-zeus.mosaicwellness.in`). Never tell users they can publish to production via MCP.

## Brand Code Resolution

| Hostname Pattern | Brand Code |
|---|---|
| `*.manmatters.com` | `mm` |
| `*.manmatters.in` | `mm-in` |
| `*.manmatters.ae` | `mm-ae` |
| `*.manmatters.co` | `mm-co` |
| `*.bebodywise.com` | `bw` |
| `*.bebodywise.ae` | `bw-ae` |
| `*.bebodywise.co` | `bw-co` |
| `*.bebodywise.us` | `bw-us` |
| `*.ourlittlejoys.com` | `lj` |
| `*.ourlittlejoys.ae` | `lj-ae` |
| `*.ourlittlejoys.co` | `lj-co` |
| `stg-sa.ourlittlejoys.com` | `lj-sa` |
| `*.littlejoys.us` | `lj-us` |
| `*.rootlabs.in` | `rl-in` |
| `*.rootlabshealth.com` | `rl-us` |
| `*.onlywhatsneeded.in` | `wn-in` |
| `*.absolutescience.in` | `as-in` |

**Gotchas:** `lj-sa` uses `stg-sa.` prefix (not `stg.`). `lj-us` uses `littlejoys.us`. `rl-us` uses `rootlabshealth.com`. `fw` is pagedata-only (no products bucket).

## URL → Page Type → Tool Mapping

| URL Pattern | Page Type | Identifier | Tools |
|---|---|---|---|
| `/` | Widget Home | `home` | `get_widget_page_config`, `update_widget_page_section` |
| `/wlanding/{id}` | Widget Landing | `{id}` | `get_widget_page_config`, `update_widget_page_section` |
| `/product/{urlKey}` | PDP (+ experiments) | `{urlKey}.json` | `get_pdp_config`, `update_pdp_section` |
| `/dp/{urlKey}` | PDP (no experiments) | `{urlKey}.json` | `get_pdp_config`, `update_pdp_section` |
| `/{slug}` (catch-all) | Unknown | Try both | Widget page first (`{slug}`), then PDP (`{slug}.json`) |

**Not supported:** `/shop/*`, `/account/*`, `/consultation/*`, `/forms/*`, `/checkout/*`, `/blog/*`

## Identifier Format Rules

- **PDP `page_name`** includes `.json`: `minoxidil-5.json`
- **Widget `identifier`** does NOT include `.json`: `home`, `category-hair`
- **New identifiers** must be kebab-case: `/^[a-z0-9]+(-[a-z0-9]+)*$/`
- **Experiment variants** follow: `{slug}-exp-{experiment-name}.json`

## Defaults

- **Brand:** `mm` (Man Matters) if not specified
- **Environment:** `staging` if not specified
- **Language:** `en` if not specified

## Critical Gotchas

1. **Lock tokens expire after 15 minutes** — re-acquire with `acquire_page_lock` if expired
2. **Rate limit:** 60 writes/min sustained, 10 per 5 sec burst
3. **Experiment assignment `variants`** percentages must sum to exactly 100
4. **`upload_pdp_image`** param is `file_url`, not `image_url`
5. **`promote_experiment_to_control`** requires `release_notes` (mandatory, min 10 chars)
6. **Override is full replacement** — PDP-level displayOrder fully replaces brand default (no merging)
7. **Don't set dynamic fields** — pricing, stock, ratings are injected by middleware at runtime
8. **Add-to-cart uses URL key, NOT SKU** — When building checkout CTAs with `add-to-cart`, always use the product's `url_key` (e.g., `glp-1-eligibility-test`), never the SKU (e.g., `abc-3`). The storefront checkout page resolves products by URL key. Format: `/checkout-v2?add-to-cart={url_key}`. Use `search_products` or `get_product_info` to find the correct `url_key` for a product.

## Bulk Operations

When a task involves **4+ pages**, avoid fetching full configs into context. Use lightweight alternatives:

- **Summary tools** (`get_widget_page_summary`, `get_pdp_summary`): Return ~500 bytes per page (widget IDs, types, titles, display order) instead of ~30KB. Use for auditing, comparing structures, or deciding which pages need edits.
- **Bulk-fetch script** (`${CLAUDE_PLUGIN_ROOT}/scripts/bulk-fetch.sh`): Downloads full configs to temp files via direct HTTP. Responses never enter context. Use when you need full data for processing.

Read `${CLAUDE_PLUGIN_ROOT}/skills/bulk-operations/SKILL.md` for the full decision tree and usage patterns.

## Post-Write Verification

After ANY write, verify on staging:
1. Get preview URL (`preview_widget_page_url` or `preview_pdp_url`)
2. Append `?theme={random_value}` to bypass CDN cache
3. Check both mobile and desktop viewports
4. Retry with different `theme` value if changes don't appear (up to 2 retries)

## Reference Docs

For deeper knowledge, read files from `${CLAUDE_PLUGIN_ROOT}/references/admin/`:
- `workflow-patterns.md` — Step-by-step multi-tool workflows
- `route-reference.md` — Complete URL resolution algorithm
- `brand-bucket-reference.md` — 18 brands with S3 buckets and preview URLs
- `widget-type-catalog.md` — 122 widget types + 41 action types
- `display-order-guide.md` — 3-tier displayOrder override system
- `experiment-lifecycle.md` — Full A/B test lifecycle
- `pdp-transformation-pipeline.md` — 7-step middleware enrichment
- `tool-reference.md` — All 38 tools with "when to use" guidance
- `error-handling.md` — Common errors and resolutions
