# `RECENTLY_VIEWED_CATALOG_CARDS`

> Grid variant of [`RECENTLY_VIEWED_PRODUCT_CARD_SLIDER`](RECENTLY_VIEWED_PRODUCT_CARD_SLIDER.md).
> Same source data, grid layout.

## Identity

- type — `RECENTLY_VIEWED_CATALOG_CARDS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EXPAND` — personalised "you viewed" grid.

### Edit-safety

🟢 header `title` / `subTitle` when authored.
🔴 the products list itself is user-history-driven and not authored — nothing to edit.

## widgetData

Empty at the top level. Same data source as the slider variant.

## Gotchas

- Don't use the grid variant above the fold — recently-viewed is personalized and
  loading the data delays first paint.
