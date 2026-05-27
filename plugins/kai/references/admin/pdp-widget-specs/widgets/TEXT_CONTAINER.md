# `TEXT_CONTAINER`

> Pure text / HTML block. Used for SEO copy, fine-print disclaimers, secondary
> descriptions.

## Identity

- type — `TEXT_CONTAINER`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `ANCHOR` — SEO body or fine-print disclaimers.

### Edit-safety

🟢 marketing copy in the SEO body.
🟡 legal disclaimers, T&C, regulatory language.
🔴 `displayHTMl` flag (changes safety mode), `variant`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `textContent` | string | The body text. Can be HTML if `displayHTMl: true`. |
| `displayHTMl` | bool | If true, `textContent` is rendered as HTML. Typo (`HTMl`) is in the schema. |
| `textContentAlign` | enum `left` / `center` / `right` | |
| `variant` | string | Brand-specific style variant. |

## Gotchas

- Watch the typo: `displayHTMl` (lowercase `l`). The schema has it; don't fix it
  without coordinating with the frontend renderer.
- For long SEO blocks, this is preferable to `MEDIA_TEXT_BLOCK` (which adds layout
  overhead).
