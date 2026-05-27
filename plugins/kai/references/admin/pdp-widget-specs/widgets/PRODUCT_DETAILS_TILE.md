# `PRODUCT_DETAILS_TILE`

> A multi-tile product-info block with show-more/show-less. Used for "Product details"
> drop-down sections.

## Identity

- type — `PRODUCT_DETAILS_TILE`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `OBJECTION` — collapsible product info ("product details" drawer).

### Edit-safety

🟢 `heading`, `description`, `showMoreBtnText`, `showLessBtnText`.
🟡 `items[].description` if it asserts claims.
🔴 `sectionName` (analytics), `items[].icon` slots.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `heading` | string | Section heading. |
| `description` | string | Lead paragraph (HTML-supported). |
| `items` | array of `{ icon?, title, description, mediaContent? }` | The tiles. |
| `sectionName` | string | Analytics key. |
| `showMoreBtnText` | string | "Show more" label. |
| `showLessBtnText` | string | "Show less" label. |
