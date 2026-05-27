# `MEDIA_CAROUSEL`

> A more configurable image / video carousel — used when `MEDIA_SLIDER` doesn't have
> enough layout knobs.

## Identity

- type — `MEDIA_CAROUSEL`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `SHOWCASE` — generic visual carousel.

### Edit-safety

🟢 `items[].title`, `items[].subtitle`, alt text, marketing-creative URLs.
🔴 `items[].cta.actions[]`, `carouselConfig` enums.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ media, cta?, title?, subtitle? }` | Slides. |
| `carouselConfig` | object | See [`_common.md`](_common.md). |
