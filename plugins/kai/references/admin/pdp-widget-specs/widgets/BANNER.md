# `BANNER`

> A media (image, video, or Lottie) with an optional CTA overlaid. The most reused
> widget on every PDP — used for hero banners, mid-page promos, and gift callouts.

## Identity

- **type** — `BANNER` (also rendered for `MOBILE_BANNER` and `DESKTOP_BANNER` device aliases)
- **headerSupported** — true (rarely used on banners)
- **layoutSupported** — true
- **PDP relevance** — ✓
- **Narrative role** — `HERO` above the fold, `NUDGE` mid-page. A first-fold banner introduces brand or sale; a mid-page banner is a promotional interrupt.

### Edit-safety summary

🟢 AI-safe: `media.source` (when a marketing creative), `media.altText`, `media.posterImage`, `media.videoTitle`, `cta.label`, `cta.subText`.
🟡 Sensitive: any `cta` label or copy that asserts an offer ("30% off"), regulatory imagery in `media.source`.
🔴 Structural: `slug`, `cta.actions[]` (action wiring), `media.mediaType`, `aspectRatio` (CLS budget), all enum variants (`variant`, `size`, `loading`, `objectFit`).

## widgetData

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `media` | object | **yes** | Image / video / lottie. See sub-table. |
| `aspectRatio` | number | no | E.g. `1.78` for 16:9, `1` for square. If absent, the media's natural ratio is used. |
| `cta` | object | no | Optional CTA overlaid on the banner. See sub-table. |
| `removePadding` | bool | no | Bleeds the banner edge-to-edge inside the layout container. |
| `slug` | string | no | Per-banner key used by some analytics events. |

### `media`

Two required: `mediaType`, `source`. The rest are optional with mediaType-specific
defaults.

| Sub-field | Type | Values | Notes |
| --------- | ---- | ------ | ----- |
| `mediaType` | enum | `image` / `video` / `lottie` | **required** |
| `source` | string | URL | **required** |
| `altText` | string | | Required for SEO/a11y on `image`. |
| `posterImage` | string | URL | Video thumbnail before play. |
| `videoTitle` | string | | Used by SEO when video is present. |
| `autoplay`, `loop`, `muted`, `playsInline`, `controls` | bool | | Video controls. |
| `loading` | enum | `eager` / `lazy` | Defaults to `lazy`. Set `eager` only for above-fold images. |
| `objectFit` | enum | `contain` / `cover` | Default `cover`. |
| `maxWidth`, `maxHeight` | string (CSS) | | Caps for non-fluid layouts. |

### `cta`

| Sub-field | Type | Values | Notes |
| --------- | ---- | ------ | ----- |
| `label` | string | | **required** |
| `variant` | enum | `PRIMARY` / `SECONDARY` / `TERTIARY` | **required** |
| `size` | enum | `SMALL` / `MEDIUM` / `LARGE` | |
| `subText` | string | | Small line below the label. |
| `actions` | Action[] | | One or more actions (see [`../actions.md`](../actions.md)). |
| `disabled`, `loading` | bool | | Usually driven dynamically. |
| `fullWidth` | bool | | Stretch to container width. |
| `customClassName`, `customLabelClassName` | string | | Brand override hook. |

## Example — image banner with CTA

```json
{
  "id": "mid-pdp-banner-1",
  "type": "BANNER",
  "layout": { "type": "CONTAINED", "verticalSpacing": { "top": "COMPACT", "bottom": "COMPACT" } },
  "widgetData": {
    "media": {
      "mediaType": "image",
      "source": "https://cdn/banner-monsoon-sale.jpg",
      "altText": "Monsoon sale — flat 30% off",
      "loading": "lazy"
    },
    "aspectRatio": 2.4,
    "removePadding": false,
    "cta": {
      "label": "Shop the sale",
      "variant": "PRIMARY",
      "size": "MEDIUM",
      "actions": [
        { "action": "NAVIGATE", "actionData": { "url": "/collections/monsoon-sale" } }
      ]
    },
    "slug": "monsoon-sale-banner"
  }
}
```

## Example — Lottie animation, no CTA

```json
{
  "id": "trust-marker-anim",
  "type": "BANNER",
  "widgetData": {
    "media": {
      "mediaType": "lottie",
      "source": "https://cdn/lottie/trust-marker.json",
      "loop": true,
      "autoplay": true
    },
    "aspectRatio": 4,
    "removePadding": true
  }
}
```

## How it appears on a PDP today

Authored ad-hoc — `BANNER` widgets are sprinkled across PDPs as needed (mid-page promos,
section dividers, trust strips). Common sources:

- `mediaSliderBanners` RCL section → `transform-banners-to-widgets.helper.ts` emits one
  `BANNER` per banner authored.
- `giftCallout` RCL section → `transform-banner.helper.ts` may emit a single banner.

## Middleware enrichment

None. Banners are pure-data and pass through unmodified. The only dynamic behavior
comes from the action payload (e.g. a `NAVIGATE` action whose URL is templated by
brand).

## Frontend component

- `apps/storefront-web/src/mono/web-core/widgets/Banner/` (re-exported as `BannerWidget`).
- Lazily mounts video via intersection observer to avoid autoplay before scroll-in.
- Image banners hit ImageKit transforms automatically via
  `getOptimizedImageKitLink`.

## Gotchas

- Setting `loading: "eager"` on a below-fold banner hurts LCP. Reserve for the very
  first banner in display order.
- `MOBILE_BANNER` and `DESKTOP_BANNER` are device-targeting *aliases* of `BANNER` in the
  frontend's widget map — same component, but the JSON's `type` lets you author two
  banners for different breakpoints without a layout wrapper.
- Lottie banners can be heavy. If the bundle is > 100KB JSON, use a video instead.
- Setting `aspectRatio` is **mandatory** for avoiding CLS — if absent the layout shift
  is logged as a Web Vital regression.
