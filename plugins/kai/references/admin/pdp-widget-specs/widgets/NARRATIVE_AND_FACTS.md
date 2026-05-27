# `NARRATIVE_AND_FACTS`

> A storytelling block with main title, media, and a "fact tags" grid. Used for the
> "Sugar narrative" / "Story" sections on LJ PDPs.

## Identity

- type — `NARRATIVE_AND_FACTS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `STORY` (narrative-led) or `EVIDENCE` (data-led) — depends on which voice dominates in the authored content.

### Edit-safety

🟢 `mainTitle`, `title` when descriptive.
🟡 `content` (typically asserts claims), brand narrative copy if it makes promises.
🔴 `media`, `topIcon` if they encode brand identity (e.g. mascot images).

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `mainTitle` | string | Hero headline. |
| `title` | string | Sub-headline. |
| `content` | string | Body paragraph (HTML-supported). |
| `media` | Media | Hero image/video. |
| `topIcon` | Media | Small icon above the title. |

## How it appears on a PDP today

Authored as `sugarNarrativeAndFacts` RCL section. Transformer:
`transform-sugar-and-narrative-facts.helper.ts`.

## Gotchas

- The Sugar variant of this widget (`SugarNarrativeAndFactsCharacter`) is a different
  component — LJ Sugar product uses a character mascot variant. The regular
  `NARRATIVE_AND_FACTS` doesn't have the character.
