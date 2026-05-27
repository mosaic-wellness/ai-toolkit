# `INFORMATION_GRID_STRIP`

> A horizontal strip of icon + short-label tiles. "Vegan", "Plant-based", "Lab-tested",
> "FSSAI-approved" trust markers commonly use this widget.

## Identity

- type — `INFORMATION_GRID_STRIP`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `EVIDENCE` — trust-marker strip (regulatory marks, certifications).

### Edit-safety

🟡 every `items[].label` and `items[].sublabel` — regulatory marks ("FSSAI-approved", "Lab-tested") cannot be changed without legal sign-off.
🟢 `items[].icon` URLs (decorative SVGs).
🔴 `category`, `items[].cta` actions.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `items` | array of `{ icon: Media, label, sublabel?, cta? }` | The tiles. |
| `category` | string | Analytics category. |

## How it appears on a PDP today

Authored as `topFeatures` or `safetyIcons` RCL section. Transformers:
`transform-top-features.helper.ts`, `transform-safety-icon.helper.ts`.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/InformationGridStrip/`.

## Gotchas

- The number of items × label length determines whether the grid wraps or scrolls
  horizontally. Test at 320px viewport.
- Each icon should be < 60px wide and an SVG. Lottie / video isn't supported here.
