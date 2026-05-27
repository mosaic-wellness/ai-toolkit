# `STATS_TILES_WITH_DESCRIPTION`

> Hero stat tiles (numeric callouts) with a description paragraph. Used for
> "Clinical proof" / "Consumer study" results.

## Identity

- type — `STATS_TILES_WITH_DESCRIPTION`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EVIDENCE` (brand-asserted clinical data) or `PROOF` (third-party study). Most likely to need regulatory review.

### Edit-safety

🟡 **all of `items[].stat`, `items[].label`, `items[].footnote`, `text`, `title`** — each is a substantive claim. Especially `footnote` (the study attribution); removing it can make an otherwise-defensible claim unsubstantiated.
🟢 nothing — every visible field carries weight here.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | Section title. |
| `text` | string | Description paragraph. |
| `items` | array of `{ stat, label, footnote? }` | Each stat tile. `stat` is the big number (e.g. "92%"). |

## How it appears on a PDP today

Authored as `clinicalProof` or `consumerStudyV2` RCL section. Transformers:
`transform-clinical-proof.helper.ts`, `transform-consumer-study-data.helper.ts`.

## Gotchas

- The `footnote` is typically used for "n=120, 8-week study" attribution. If missing,
  legal/marketing review may flag the claim as unsubstantiated.
