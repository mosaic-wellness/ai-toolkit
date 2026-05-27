# Common Widget Primitives

Every widget shares these top-level primitives. The per-widget spec files document only
the `widgetData` field, not these wrappers — re-read this doc when you need to
understand `header`, `layout`, or the action / media / CTA building blocks.

---

## Top-level widget shape

```json
{
  "id": "widget-unique-id",
  "type": "WIDGET_TYPE_UPPER_SNAKE",
  "header": { /* optional — see Header below */ },
  "layout": { /* optional — see Layout below */ },
  "widgetData": { /* required — widget-specific config */ }
}
```

- `id` — unique within the page; used by display-order arrays and analytics
- `type` — UPPER_SNAKE_CASE from the widget catalog
- `header` — optional title/subtitle block above the widget body
- `layout` — optional padding / background / spacing wrapper
- `widgetData` — the only field whose shape changes per widget type

The full source is `mcp__admin-mcp__get_widget_schema include_common_defs=true`.

---

## Header

A common header rendered above the widget body. Most widgets respect it; the spec for
each widget says whether `headerSupported` is true.

```json
{
  "header": {
    "title": "Frequently bought together",
    "subTitle": "Save more when you bundle",
    "preTitle": "Recommended",
    "titleTag": "h2",
    "alignment": "left",
    "titleColor": "#000000",
    "subTitleColor": "#666666",
    "icon": { /* Media */ },
    "decoration": { /* Media */ },
    "cta": { /* GenericCta */ }
  }
}
```

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | Required. Plain text or HTML. |
| `subTitle` | string | Optional secondary line. |
| `preTitle` | string | Optional small line above title (eyebrow). |
| `titleTag` | enum `h1` `h2` `h3` `h4` `h5` `h6` `p` | SEO heading level. Defaults to `h2`. |
| `alignment` | enum `left` `center` `right` | Defaults to `left`. |
| `titleColor`, `subTitleColor` | string (hex / css color) | Per-widget overrides for theme tokens. |
| `icon` | Media | Small icon rendered left of title. |
| `decoration` | Media | Decorative element rendered next to title. |
| `cta` | GenericCta | "View all"-style link on the right of the header. |

---

## Layout

A common wrapper around the widget body for padding, background, max-width, etc.

```json
{
  "layout": {
    "background": "#FFFFFF",
    "backgroundImage": { /* Media */ },
    "padding": { "top": 16, "right": 16, "bottom": 16, "left": 16 },
    "margin": { "top": 0, "right": 0, "bottom": 24, "left": 0 },
    "maxWidth": 1200,
    "border": { "color": "#E5E5E5", "width": 1, "radius": 8 },
    "showOnMobile": true,
    "showOnDesktop": true,
    "showForClient": ["mobile-web", "desktop-web"]
  }
}
```

| Field | Type | Notes |
| ----- | ---- | ----- |
| `background` | string (hex / css color) | |
| `backgroundImage` | Media | If set, layered behind body. |
| `padding`, `margin` | `{ top, right, bottom, left }` numbers (px) | |
| `maxWidth` | number (px) | Cap on body width (centers on wider screens). |
| `border` | `{ color, width, radius }` | |
| `showOnMobile`, `showOnDesktop` | bool | Per-breakpoint visibility. |
| `showForClient` | string[] | Subset of `mobile-web`, `desktop-web`, `android-native`, `ios-native`. Hides the widget from any client not in the list. |

---

## Media

Used everywhere — banners, slider items, hero images, icons, etc.

```json
{
  "media": {
    "type": "image",
    "url": "https://cdn.../hero.jpg",
    "altText": "Hero banner",
    "aspectRatio": "16:9",
    "imageKitParams": { "tr": "w-1200,q-80" },
    "fallback": { "url": "..." }
  }
}
```

Or for video:

```json
{
  "media": {
    "type": "video",
    "url": "https://cdn.../hero.mp4",
    "thumbnail": "https://cdn.../hero-thumb.jpg",
    "autoplay": true,
    "loop": true,
    "muted": true,
    "playsInline": true,
    "controls": false
  }
}
```

| Field | Values | Notes |
| ----- | ------ | ----- |
| `type` | `image` `video` `lottie` `gif` `youtube` | |
| `url` | string | Source URL. ImageKit URLs accept the `imageKitParams` for transformations. |
| `altText` | string | Required for `image` for accessibility / SEO. |
| `aspectRatio` | string `W:H` (`16:9`, `1:1`, `4:3`, `3:4`) | Avoid CLS by setting this. |
| `thumbnail` | string | For video / youtube. |
| `autoplay`, `loop`, `muted`, `playsInline`, `controls` | bool | Video-only. |
| `desktopUrl` / `mobileUrl` | string | If present, used instead of `url` for that breakpoint. |
| `fallback` | Media | Shown if primary `url` fails to load. |

---

## GenericCta

A CTA = label + action(s). Used in headers, on cards, on banners.

```json
{
  "cta": {
    "label": "Shop now",
    "variant": "primary",
    "size": "md",
    "icon": { /* Media */ },
    "iconPosition": "right",
    "fullWidth": false,
    "actions": [
      { "action": "NAVIGATE", "actionData": { "url": "/products/abc" } }
    ]
  }
}
```

| Field | Values | Notes |
| ----- | ------ | ----- |
| `label` | string | Required. The text on the CTA. |
| `variant` | `primary` `secondary` `tertiary` `text` `outline` `ghost` | Theme-tokenised. |
| `size` | `xs` `sm` `md` `lg` `xl` | |
| `icon` | Media | Optional icon. |
| `iconPosition` | `left` `right` | Defaults to `left`. |
| `fullWidth` | bool | If true, expands to container width. |
| `actions` | Action[] | One or more (see [`../actions.md`](../actions.md)). Fired in order on click. |
| `isLoading` | bool | Shows spinner — usually driven dynamically. |
| `isDisabled` | bool | |
| `testId` | string | Used for E2E tests. |

Legacy form: `cta` is sometimes a flat object with `action` + `actionData` instead of
`actions[]`. Both are supported; prefer `actions[]` for new widgets.

---

## SliderConfig

Repeated across every slider-style widget.

```json
{
  "sliderConfig": {
    "slidesPerView": { "desktop": 3, "mobile": 1.2 },
    "spaceBetween": { "desktop": 16, "mobile": 12 },
    "loop": false,
    "autoplay": false,
    "autoplaySpeed": 3000,
    "showDots": true,
    "showArrows": true,
    "arrowVariant": "circle",
    "dotVariant": "line",
    "centeredSlides": false,
    "freeMode": false,
    "navigationGradient": true
  }
}
```

The carousel libraries are Swiper (most widgets) — see
`apps/storefront-web/src/components/shared/.../Slider/*`.

---

## CarouselConfig

Alias of `SliderConfig` used by some newer widgets (`MEDIA_CAROUSEL`,
`MEDIA_WITH_PILLS_SLIDER`, `MEDIA_WITH_INFO_CARDS`, etc.). Same fields.

---

## Verifying any of this

The schema definitions are authoritative — they're generated from TypeScript types in
the admin-mcp build. To inspect any widget's full schema (with all enum values and nested
shapes), run:

```
mcp__admin-mcp__get_widget_schema widget_type="BANNER" include_common_defs=true
```

That returns the JSON Schema with `Header`, `Layout`, `ActionType`, `GenericCta`, `Media`
all inlined.
