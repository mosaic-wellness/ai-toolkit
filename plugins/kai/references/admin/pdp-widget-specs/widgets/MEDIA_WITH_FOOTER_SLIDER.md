# `MEDIA_WITH_FOOTER_SLIDER`

> Like `MEDIA_WITH_HEADER_SLIDER` but with the title/subtitle below the media.

## Identity

- type — `MEDIA_WITH_FOOTER_SLIDER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `SHOWCASE` — same job as `MEDIA_WITH_HEADER_SLIDER` with footer-text layout.

### Edit-safety

🟢 per-slide title / subtitle / alt text.
🟡 `items[].modalContent` if it asserts claims; slide subtitle / badge.
🔴 `modalEnabled`, `sliderConfig` enums.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ title, subtitle, media, cta?, badge?, modalContent? }` | Each slide. |
| `sliderConfig` | object | See [`_common.md`](_common.md). |
| `modalEnabled` | bool | If true, tapping a slide opens a modal with `modalContent` expanded — used for "zoom for detail". |

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/MediaWithFooterSlider/`.

## Gotchas

- `modalEnabled: true` adds a modal trigger on every slide. Don't enable it unless
  every slide has meaningful `modalContent` — otherwise users tap into an empty modal.
