# `ACCORDION`

> A list of expandable sections. Used for "Additional information", "Ingredients",
> "How it works", anywhere an admin needs collapsible content blocks.

## Identity

- type — `ACCORDION`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `OBJECTION` — generic collapsible Q-and-A / "additional info" content. Self-serve depth.

### Edit-safety

🟢 `list[].title`, `list[].content` (when no new claims), `triggerEvent` if it's purely cosmetic.
🟡 `list[].content` that asserts health / safety / regulatory claims; `iconVariant`.
🔴 `list[].id`, `source`, `triggerEvent` if it routes to an analytics destination.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `list` | array of `{ id?, title, content, icon?, isOpen?, media? }` | The accordion items. `content` accepts HTML. |
| `source` | string | Analytics source key. |
| `iconVariant` | enum `chevron` / `plus-minus` / `arrow` / `none` | The expand/collapse indicator. |
| `isInitiallyOpen` | bool / number | If `true`, all items open; if a number N, only item index N is pre-open. |
| `titleFontWeight` | string CSS (`400`, `500`, `600`, `700`) | Visual override for the row title. |
| `triggerEvent` | string | Analytics event name fired on open/close. |

## How it appears on a PDP today

Multiple section transformers emit `ACCORDION`:
- `additionalInformation` section → `transform-additional-info-data.helper.ts`
- `thingsToNote` section → `transform-things-to-note.helper.ts`
- `accordion` standalone section → `transform-accordion.helper.ts`

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:367` (`ACCORDION` case) — usually a
pass-through. Some brands inject per-product fields into specific accordion items
(e.g. "Storage instructions" populated from product attribute).

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/Accordion/`.

## Gotchas

- `content` supports HTML. Sanitize before authoring user-derived content.
- The cousin widget [`ACCORDION_WITH_SHOW_MORE`](ACCORDION_WITH_SHOW_MORE.md) is for
  the "Key ingredients" use case — same accordion mechanic but each row has a richer
  card with image and expand/collapse for the *content* not the row.
