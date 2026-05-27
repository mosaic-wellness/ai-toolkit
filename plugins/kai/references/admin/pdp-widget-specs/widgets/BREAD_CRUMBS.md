# `BREAD_CRUMBS`

> The category trail: Home › Hair › Hair Growth › Shilajit Gummies. Both a navigation
> element and an SEO signal.

## Identity

- type — `BREAD_CRUMBS`
- headerSupported — true (rarely used) · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `ANCHOR` — site context. Drives JSON-LD `BreadcrumbList`.

### Edit-safety

🔴 every `options[].url`, `options[].isCurrent`, `category` (structural; affects crawl + SEO).
🟡 `options[].label` (changing the visible category name has SEO and CX implications).
🟢 `iconColor`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `options` | array of `{ label, url, isCurrent? }` | The crumbs, ordered root → leaf. |
| `category` | string | The leaf category — used by SEO `BreadcrumbList` JSON-LD. |
| `iconColor` | string | CSS color for the separator icon. |

## How it appears on a PDP today

Authored as `breadCrumbs` RCL section. Transformer:
`transform-bread-crumbs.helper.ts`. Middleware appends the current product as the
trailing crumb at read time (`insertDynamicDataIntoProductPageWidgets.ts:198`).

## Frontend component

`apps/storefront-web/src/mono/web-core/Components/BreadCrumbsView` (also wrapped by
`<StyledBreadcrumbWrapper>` in `WidgetProductPage.tsx`).

Renders JSON-LD `BreadcrumbList` for rich snippets.

## Gotchas

- Each crumb's `url` must be absolute or root-relative. Relative paths break SEO.
- Native-app clients have this widget *stripped* by `omitResponseKeys` at the
  middleware response stage (`WIDGETISED_PDP_KEYS_TO_OMIT_FOR_APP` includes
  `breadCrumbs`).
