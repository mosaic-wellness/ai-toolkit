# Brand and Bucket Reference

18 brands with their S3 bucket names, staging URLs, and configuration.

All data verified against `src/utils/bucket-resolver.ts`.

---

## Brand Bucket Map

| Brand Code | Brand Name | Bucket Prefix | Products Bucket (staging) | Pagedata Bucket (staging) |
|---|---|---|---|---|
| `mm` | Man Matters | `manmatters` | `manmatters-products-staging` | `manmatters-stage-json` * |
| `mm-in` | Man Matters IN | `manmatters-in` | `manmatters-in-products-staging` | `manmatters-in-pagedata-staging` |
| `mm-ae` | Man Matters AE | `manmatters-ae` | `manmatters-ae-products-staging` | `manmatters-ae-pagedata-staging` |
| `mm-co` | Man Matters CO | `manmatters-co` | `manmatters-co-products-staging` | `manmatters-co-pagedata-staging` |
| `bw` | Be Bodywise | `bebodywise` | `bebodywise-products-staging` | `bebodywise-pagedata-staging` |
| `bw-ae` | Be Bodywise AE | `bebodywise-ae` | `bebodywise-ae-products-staging` | `bebodywise-ae-pagedata-staging` |
| `bw-co` | Be Bodywise CO | `bebodywise-co` | `bebodywise-co-products-staging` | `bebodywise-co-pagedata-staging` |
| `bw-us` | Be Bodywise US | `bebodywise-us` | `bebodywise-us-products-staging` | `bebodywise-us-pagedata-staging` |
| `lj` | Little Joys | `littlejoys` | `littlejoys-products-staging` | `littlejoys-pagedata-staging` |
| `lj-ae` | Little Joys AE | `littlejoys-ae` | `littlejoys-ae-products-staging` | `littlejoys-ae-pagedata-staging` |
| `lj-co` | Little Joys CO | `littlejoys-co` | `littlejoys-products-staging` * | `littlejoys-co-pagedata-staging` |
| `lj-sa` | Little Joys SA | `littlejoys-sa` | `littlejoys-sa-products-staging` | `littlejoys-sa-pagedata-staging` |
| `lj-us` | Little Joys US | `littlejoys-us` | `littlejoys-us-products-staging` | `littlejoys-us-pagedata-staging` |
| `rl-in` | RootLabs IN | `rootlabs-in` | `rootlabs-in-products-staging` | `rootlabs-in-pagedata-staging` |
| `rl-us` | RootLabs US | `rootlabs-us` | `rootlabs-us-products-staging` | `rootlabs-us-pagedata-staging` |
| `wn-in` | What's Needed IN | `whatsneeded-in` | `whatsneeded-in-products-staging` | `whatsneeded-in-pagedata-staging` |
| `as-in` | Absolute Science IN | `absolutescience-in` | `absolutescience-in-products-staging` | `absolutescience-in-pagedata-staging` |
| `fw` | FitWise | `fitwise` | — (pagedata only) | `fitwise-pagedata-staging` |

Items marked with `*` are **legacy overrides** — see below.

---

## Legacy Bucket Overrides

Some brands have non-standard bucket names that don't follow the `{prefix}-{type}-{env}` pattern:

| Standard Name (computed) | Actual Bucket Name | Notes |
|---|---|---|
| `manmatters-pagedata-staging` | `manmatters-stage-json` | MM pagedata uses legacy naming |
| `manmatters-pagedata-prod` | `manmatters-prod-json` | MM pagedata uses legacy naming |
| `littlejoys-co-products-staging` | `littlejoys-products-staging` | LJ-CO shares LJ's products bucket |
| `littlejoys-co-products-prod` | `littlejoys-products-prod` | LJ-CO shares LJ's products bucket |

---

## Staging Preview URLs

| Brand Code | Staging URL | Production URL |
|---|---|---|
| `mm` | `https://stg.manmatters.com` | `https://manmatters.com` |
| `mm-in` | `https://stg.manmatters.in` | `https://manmatters.in` |
| `mm-ae` | `https://stg.manmatters.ae` | `https://manmatters.ae` |
| `mm-co` | `https://stg.manmatters.co` | `https://manmatters.co` |
| `bw` | `https://stg.bebodywise.com` | `https://bebodywise.com` |
| `bw-ae` | `https://stg.bebodywise.ae` | `https://bebodywise.ae` |
| `bw-co` | `https://stg.bebodywise.co` | `https://bebodywise.co` |
| `bw-us` | `https://stg.bebodywise.us` | `https://bebodywise.us` |
| `lj` | `https://stg.ourlittlejoys.com` | `https://ourlittlejoys.com` |
| `lj-ae` | `https://stg.ourlittlejoys.ae` | `https://ourlittlejoys.ae` |
| `lj-co` | `https://stg.ourlittlejoys.co` | `https://ourlittlejoys.co` |
| `lj-sa` | `https://stg-sa.ourlittlejoys.com` | `https://sa.ourlittlejoys.com` |
| `lj-us` | `https://stg.littlejoys.us` | `https://littlejoys.us` |
| `rl-in` | `https://stg.rootlabs.in` | `https://rootlabs.in` |
| `rl-us` | `https://stg.rootlabs.co` | `https://rootlabs.co` |
| `wn-in` | `https://stg.onlywhatsneeded.in` | `https://onlywhatsneeded.in` |
| `as-in` | `https://stg.absolutescience.in` | `https://absolutescience.in` |
| `fw` | — (no preview URL) | — |

---

## S3 Key Prefixes

| Content Type | S3 Key Pattern | Example |
|---|---|---|
| PDP (English) | `products/rcl/{page_name}` | `products/rcl/minoxidil-5.json` |
| PDP (Hindi) | `products/rcl/hi/{page_name}` | `products/rcl/hi/minoxidil-5.json` |
| Widget Page (new user) | `widget_pages/{identifier}.json` | `widget_pages/home.json` |
| Widget Page (repeat user) | `widget_pages/{identifier}-repeat.json` | `widget_pages/home-repeat.json` |
| Brand PDP Config | `widgetised-pdp-config.json` | `widgetised-pdp-config.json` (root) |
| Experiment Config | `experiment.json` | `experiment.json` (root) |

---

## Pagedata-Only Brands

The `fw` brand only has a pagedata bucket (no products or static buckets). Attempting to resolve a products bucket for `fw` will throw an error.

---

## Preview URL Format

For widget pages:
```
{staging_url}/wlanding/{identifier}
```
Example: `https://stg.manmatters.com/wlanding/category-hair`

For PDPs:
```
{staging_url}/product/{urlKey}
```
Example: `https://stg.manmatters.com/product/minoxidil-5`

Note: `urlKey` is the `page_name` without the `.json` extension.
