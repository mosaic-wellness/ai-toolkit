# Admin MCP Workflow Patterns

Common workflows with exact tool sequences.

---

## 1. "Someone shared a URL — how do I update it?"

### Step 1: Parse the URL
Extract hostname and path from the URL.
- Hostname tells you the **brand**
- Path tells you the **page type**

### Step 2: Resolve hostname to brand code
See `brand-bucket-reference.md` for the full mapping. Quick reference:
- `*.manmatters.com` / `stg.manmatters.com` → `mm`
- `*.bebodywise.com` / `stg.bebodywise.com` → `bw`
- `*.ourlittlejoys.com` / `stg.ourlittlejoys.com` → `lj`
- `*.rootlabs.in` / `stg.rootlabs.in` → `rl-in`
- See `route-reference.md` for complete hostname table

### Step 3: Match path to page type

| Path Pattern | Page Type | Tool Category | Identifier |
|---|---|---|---|
| `/` | Widget Home Page | Widget Page tools | `home` |
| `/wlanding/{id}` | Widget Landing Page | Widget Page tools | `{id}` from URL |
| `/product/{urlKey}` | Widgetized PDP | PDP tools | `{urlKey}.json` |
| `/dp/{urlKey}` | Widgetized PDP (flag-gated, no experiments) | PDP tools | `{urlKey}.json` |
| `/{slug}` (catch-all) | Unknown | Try both | See Step 3a |

**Step 3a: Resolving catch-all `/{slug}` paths:**
1. Try `get_widget_page_config(identifier: "{slug}", brand: "{brand}")` first
2. If that returns a 404, try `get_pdp_config(page_name: "{slug}.json", brand: "{brand}")`
3. If both fail, the page is not managed by admin-mcp

**NOT managed by admin-mcp:**
- `/shop/*` — Shop/Category pages
- `/account/*` — Account pages
- `/consultation/*` — Consultation flow
- `/forms/*` — Forms
- `/checkout/*` — Checkout flow

### Step 4: Fetch current config
```
# For widget pages:
get_widget_page_config(identifier: "{id}", brand: "{brand}")

# For PDPs:
get_pdp_config(page_name: "{urlKey}.json", brand: "{brand}")
```

### Step 5: Identify what to change
Review the JSON structure, find the section to update.

### Step 6: Make the edit
```
# For widget pages:
update_widget_page_section(identifier: "{id}", json_path: "widgets[3].widgetData.title", value: "New Title", brand: "{brand}")

# For PDPs:
update_pdp_section(page_name: "{urlKey}.json", json_path: "widgets[2].data.title", value: "New Title", brand: "{brand}")
```

> **Final step:** Follow [Post-Write Verification](#post-write-verification-applies-to-all-write-workflows) before marking complete.

---

## 2. Add a Widget to an Existing Page

### Step 1: Discover widget types
```
list_widget_types(search: "banner")  // or whatever type you need
```
Browse the results to find the right widget type for your use case.

### Step 2: Get the widget schema
```
get_widget_schema(widget_type: "BANNER")  // replace with your chosen type
```
Understand required fields, optional fields, and their types.

### Step 3: Fetch current page config
```
get_widget_page_config(identifier: "home", brand: "mm")
```

### Step 4: Examine the widgets array
Find the position where you want to insert the new widget. Note the array index.

### Step 5: Construct the new widget object
Every widget needs at minimum:
```json
{
  "id": "unique-widget-id",
  "type": "BANNER",
  "widgetData": { ... }  // fields from the schema
}
```
Optionally include `header` and `layout` if the widget type supports them (check schema).

### Step 6: Acquire a lock (recommended)
```
acquire_page_lock(page_type: "widget_page", page_name: "home", brand: "mm")
```
Save the returned `lock_token`.

### Step 7: Update the page
Insert the widget into the widgets array. You can either:

**Option A — Update entire widgets array:**
```
update_widget_page_section(
  identifier: "home",
  json_path: "widgets",
  value: [... existing widgets with new one inserted ...],
  brand: "mm",
  lock_token: "{token}"
)
```

**Option B — Use `update_widget_page_config` for full replacement** if the change is complex.

### Step 8: Preview
```
preview_widget_page_url(identifier: "home", brand: "mm")
```

### Step 9: Release the lock
```
release_page_lock(page_type: "widget_page", page_name: "home", brand: "mm", lock_token: "{token}")
```

> **Final step:** Follow [Post-Write Verification](#post-write-verification-applies-to-all-write-workflows) before marking complete.

---

## 3. Modify Widget Data on a Page

### Step 1: Fetch current config
```
get_widget_page_config(identifier: "home", brand: "mm")
```

### Step 2: Find the target widget
Locate the widget by its `id` field or by scanning the `widgets` array for the correct index.

### Step 3: Understand the widget schema
```
get_widget_schema(widget_type: "BANNER")  // use the widget's actual type
```

### Step 4: Acquire a lock
```
acquire_page_lock(page_type: "widget_page", page_name: "home", brand: "mm")
```

### Step 5: Update the specific field
```
update_widget_page_section(
  identifier: "home",
  json_path: "widgets[3].widgetData.title",
  value: "Updated Title",
  brand: "mm",
  lock_token: "{token}"
)
```

**JSON path examples:**
- `widgets[0].widgetData.title` — First widget's title
- `widgets[2].widgetData.items[0].image` — Third widget, first item's image
- `widgets[5].header.title` — Sixth widget's header title
- `widgets[1].widgetData` — Replace entire widgetData object

### Step 6: Preview
```
preview_widget_page_url(identifier: "home", brand: "mm")
```

### Step 7: Release the lock
```
release_page_lock(page_type: "widget_page", page_name: "home", brand: "mm", lock_token: "{token}")
```

> **Final step:** Follow [Post-Write Verification](#post-write-verification-applies-to-all-write-workflows) before marking complete.

---

## 4. Create a New Widget Page

### Step 1: Find a suitable source page to clone
```
list_widget_pages(brand: "mm", search: "category")
```

### Step 2: Clone the page
```
create_widget_page(
  source_identifier: "category-hair",
  new_identifier: "category-skin",  // must be kebab-case
  source_brand: "mm",
  target_brand: "mm",
  clone_repeat_variant: true
)
```

### Step 3: Fetch the cloned page
```
get_widget_page_config(identifier: "category-skin", brand: "mm")
```

### Step 4: Modify the cloned page
Use `update_widget_page_section` for targeted edits or `update_widget_page_config` for a full replacement.

### Step 5: Preview
```
preview_widget_page_url(identifier: "category-skin", brand: "mm")
```

> **Final step:** Follow [Post-Write Verification](#post-write-verification-applies-to-all-write-workflows) before marking complete.

---

## 5. Set Up an A/B Experiment

See `experiment-lifecycle.md` for the full lifecycle. Quick workflow:

### Step 1: Get the control PDP
```
get_pdp_config(page_name: "minoxidil-5.json", brand: "mm")
```

### Step 2: Create the experiment variant
```
create_pdp_experiment(
  control_page_name: "minoxidil-5.json",
  experiment_name: "hero-banner-v2",
  brand: "mm",
  modifications: [
    { "json_path": "widgets[0].data.heroImage", "value": "new-hero.jpg" },
    { "json_path": "widgets[0].data.title", "value": "New Hero Title" }
  ]
)
```

### Step 3: Set the traffic split
```
update_experiment_assignment(
  type: "product",
  identifier: "minoxidil-5",
  brand: "mm",
  variants: {
    "control": { "percent": 50, "id": "minoxidil-5.json" },
    "hero-banner-v2": { "percent": 50, "id": "minoxidil-5-exp-hero-banner-v2.json" }
  }
)
```

---

## 6. Review Staging vs Production Before Publish

### Step 1: Run the diff

**For PDPs:**
```
diff_pdp_versions(page_name: "minoxidil-5.json", brand: "mm", compare: "staging_vs_production")
```

**For widget pages:**
```
diff_widget_page_versions(identifier: "home", brand: "mm", compare: "staging_vs_production")
```

### Step 2: Review the output

### Step 3: Generate preview URLs

### Step 4: Direct user to admin dashboard for publishing
**MCP cannot publish to production.** The user must use the admin dashboard UI.

---

## 7. Hide/Remove a Widget from a PDP (via DisplayOrder)

**Important:** Never delete widgets from `widgetIDMapping`. Instead, remove them from `displayOrder`. This is safe and reversible.

See `display-order-guide.md` for full details on the 3-tier system.

### Step 1: Fetch current PDP config
```
get_pdp_config(page_name: "minoxidil-5.json", brand: "mm")
```

### Step 2: Check if PDP has its own displayOrder
Look at `widgetsData.displayOrder`. If it exists, modify PDP-level. If not:
- **Option A:** Set a PDP-level override (only affects this PDP)
- **Option B:** Modify the brand-level default (affects ALL PDPs without overrides)

### Step 3: Remove the widget from displayOrder
```
update_pdp_section(
  page_name: "minoxidil-5.json",
  json_path: "widgetsData.displayOrder.default",
  value: ["summary", "hero-banner", "reviews", "faq"],
  brand: "mm"
)
# Omit the widget ID you want to hide
```

> **Final step:** Follow [Post-Write Verification](#post-write-verification-applies-to-all-write-workflows) before marking complete.

---

## 8. Reorder Widgets or Set Platform-Specific Layout

### Reorder
```
update_pdp_section(
  page_name: "minoxidil-5.json",
  json_path: "widgetsData.displayOrder.default",
  value: ["summary", "reviews", "hero-banner", "faq"],
  brand: "mm"
)
```

### Mobile-specific order
```
update_pdp_section(
  page_name: "minoxidil-5.json",
  json_path: "widgetsData.displayOrder.platformOverrides.mobile-web",
  value: ["summary", "hero-banner"],
  brand: "mm"
)
```

### Discontinued product layout
```
update_pdp_section(
  page_name: "minoxidil-5.json",
  json_path: "widgetsData.displayOrder.productDiscontinued.default",
  value: ["summary", "similar-products", "faq"],
  brand: "mm"
)
```

> **Final step:** Follow [Post-Write Verification](#post-write-verification-applies-to-all-write-workflows) before marking complete.

---

## Post-Write Verification (applies to all write workflows)

After completing any write workflow above, **always verify visually on staging**:

1. **Get preview URL** — Call `preview_widget_page_url` (for widget pages) or `preview_pdp_url` (for PDPs) to get the staging URL
2. **Bypass cache** — Append `?theme={random_value}` (e.g., `?theme=verify123`) to the URL. This bypasses multiple caching layers (CDN, middleware, browser)
3. **Check mobile** — Open the URL in a mobile viewport (375x812) and verify the changes render correctly
4. **Check desktop** — Open the same URL in a desktop viewport (1440x900) and verify
5. **Retry if needed** — If changes don't appear despite the cache bypass, retry up to **2 more times** with a different `theme` value each time
6. **Do not close the task** until both mobile and desktop views confirm the changes
