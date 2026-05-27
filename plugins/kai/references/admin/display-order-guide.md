# Display Order Guide

How to control which widgets appear on PDPs, in what order, using the 3-tier displayOrder system.

---

## The Golden Rule

**To "remove" a widget from a PDP, remove its ID from `displayOrder` — do NOT delete it from `widgetIDMapping`.**

Widgets not listed in `displayOrder` are simply not rendered, even if their definitions exist in `widgetIDMapping`. This makes changes safe and reversible.

---

## 3-Tier Override System

DisplayOrder uses a hierarchy where higher tiers override lower ones:

```
Tier 1: Brand-level default (widgetised-pdp-config.json)     ← lowest priority
Tier 2: Per-PDP override (individual PDP JSON)                ← medium priority
Tier 3: Experiment override (experiment variant JSON)          ← highest priority
```

**Resolution rule:** If a PDP has its own `displayOrder`, it **completely replaces** the brand default. There is no merging — it's a full override.

---

## DisplayOrder Structure

Each tier uses the same structure:

```json
{
  "widgetsData": {
    "displayOrder": {
      "default": ["widget-id-1", "widget-id-2", "widget-id-3"],
      "platformOverrides": {
        "mobile-web": ["widget-id-1", "widget-id-2"],
        "desktop-web": {
          "desktop-web-top-left": ["widget-id-1"],
          "desktop-web-top-right": ["widget-id-2"],
          "desktop-web-bottom": ["widget-id-3", "widget-id-4"]
        }
      },
      "productDiscontinued": {
        "default": ["info-widget", "customer-reviews"],
        "platformOverrides": {
          "mobile-web": ["info-widget"]
        }
      }
    },
    "widgetIDMapping": {
      "widget-id-1": { "type": "PRODUCT_SUMMARY", "data": {}, "config": {} },
      "widget-id-2": { "type": "BANNER", "data": {}, "config": {} }
    }
  }
}
```

### Key fields:
- **`default`** — Fallback order when no platform-specific override exists
- **`platformOverrides`** — Platform-specific orders (`mobile-web`, `desktop-web`)
- **`productDiscontinued`** — Alternative order for out-of-stock/discontinued products
- **`widgetIDMapping`** — Widget definitions keyed by widget ID

### Desktop grid layout:
Desktop can use a 3-region grid instead of a flat list:
- `desktop-web-top-left` — Left column widgets
- `desktop-web-top-right` — Right column widgets
- `desktop-web-bottom` — Full-width bottom section

---

## Resolution Logic (Middleware)

**File:** `backend/middleware/api/helpers/rcl-helpers/getPDPDisplayOrder.ts`

```
1. Is there an experiment override? (expId + experimentConfig.isEnabled)
   → YES: use experiment's displayOrder (HIGHEST PRIORITY)
   → NO: continue

2. Does the PDP have its own displayOrder?
   → YES: use PDP's displayOrder
   → NO: use brand-level default from widgetised-pdp-config.json

3. Is the product discontinued?
   → YES: use productDiscontinued order (from whichever tier was selected)
   → NO: use regular order

4. Is there a platform-specific override?
   → YES: use platformOverrides[client] (e.g., "mobile-web")
   → NO: use default order

5. Filter widgets based on product state:
   → Remove "check-delivery-info" if product is out_of_stock
```

After resolution, `mapDynamicDataFromWidgets()` looks up each widget ID in `widgetIDMapping` (PDP-level first, brand-level fallback) and builds the final widget array.

---

## Admin-MCP Tools for DisplayOrder

| Task | Tool | Parameters |
|---|---|---|
| View brand default order | `get_brand_display_order` | `brand`, `platform` (optional) |
| View brand full config | `get_brand_pdp_config` | `brand` |
| Update brand default order | `update_brand_pdp_config` | `brand`, `data` (full config) or `json_path` + `value` |
| View PDP-specific order | `get_pdp_config` | `page_name`, `brand` |
| Update PDP-specific order | `update_pdp_section` | `page_name`, `json_path`, `value`, `brand` |

---

## Common Operations

### Hide a widget from a specific PDP

```
# 1. Get current PDP config
get_pdp_config(page_name: "minoxidil-5-hair-growth.json", brand: "mm")

# 2. Note the current displayOrder
#    Say it's: ["summary", "hero-banner", "promo-banner", "reviews", "faq"]

# 3. Update displayOrder WITHOUT the widget you want to hide
update_pdp_section(
  page_name: "minoxidil-5-hair-growth.json",
  json_path: "widgetsData.displayOrder.default",
  value: ["summary", "hero-banner", "reviews", "faq"],
  brand: "mm"
)
# "promo-banner" is now hidden but its definition is preserved in widgetIDMapping
```

### Reorder widgets on a PDP

```
update_pdp_section(
  page_name: "minoxidil-5-hair-growth.json",
  json_path: "widgetsData.displayOrder.default",
  value: ["summary", "reviews", "hero-banner", "faq"],
  brand: "mm"
)
```

### Change widget order for mobile only

```
update_pdp_section(
  page_name: "minoxidil-5-hair-growth.json",
  json_path: "widgetsData.displayOrder.platformOverrides.mobile-web",
  value: ["summary", "reviews", "hero-banner"],
  brand: "mm"
)
```

### Update brand-level default (affects ALL PDPs without overrides)

```
update_brand_pdp_config(
  brand: "mm",
  json_path: "widgetsData.displayOrder.default",
  value: ["summary", "hero-banner", "reviews", "faq", "cross-sell"]
)
```

---

## Important Notes

1. **Override is full replacement** — Setting a PDP-level displayOrder completely replaces the brand default. There is no merge.
2. **Widget definitions cascade** — Even with a PDP-level displayOrder, widget definitions are looked up in PDP's `widgetIDMapping` first, then brand-level fallback.
3. **Platform filtering still applies** — Even if a widget is in displayOrder, it won't render if `config.platform[client]` is false for the current platform.
4. **Repeat user variants** — `widgetIDMapping` can have `{id}-repeat` entries. Middleware auto-selects these for returning users.
5. **Reversibility** — Since removing from displayOrder preserves the definition, you can always re-add the widget later without recreating it.
