# URL Route Reference

Maps URLs to admin-mcp page types and tools.

---

## Section 1: URL Pattern Matching

| URL Pattern | Page Type | Admin-MCP Category | Identifier |
|---|---|---|---|
| `/` | Widgetized Home | Widget Page tools | `home` |
| `/wlanding/{identifier}` | Widgetized Landing Page | Widget Page tools | `{identifier}` from URL path |
| `/product/{urlKey}` | Widgetized PDP (+ experiment support) | PDP tools + Experiment tools | `{urlKey}.json` |
| `/dp/{urlKey}` | Widgetized PDP (flag-gated, no experiments) | PDP tools | `{urlKey}.json` |
| `/dp/{urlKey}/{productUrlKey}` | Widgetized PDP variant (flag-gated) | PDP tools | `{productUrlKey}.json` |
| `/{slug}` (catch-all) | Unknown — check both | Try Widget Page first, then PDP | `{slug}` or `{slug}.json` |
| `/shop/*` | Shop / Category | **NOT supported** | — |
| `/account/*` | Account | **NOT supported** | — |
| `/consultation/*` | Consultation | **NOT supported** | — |
| `/forms/*` | Forms | **NOT supported** | — |
| `/checkout/*` | Checkout | **NOT supported** | — |

---

## Section 2: Hostname to Brand Code

| Hostname Pattern | Brand Code | Staging URL |
|---|---|---|
| `*.manmatters.com`, `stg.manmatters.com` | `mm` | `https://stg.manmatters.com` |
| `*.manmatters.in`, `stg.manmatters.in` | `mm-in` | `https://stg.manmatters.in` |
| `*.manmatters.ae`, `stg.manmatters.ae` | `mm-ae` | `https://stg.manmatters.ae` |
| `*.manmatters.co`, `stg.manmatters.co` | `mm-co` | `https://stg.manmatters.co` |
| `*.bebodywise.com`, `stg.bebodywise.com` | `bw` | `https://stg.bebodywise.com` |
| `*.bebodywise.ae`, `stg.bebodywise.ae` | `bw-ae` | `https://stg.bebodywise.ae` |
| `*.bebodywise.co`, `stg.bebodywise.co` | `bw-co` | `https://stg.bebodywise.co` |
| `*.bebodywise.us`, `stg.bebodywise.us` | `bw-us` | `https://stg.bebodywise.us` |
| `*.ourlittlejoys.com`, `stg.ourlittlejoys.com` | `lj` | `https://stg.ourlittlejoys.com` |
| `*.ourlittlejoys.ae`, `stg.ourlittlejoys.ae` | `lj-ae` | `https://stg.ourlittlejoys.ae` |
| `*.ourlittlejoys.co`, `stg.ourlittlejoys.co` | `lj-co` | `https://stg.ourlittlejoys.co` |
| `stg-sa.ourlittlejoys.com`, `sa.ourlittlejoys.com` | `lj-sa` | `https://stg-sa.ourlittlejoys.com` |
| `*.littlejoys.us`, `stg.littlejoys.us` | `lj-us` | `https://stg.littlejoys.us` |
| `*.rootlabs.in`, `stg.rootlabs.in` | `rl-in` | `https://stg.rootlabs.in` |
| `*.rootlabs.co`, `stg.rootlabs.co` | `rl-us` | `https://stg.rootlabs.co` |
| `*.onlywhatsneeded.in`, `stg.onlywhatsneeded.in` | `wn-in` | `https://stg.onlywhatsneeded.in` |
| `*.absolutescience.in`, `stg.absolutescience.in` | `as-in` | `https://stg.absolutescience.in` |

**Notes:**
- `lj-sa` uses a non-standard staging pattern: `stg-sa.ourlittlejoys.com` (not `stg.`)
- `lj-us` uses `littlejoys.us` domain (not `ourlittlejoys.us`)
- `rl-us` uses `rootlabs.co` domain
- `fw` brand has no preview URLs configured

---

## Section 3: Resolution Algorithm

Given a URL like `https://stg.manmatters.com/product/minoxidil-5-hair-growth`:

1. **Extract hostname:** `stg.manmatters.com`
2. **Match hostname to brand code:** `stg.manmatters.com` → `mm`
3. **Extract path:** `/product/minoxidil-5-hair-growth`
4. **Match path to pattern:** `/product/{urlKey}` → PDP type
5. **Derive identifier:** `urlKey` = `minoxidil-5-hair-growth` → `page_name` = `minoxidil-5-hair-growth.json`
6. **Select tool:** PDP type → use `get_pdp_config(page_name: "minoxidil-5-hair-growth.json", brand: "mm")`

### PDP route note (`/product/` vs `/dp/`):
Both routes render the same widgetized PDP when `NEXT_PUBLIC_ENABLE_NEW_PDP` is enabled. The difference:
- `/product/{urlKey}` — supports **experiment variants** (reads `expId` from cookies, passes to SSR)
- `/dp/{urlKey}` — widgetized but **no experiment support**

From admin-mcp's perspective, both use the same PDP tools (`get_pdp_config`, `update_pdp_section`, etc.). Use experiment tools (`get_experiment_config`, `create_pdp_experiment`) only when working with `/product/` URLs.

### Catch-all `/{slug}` resolution:
When the path doesn't match a known pattern (like `/some-landing-page`):

1. Try widget page first:
   ```
   get_widget_page_config(identifier: "some-landing-page", brand: "mm")
   ```
2. If 404, try PDP:
   ```
   get_pdp_config(page_name: "some-landing-page.json", brand: "mm")
   ```
3. If both fail, the page is not managed by admin-mcp.

### Production vs staging URLs:
- Staging URLs use `stg.` prefix (or `stg-sa.` for lj-sa)
- Production URLs use the bare domain (e.g., `manmatters.com`)
- Both resolve to the same brand code — the difference is which environment to target

---

## Section 4: Pages NOT Supported by Admin-MCP

These page types are not managed through admin-mcp and cannot be edited with its tools:

| Path Pattern | Why Not Supported |
|---|---|
| `/shop/*` | Category/shop pages are powered by Magento and static-service, not S3 JSON configs |
| `/account/*` | Account pages are rendered by frontend components with API data, no S3 config |
| `/consultation/*` | Consultation flow is managed by health-service, not page configs |
| `/forms/*` | Forms are managed by the forms service |
| `/checkout/*` | Checkout flow is managed by middleware + OMS, not page configs |
| `/blog/*` | Blog content is managed separately |

If a user asks to update one of these pages, explain that admin-mcp only manages **widgetized pages** (home, landing pages, PDPs) that are backed by S3 JSON configurations.
