# Admin MCP Tool Reference

All 41 tools organized by category. Parameters marked (required) must be provided; all others have sensible defaults.

---

## PDP Tools (10)

### `list_pdp_pages` (READ)
List PDP pages with optional filtering.
- `brand` — Brand code. Defaults to config default.
- `environment` — `"staging"` | `"production"`. Defaults to `"staging"`.
- `page_type` — `"pdp_rcl"` | `"pdp"`. Defaults to `"pdp_rcl"`.
- `language` — `"en"` | `"hi"`. Defaults to `"en"`.
- `search` — Partial match in page name.
- `limit` — Max 200, defaults to 50.
- `offset` — Pagination offset.

**When to use:** Discovering which PDPs exist for a brand, finding a page name before fetching config.

### `get_pdp_config` (READ)
Fetch the full PDP JSON configuration.
- `page_name` (required) — PDP filename including `.json` (e.g., `"minoxidil-5.json"`).
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`. Defaults to `"staging"`.
- `language` — `"en"` | `"hi"`. Defaults to `"en"`.

**When to use:** Reading current PDP content before making edits, understanding structure. For bulk operations (4+ pages), prefer `get_pdp_summary` instead.

### `get_pdp_summary` (READ)
Fetch a lightweight PDP summary — product info, widget IDs/types/titles, display order, and format type (widgetized vs legacy). Returns ~500 bytes instead of ~20KB.
- `page_name` (required) — PDP filename including `.json`.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`. Defaults to `"staging"`.
- `language` — `"en"` | `"hi"`. Defaults to `"en"`.

**When to use:** Auditing multiple PDPs, comparing structures, finding pages with specific widget types. Use instead of `get_pdp_config` when you don't need full widget data.

### `get_pdp_schema` (READ)
Get the required keys/structure for a PDP page type.
- `page_name` (required) — PDP filename.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`. Defaults to `"staging"`.

**When to use:** Understanding what fields a PDP requires before creating or editing one.

### `diff_pdp_versions` (READ)
Compare two versions of a PDP (typically staging vs production).
- `page_name` (required) — Source PDP filename.
- `brand` — Source brand. Defaults to config default.
- `language` — `"en"` | `"hi"`.
- `compare` — `"staging_vs_production"` | `"custom"`. Defaults to `"staging_vs_production"`.
- `compare_page_name` — Target page name (for custom mode).
- `compare_brand` — Target brand (for custom mode).
- `compare_environment` — Target environment (for custom mode).

**When to use:** Reviewing what changed before publishing, comparing staging to production.

### `update_pdp_section` (WRITE)
Update a specific section of a PDP using a JSON path.
- `page_name` (required) — PDP filename.
- `json_path` (required) — Dot-notation path (e.g., `"widgets[2].data.title"`).
- `value` (required) — New value for the path.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `language` — `"en"` | `"hi"`.
- `lock_token` — From `acquire_page_lock`.
- `release_notes` — Min 10 chars for production.

**When to use:** Targeted edits — changing a title, updating an image URL, modifying a single widget. Preferred over `update_pdp_config` for small changes.

### `update_pdp_config` (WRITE)
Replace the entire PDP JSON configuration.
- `page_name` (required) — PDP filename.
- `data` (required) — Complete PDP JSON object.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `language` — `"en"` | `"hi"`.
- `release_notes` — Min 10 chars for production.

**When to use:** Full page replacement when many sections change. **Avoid** for small edits — use `update_pdp_section` instead.

### `publish_pdp_to_production` (DISABLED)
**BLOCKED** — Returns an error directing users to the admin dashboard UI.

### `create_pdp_page` (WRITE)
Clone an existing PDP to create a new one.
- `source_page_name` (required) — Source PDP filename to clone.
- `new_page_name` (required) — New page name (kebab-case).
- `source_brand` — Source brand. Defaults to config default.
- `target_brand` — Target brand. Defaults to source_brand.
- `language` — `"en"` | `"hi"`.
- `force` — Boolean. Overwrite if exists. Defaults to `false`.

**When to use:** Creating a new PDP based on an existing one as a template.

### `upload_pdp_image` (WRITE)
Upload an image from a URL to the PDP images S3 bucket.
- `file_url` (required) — HTTPS URL of the image to upload.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `key_prefix` — S3 key prefix. Defaults to `"products/images/"`.

**When to use:** Uploading a new image before referencing it in a PDP widget.

---

## Widget Page Tools (9)

### `list_widget_pages` (READ)
List widget pages with optional filtering.
- `brand` — Brand code.
- `environment` — `"staging"` | `"production"`.
- `search` — Partial match in page name.
- `limit` — Max 200, defaults to 50.
- `offset` — Pagination offset.

**When to use:** Discovering which widget pages exist, finding an identifier.

### `get_widget_page_config` (READ)
Fetch the full widget page JSON configuration.
- `identifier` (required) — Page slug without `.json` (e.g., `"home"`, `"category-hair"`).
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`. Defaults to `"staging"`.
- `repeat_user` — Boolean. Fetch repeat-user variant. Defaults to `false`.

**When to use:** Reading current widget page content, understanding widget structure. For bulk operations (4+ pages), prefer `get_widget_page_summary` instead.

### `get_widget_page_summary` (READ)
Fetch a lightweight widget page summary — widget IDs, types, titles, display order, and platform override counts. Returns ~500 bytes instead of ~30KB.
- `identifier` (required) — Page slug without `.json`.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`. Defaults to `"staging"`.
- `repeat_user` — Boolean. Defaults to `false`.

**When to use:** Auditing multiple pages, comparing structures, finding pages with specific widget types. Use instead of `get_widget_page_config` when you don't need full widget data.

### `diff_widget_page_versions` (READ)
Compare versions of a widget page.
- `identifier` (required) — Page slug.
- `brand` — Defaults to config default.
- `repeat_user` — Boolean. Defaults to `false`.
- `compare` — `"staging_vs_production"` | `"new_vs_repeat"` | `"custom"`. Defaults to `"staging_vs_production"`.
- `compare_identifier` — Target identifier (for custom mode).
- `compare_environment` — Target environment (for custom mode).

**When to use:** Reviewing staging changes before publish, comparing new vs repeat variants.

### `preview_widget_page_url` (READ)
Generate a preview URL for a widget page.
- `identifier` (required) — Page slug.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `route_type` — `"widgets"` | `"wlanding"` | `"pages"` | `"landing"`. Defaults to `"widgets"`.

**When to use:** Generating a URL to preview changes in a browser.

### `update_widget_page_section` (WRITE)
Update a specific section of a widget page using a JSON path.
- `identifier` (required) — Page slug.
- `json_path` (required) — Dot-notation path (e.g., `"widgets[3].widgetData.title"`).
- `value` (required) — New value.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `repeat_user` — Boolean. Defaults to `false`.
- `lock_token` — From `acquire_page_lock`.
- `release_notes` — Min 10 chars for production.

**When to use:** Targeted widget edits — changing text, images, or data within a specific widget.

### `update_widget_page_config` (WRITE)
Replace the entire widget page JSON configuration.
- `identifier` (required) — Page slug.
- `data` (required) — Complete widget page JSON object.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `repeat_user` — Boolean. Defaults to `false`.
- `release_notes` — Min 10 chars for production.

**When to use:** Full page replacement. **Avoid** for small edits.

### `create_widget_page` (WRITE)
Clone an existing widget page to create a new one.
- `source_identifier` (required) — Source page slug.
- `new_identifier` (required) — New page slug (kebab-case, regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/`).
- `source_brand` — Defaults to config default.
- `target_brand` — Defaults to source_brand.
- `clone_repeat_variant` — Boolean. Also clone repeat-user variant. Defaults to `true`.
- `force` — Boolean. Overwrite if exists. Defaults to `false`.

**When to use:** Creating a new widget page based on an existing one as a template.

### `publish_widget_page` (DISABLED)
**BLOCKED** — Returns an error directing users to the admin dashboard UI.

---

## Experiment Tools (10)

### `list_pdp_experiments` (READ)
List experiment variants for a control PDP.
- `control_page_name` (required) — Control PDP filename.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.

**When to use:** Discovering what experiments exist for a given PDP.

### `get_experiment_config` (READ)
Fetch the full experiment variant JSON.
- `experiment_page_name` (required) — Experiment filename (e.g., `"minoxidil-5-exp-hero-v2.json"`).
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `language` — `"en"` | `"hi"`.

**When to use:** Reading the experiment variant content.

### `compare_experiment_to_control` (READ)
Diff an experiment variant against its control PDP.
- `experiment_page_name` (required) — Experiment variant filename.
- `control_page_name` (required) — Control PDP filename.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `language` — `"en"` | `"hi"`.

**When to use:** Reviewing what sections the experiment modifies relative to the control.

### `get_experiment_assignment_config` (READ)
Get the traffic assignment/split configuration.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `type_filter` — `"product"` | `"landing"` | `"category"` | `"home"`.
- `identifier_filter` — Filter to specific URL key or page slug.

**When to use:** Checking current traffic split percentages for experiments.

### `create_pdp_experiment` (WRITE)
Create a new experiment variant from a control PDP.
- `control_page_name` (required) — Control PDP filename.
- `experiment_name` (required) — Kebab-case name (regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/`).
- `brand` — Defaults to config default.
- `language` — `"en"` | `"hi"`.
- `modifications` — Array of `{json_path: string, value: unknown}` pairs to apply immediately.

**When to use:** Starting a new A/B test by cloning a control PDP and optionally applying initial modifications.

### `update_experiment_config` (WRITE)
Modify an experiment variant (section or full replacement).
- `experiment_page_name` (required) — Experiment filename.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `language` — `"en"` | `"hi"`.
- `mode` — `"full"` | `"section"`. Defaults to `"section"`.
- `data` — Full replacement JSON (required for `mode='full'`).
- `json_path` — Dot-notation path (required for `mode='section'`).
- `value` — New value (required for `mode='section'`).
- `release_notes` — Min 10 chars for production.
- `lock_token` — From `acquire_page_lock`.

**When to use:** Editing the experiment variant content. Use `mode='section'` for targeted edits.

### `publish_experiment` (DISABLED)
**BLOCKED** — Returns an error directing users to the admin dashboard UI.

### `promote_experiment_to_control` (WRITE)
Promote a winning experiment variant to become the control.
- `experiment_page_name` (required) — Experiment to promote.
- `control_page_name` (required) — Control PDP to overwrite.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `language` — `"en"` | `"hi"`.
- `release_notes` (required) — Min 10 chars.
- `archive_control` — Boolean. Archive old control. Defaults to `true`.

**When to use:** After an experiment wins, replacing the control with the winning variant.

### `update_experiment_assignment` (WRITE)
Set the traffic split for an experiment.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `type` (required) — `"product"` | `"landing"` | `"category"` | `"home"`.
- `identifier` (required) — URL key or page slug.
- `variants` (required) — `Record<string, {percent: number, id: string}>` where percentages must sum to 100.
- `release_notes` — Min 10 chars for production.

**When to use:** Setting how much traffic goes to each experiment variant.

### `remove_experiment_assignment` (WRITE)
Remove an experiment from traffic (send 100% to control).
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `type` (required) — `"product"` | `"landing"` | `"category"` | `"home"`.
- `identifier` (required) — URL key or page slug to remove.
- `release_notes` — Min 10 chars for production.

**When to use:** Stopping an experiment and removing it from traffic assignment.

---

## Brand Config Tools (3)

### `get_brand_pdp_config` (READ)
Fetch the `widgetised-pdp-config.json` for a brand.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.

**When to use:** Understanding the brand-level PDP config (widget display order, platform settings).

### `get_brand_display_order` (READ)
Get the widget display order for a specific platform.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `platform` — `"mobile-web"` | `"desktop-web"`. Defaults to `"mobile-web"`.

**When to use:** Checking what order widgets appear on PDPs for a specific platform.

### `update_brand_pdp_config` (WRITE)
Update the brand-level PDP config (section or full replacement).
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `mode` — `"full"` | `"section"`. Defaults to `"section"`.
- `data` — Full config (required for `mode='full'`).
- `json_path` — Dot-notation path (required for `mode='section'`).
- `value` — New value (required for `mode='section'`).
- `release_notes` — Min 10 chars for production.

**When to use:** Changing brand-wide PDP settings like display order or platform configurations.

---

## Common Tools (6)

### `get_product_info` (READ)
Fetch product info from OpenSearch by URL key.
- `url_key` (required) — Product slug (e.g., `"minoxidil-5-hair-growth"`).
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.

**When to use:** Looking up product details (name, price, SKU, images) before referencing in a PDP.

### `search_products` (READ)
Search products by text query.
- `query` (required) — Search query string.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `limit` — Max results. Defaults to 10.

**When to use:** Finding products when you know a keyword but not the exact URL key.

### `preview_pdp_url` (READ)
Generate a preview URL for a PDP.
- `page_name` (required) — PDP filename.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.

**When to use:** Generating a staging URL to preview PDP changes in a browser.

### `check_page_lock` (READ)
Check the lock status of a page.
- `page_type` (required) — `"pdp"` | `"widget_page"` | `"experiment"`.
- `page_name` (required) — Page name or identifier.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.

**When to use:** Checking if someone else has a lock before editing.

### `acquire_page_lock` (WRITE)
Acquire a 15-minute advisory lock on a page.
- `page_type` (required) — `"pdp"` | `"widget_page"` | `"experiment"`.
- `page_name` (required) — Page name or identifier.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.

**When to use:** Before making multiple sequential edits to prevent concurrent modifications.

### `release_page_lock` (WRITE)
Release a previously acquired lock.
- `page_type` (required) — `"pdp"` | `"widget_page"` | `"experiment"`.
- `page_name` (required) — Page name or identifier.
- `brand` — Defaults to config default.
- `environment` — `"staging"` | `"production"`.
- `lock_token` (required) — Token returned from `acquire_page_lock`.

**When to use:** After finishing edits to release the lock for others.

---

## Widget Schema Tools (2)

### `list_widget_types` (READ)
List all available widget types (122+) and action types (41+).
- `search` — Partial match, case-insensitive (e.g., `"banner"`, `"navigate"`).
- `kind` — `"widget"`, `"action"`, or `"all"` (default: `"all"`).

**When to use:** Discovering available widget types, finding the right widget/action type for a use case.

### `get_widget_schema` (READ)
Get the full JSON Schema for a specific widget **or action** type.
- `widget_type` (required) — Widget or action type name (e.g., `"BANNER"`, `"NAVIGATE"`).
- `include_common_defs` — Boolean. Include common shared definitions. Defaults to `false`.

**When to use:** Understanding exactly what fields a widget needs before adding or modifying one.

---

## Critical Gotchas

1. **All writes are staging-only.** Production publishing must go through the admin dashboard UI.
2. **Rate limit:** 60 writes/min sustained, 10 per 5 sec burst. Exceeding returns `retryAfterMs`.
3. **Lock tokens expire after 15 minutes.** Re-acquire with `acquire_page_lock` if expired.
4. **PDP `page_name` includes `.json` extension** — e.g., `"minoxidil-5.json"`, not `"minoxidil-5"`.
5. **Widget page `identifier` does NOT include `.json`** — e.g., `"home"`, not `"home.json"`.
6. **Brand defaults to `"mm"`** if not specified in tool config.
7. **Environment defaults to `"staging"`** if not specified.
8. **Kebab-case required** for new identifiers — `"my-new-page"`, not `"myNewPage"`.
9. **Lock tools require `page_type`** — must specify `"pdp"`, `"widget_page"`, or `"experiment"`.
10. **`upload_pdp_image` uses `file_url`** not `image_url`. The param is `file_url`.
11. **Experiment assignment `variants`** is a complex object with percent + id per variant, not a simple traffic_percentage.
12. **`promote_experiment_to_control` requires `release_notes`** — it's mandatory, not optional.
