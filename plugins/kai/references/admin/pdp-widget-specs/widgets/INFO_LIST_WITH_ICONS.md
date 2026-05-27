# `INFO_LIST_WITH_ICONS`

> A vertical numbered (or icon-prefixed) list. Often used for "How to use" steps.

## Identity

- type — `INFO_LIST_WITH_ICONS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `ANCHOR` / `OBJECTION` hybrid — numbered "how to use" steps.

### Edit-safety

🟢 step titles and short descriptions.
🟡 dosage / timing language ("take 1 capsule daily after breakfast") — health-claim sensitive.
🔴 `showSerialNumber`, `list[].icon` slots when they encode meaning.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `list` | array of `{ icon?, title, description?, mediaContent? }` | The list items. |
| `showSerialNumber` | bool | If true, renders 1./2./3. instead of icons. |

## How it appears on a PDP today

Authored as `howItWorks`, `thingsToNote`, or `howItsUsed` (alternate). Transformers:
`transform-how-it-works.helper.ts`, `transform-things-to-note.helper.ts`,
`transform-how-to-use.helper.ts`.
