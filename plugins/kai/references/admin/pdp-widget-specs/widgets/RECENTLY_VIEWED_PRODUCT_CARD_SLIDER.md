# `RECENTLY_VIEWED_PRODUCT_CARD_SLIDER`

> Personalized "recently viewed" product slider. `widgetData` is empty at authoring
> time — the slider's contents come entirely from the user's view history (stored in
> localStorage + server fallback).

## Identity

- type — `RECENTLY_VIEWED_PRODUCT_CARD_SLIDER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EXPAND` — personalised "you viewed" slider.

### Edit-safety

🟢 header `title` / `subTitle` when authored.
🔴 the products list itself is user-history-driven; nothing in the JSON is authored content.

## widgetData

Empty at the top level. The frontend fetches recently-viewed products from
`useRecentlyViewedProducts` and renders inline.

## How it appears on a PDP today

Authored as `recentlyViewed` RCL section. Transformer:
`transform-recently-viewed-product-slider.helper.ts`.

## Gotchas

- For anonymous users with no history, the widget hides itself (no empty state by
  default).
- The localStorage cap is 20 products; older entries get evicted.
