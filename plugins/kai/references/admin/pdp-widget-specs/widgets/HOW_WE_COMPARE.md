# `HOW_WE_COMPARE`

> Deprecated predecessor to [`COMPARISON_TABLE`](COMPARISON_TABLE.md). Same intent —
> "with us vs without us" — but a simpler two-column layout.

## Identity

- type — `HOW_WE_COMPARE`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓ (legacy)
- **Narrative role** — `EVIDENCE` — same as `COMPARISON_TABLE` (legacy two-column variant).

### Edit-safety

🟡 every text field — `title`, `rowTitle`, `rows[]`, `happy.label`, `happy.items[]`, `sad.label`, `sad.items[]`. All comparative claims.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | Section heading. |
| `rowTitle` | string | Heading for the rows column. |
| `rows` | string[] | Plain-text features being compared. |
| `happy` | `{ label, items: string[] }` | The "with us" column. |
| `sad` | `{ label, items: string[] }` | The "without us" column. |

## How it appears on a PDP today

Authored as `howWeCompare` (deprecated) RCL section. Transformer:
`transform-how-we-compare.helper.ts` (`extractAndTransformHowWeCompare`). New PDPs
should use `howWeCompareV2` → `COMPARISON_TABLE` instead.

## Gotchas

- The "happy/sad" naming is historical. Don't read more into it.
- Items in `happy.items` and `sad.items` are positional — index N in `happy.items`
  must describe the same feature as `rows[N]`.
