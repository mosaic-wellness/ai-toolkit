# `TAG_MEDIA`

> A small brand-mark / navbar-decoration image rendered at the very top of the page —
> usually a transparent brand logotype that overlays the hero. Per-breakpoint sizing.

## Identity

- **type** — `TAG_MEDIA`
- **headerSupported** — true (rarely set) · **layoutSupported** — true
- **PDP relevance** — ✓ (when the brand authors a `tag` field in RCL — not on every PDP)
- **Narrative role** — `ANCHOR` — brand identity reinforcement above the gallery. Not part of the buying narrative; it's site furniture.

## widgetData

Edit-safety: 🟢 AI-safe · 🟡 Sensitive · 🔴 Structural.

| Field | Type | Required | Edit | Notes |
| ----- | ---- | -------- | ---- | ----- |
| `desktopImage` | string (URL) | yes | 🟡 | Brand asset URL — desktop variant. Treat as sensitive: brand identity is brand-managed. |
| `mobileImage` | string (URL) | yes | 🟡 | Brand asset URL — mobile variant. |
| `desktopWidth` | number | yes | 🟢 | Render width in px, desktop. |
| `desktopHeight` | number | yes | 🟢 | Render height in px, desktop. |
| `mobileWidth` | number | yes | 🟢 | Render width in px, mobile. |
| `mobileHeight` | number | yes | 🟢 | Render height in px, mobile. |

## Example

```json
{
  "id": "tag-media",
  "type": "TAG_MEDIA",
  "layout": { "type": "CONTAINED" },
  "widgetData": {
    "desktopImage": "https://cdn/brand-tag-desktop.png",
    "mobileImage":  "https://cdn/brand-tag-mobile.png",
    "desktopWidth": 240,
    "desktopHeight": 60,
    "mobileWidth":  160,
    "mobileHeight": 40
  }
}
```

## How it appears on a PDP today

Authored as the top-level `tag` field in the RCL JSON (not under `data.sections`).
Static-service emits it via `extractAndTransformTag` in
`static-service/src/modules/staticService/helpers/mappers/rcl-pdp-to-widetized-pdp/index.ts:1565`.
The transformer requires all three of `tag.desktopImage`, `tag.mobileImage`, and
`tag.display`. If any of those are missing, the widget is **silently skipped**.

```ts
const extractAndTransformTag = ({ tag }) => {
  if (!tag || !tag.desktopImage || !tag.mobileImage || !tag.display) return null;
  return {
    type: "TAG_MEDIA",
    id: "tag-media",
    layout: { type: "CONTAINED" },
    widgetData: { ...tag },
  };
};
```

## Middleware enrichment

None. `TAG_MEDIA` passes through middleware unmodified — it's a static brand asset.

## Frontend component

- Registered in the **audited widget map**:
  `apps/storefront-web/src/mono/web-core/auditedWidgets/Widget.Map.ts`
- Component: `apps/storefront-web/src/mono/web-core/auditedWidgets/TagMedia/TagMediaContainer.tsx`
  (renders via `TagMedia.tsx`).
- Also referenced by `apps/storefront-web/src/mono/web-core/Components/Utility/TransparentNavbarMobile/TransparentNavbarMobile.tsx` for navbar layouts where the tag image overlaps the hero.

## Gotchas

- The widget **silently disappears** if any required field is missing (the transformer
  returns `null`). Authors who add a `tag` field but forget `display: true` will see
  nothing rendered.
- The widget id is **hard-coded** as `"tag-media"` by the transformer — every page has
  at most one `TAG_MEDIA`. Don't try to author multiple.
- This is a brand-mark asset, not a marketing creative. Don't repurpose for promo
  banners — use [`BANNER`](BANNER.md) instead.
- Sizing is per-breakpoint and **in pixels**. Don't author percentages or `auto`.
- For SEO: this image is decorative-only and is not the page hero. The `alt` attribute
  on the rendered image is empty by design.
