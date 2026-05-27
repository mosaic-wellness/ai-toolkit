# `PRODUCT_SWITCHER`

> Cross-product navigation row — typically "explore related products" or "shop by
> goal" with one-tap deep-link to each sibling product PDP. **Not** a variant selector
> — that's [`PRODUCT_SWITCHES`](PRODUCT_SWITCHES.md).

## Identity

- type — `PRODUCT_SWITCHER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EXPAND` / `CALIBRATE` hybrid — "explore the range" cross-product nav. Different from `PRODUCT_SWITCHES` (which is variants of *the same* product).

### Edit-safety

🟢 `rows[].title`, item `tag` copy, item `name` if non-branded.
🟡 item `price`, item `discountedPrice`.
🔴 each item's `sku`, `urlKey`, `actions[]`.

## widgetData

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `productInfo` | object | yes | Current product context (middleware-injected). |
| `urlKey` | string | yes | The PDP's url key. |
| `rows` | array of `{ title?, productSwitcherRows?, items: ProductSwitcherItem[] }` | yes | Group definitions. A single row = a horizontal scroll lane. |
| `showBorder` | bool | no | Top + bottom border around the section. |
| `showTopBorder` | bool | no | Top border only. |
| `spacing` | string \| number | no | CSS spacing token between rows. |

### Each `rows[].items[]`

| Sub-field | Type | Notes |
| --------- | ---- | ----- |
| `sku`, `urlKey`, `name` | string | Identity. |
| `image` | string | Card image. |
| `tag` | string | Optional badge ("New", "Bestseller"). |
| `price`, `discountedPrice` | number | Middleware-injected. |
| `actions` | Action[] | Click handlers (usually one `NAVIGATE` to the sibling PDP). |

## How it appears on a PDP today

Used on hub-product PDPs and per-brand "shop by goal" rows. Authored ad-hoc. Middleware
enriches via `insertDynamicDataIntoProductPageWidgets.ts:268` (`PRODUCT_SWITCHER` case)
— each sibling product's price and stock get refreshed.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/ProductSwitch/` (shared with
`PRODUCT_SWITCHES`; the component disambiguates internally).

## Gotchas

- The crossover with `PRODUCT_SWITCHES` is the most common authoring mistake. Rule of
  thumb: are the targets *the same product*? Use `PRODUCT_SWITCHES`. Are they
  *different products*? Use `PRODUCT_SWITCHER`.
- Each item should have a `NAVIGATE` action to its PDP — don't use `ADD_TO_CART`
  unless brand wants a one-tap-add experience (uncommon on PDPs).
