# Experiment Lifecycle Guide

How PDP experiments work end-to-end: creation, traffic assignment, user resolution, and promotion.

---

## Overview

Experiments let you A/B test different PDP configurations by splitting traffic between a **control** (original) and one or more **variants**. The system uses a persistent random number per user (1-100) to deterministically assign users to variants.

```
Create variant → Set traffic split → Users get assigned → Measure → Promote or remove
```

**All experiment writes via admin-mcp go to staging only.** Production publishing requires the admin dashboard UI.

---

## Experiment Storage in S3

| File | Bucket | Path | Purpose |
|---|---|---|---|
| Control PDP | `{brand}-products-{env}` | `products/rcl/{slug}.json` | Original PDP config |
| Experiment variant | `{brand}-products-{env}` | `products/rcl/{slug}-exp-{name}.json` | Modified PDP config |
| Traffic assignment | `{brand}-pagedata-{env}` | `experiment.json` | Maps users to variants |

### Experiment filename convention
```
{control_slug}-exp-{experiment_name}.json

Example:
  Control:    minoxidil-5-hair-growth.json
  Variant:    minoxidil-5-hair-growth-exp-hero-banner-v2.json
```

The `-exp-` infix is critical — middleware uses it to identify experiment variants.

---

## experiment.json Structure

The traffic assignment config lives at the root of each brand's pagedata bucket:

```json
{
  "product": {
    "minoxidil-5-hair-growth": {
      "control": {
        "percent": 70,
        "id": "minoxidil-5-hair-growth.json",
        "widgetised": true
      },
      "hero_banner_v2": {
        "percent": 30,
        "id": "minoxidil-5-hair-growth-exp-hero-banner-v2.json",
        "widgetised": true
      }
    }
  },
  "landing": { ... },
  "category": { ... },
  "home": { ... }
}
```

**Rules:**
- Root keys are experiment types: `product`, `landing`, `category`, `home`
- Each type contains identifiers (product URL keys or page slugs)
- Each identifier contains named variants with `percent` and `id`
- **Percentages must sum to exactly 100** for each identifier

---

## How Users Get Assigned to Variants

### Step 1: Get or generate user's random number
```
Check mwexp header → Check mwexp cookie → Generate random 1-100
```
The `mwexp` cookie persists for **1 day**.

### Step 2: Fetch experiment.json from S3
Cached in Redis for **1 hour**. Traffic split changes take up to 1 hour to propagate.

### Step 3: Cumulative percentage matching
```
Variants: control (70%), hero_v2 (30%)
User's random number:  1-70  → control
User's random number: 71-100 → hero_v2
```

### Step 4: Set cookies and route request
- `mwexp` cookie: User's persistent random number (1-100), 1-day TTL
- `mwexpid` cookie: Selected variant filename, 1-day TTL

---

## Full Experiment Workflow via Admin-MCP

### Phase 1: Create
```
get_pdp_config(page_name: "minoxidil-5.json", brand: "mm")

create_pdp_experiment(
  control_page_name: "minoxidil-5.json",
  experiment_name: "hero-banner-v2",
  brand: "mm",
  modifications: [
    { "json_path": "widgetsData.displayOrder.default", "value": ["new-hero", "summary", ...] },
    { "json_path": "widgetsData.widgetIDMapping.new-hero", "value": { "type": "BANNER", ... } }
  ]
)
```

### Phase 2: Refine
```
update_experiment_config(
  experiment_page_name: "minoxidil-5-exp-hero-banner-v2.json",
  mode: "section",
  json_path: "widgetsData.widgetIDMapping.new-hero.data.title",
  value: "Updated Hero Title",
  brand: "mm"
)

compare_experiment_to_control(
  experiment_page_name: "minoxidil-5-exp-hero-banner-v2.json",
  control_page_name: "minoxidil-5.json",
  brand: "mm"
)
```

### Phase 3: Activate
```
update_experiment_assignment(
  type: "product",
  identifier: "minoxidil-5",
  brand: "mm",
  variants: {
    "control": { "percent": 70, "id": "minoxidil-5.json" },
    "hero_banner_v2": { "percent": 30, "id": "minoxidil-5-exp-hero-banner-v2.json" }
  }
)
```

### Phase 4: Monitor
```
get_experiment_assignment_config(brand: "mm", type_filter: "product")
list_pdp_experiments(control_page_name: "minoxidil-5.json", brand: "mm")
```

### Phase 5a: Promote Winner
```
promote_experiment_to_control(
  experiment_page_name: "minoxidil-5-exp-hero-banner-v2.json",
  control_page_name: "minoxidil-5.json",
  brand: "mm",
  archive_control: true,
  release_notes: "Promoting hero-banner-v2 after 2-week test, +12% conversion"
)

remove_experiment_assignment(type: "product", identifier: "minoxidil-5", brand: "mm")
```

### Phase 5b: Remove Loser
```
remove_experiment_assignment(type: "product", identifier: "minoxidil-5", brand: "mm")
```

---

## Important Notes

1. **Propagation delay** — experiment.json is cached in Redis for 1 hour.
2. **Cookie persistence** — Users stay in their assigned variant for 1 day.
3. **Experiment + displayOrder interaction** — An experiment variant can have its own `displayOrder` (highest priority in the 3-tier system).
4. **Staging only** — `publish_experiment` is intentionally disabled.
5. **Experiment name format** — Must be kebab-case: `/^[a-z0-9]+(-[a-z0-9]+)*$/`.
6. **Archive on promote** — When `archive_control: true`, the current control is saved as `{slug}-pre-exp-{YYYYMMDD}.json`.
