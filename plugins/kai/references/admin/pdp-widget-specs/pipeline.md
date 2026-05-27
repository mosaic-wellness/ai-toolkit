# Legacy Sections vs Widgetised — side by side

The PDP renders one of two ways. Both pipelines start at the same authored JSON in S3
(`products/rcl/{slug}.json`), but they diverge at the next hop.

```
                            ┌───────────────────────────┐
                            │  S3: products/rcl/{slug}  │
                            │  (authored RCL JSON,      │
                            │   contains data.sections) │
                            └─────────────┬─────────────┘
                                          │
                ┌─────────────────────────┴────────────────────────────┐
                │                                                      │
                ▼                                                      ▼
       ┌────────────────────┐                              ┌────────────────────┐
       │ LEGACY pipeline    │                              │ WIDGETISED pipe    │
       │ (sections)         │                              │                    │
       └─────────┬──────────┘                              └─────────┬──────────┘
                 │                                                   │
                 ▼                                                   ▼
   middleware: productDetails                  static-service: rclToRclWidgetised
   GET /page/mwsc/product/:product             writes  {brand}-products-{env}/
   ─ minimal enrichment                         products/{widgetised-prefix}/{slug}.json
   ─ returns full data.sections tree            (a flat widgets[] array)
                 │                                                   │
                 │                                                   ▼
                 │                          middleware: widgetProductPage
                 │                          GET /page/mwsc/widgetised/product/:product
                 │                          ─ reads widgetised JSON from S3
                 │                          ─ insertDynamicDataIntoProductPageWidgets
                 │                          ─ enriches widgets with Magento data, ratings
                 │                                                   │
                 ▼                                                   ▼
   front-end: ProductPage                            front-end: WidgetProductPage
   ─ fixed React composition                          ─ AuditedWidgetizedScreen
   ─ reads named sections from data.sections.*        ─ WidgetRenderer
   ─ each section = one hand-coded component          ─ BASE_WIDGET_MAP[type] dispatch
```

---

## Why two pipelines exist

The widgetised pipeline is the migration target. It exists so:

1. **Admins can compose PDPs without engineering work.** Adding a banner or a new
   carousel doesn't need a React PR — it's a JSON edit in Zeus.
2. **A single widget catalog is shared with widget pages and landing pages.** The same
   `BANNER`, `MEDIA_SLIDER`, `FAQ_ACCORDION` widgets that render on `/widgets/<id>`
   pages also render on PDPs.
3. **Experiments are a JSON swap.** A PDP experiment is just an alternate widgetised
   JSON in S3 that gets resolved by the display-order step.
4. **Mobile-app + web share the same response.** The widgetised contract is
   client-agnostic; native apps consume the same JSON with `omitResponseKeys` stripping
   web-only fields.

The legacy pipeline persists because:

1. **Migration is per-section, not per-brand or per-product.** Some sections still
   render via the fixed React composition until their transformer is written.
2. **Some PDP features rely on the fixed composition** — e.g. above-fold first-fold
   data extraction, the LJ tab navigation, the LJ-PDP-specific atomic components.
3. **Brand-by-brand rollout.** Bodywise, Man Matters, Little Joys each have their own
   readiness criteria for flipping `NEXT_PUBLIC_ENABLE_NEW_PDP`.

---

## Legacy pipeline — the full picture

### Authoring shape

`data.sections` is an object keyed by section name. Each section's value is
arbitrarily shaped — there's no schema enforced. Example sections seen on a live MM PDP:

```
sections: {
  order:                    { ... },
  keyIngredients:           { ... },
  safeAndEffective:         { ... },
  reviews:                  { ... },
  recentlyViewed:           { ... },
  weGotAnswers:             { ... },
  howItWorks:               { ... },
  productSwitches:          { ... },
  frequentlyBoughtTogether: { ... },
  productContainsDetails:   { ... },
  whyEndureData:            { ... },
  whatsInTheKit:            { ... },
  whatProsSay:              { ... },
  thingsToNote:             { ... },
  whyChooseMM:              { ... },
  whatItWorksBestWith:      { ... },
  mmBlogData:               { ... },
  mmHowToUseV2:             { ... },
  howItsUsed:               { ... },
  giftCallout:              { ... },
  stories:                  { ... },
  qna:                      { ... },
  topFeatures:              { ... },
  additionalInformation:    { ... },
  clinicalProof:            { ... },
  gifComp:                  { ... },
  howItWorks2:              { ... },
  ...
}
```

The full set of recognised section names is enumerated in
[`section-catalog.md`](section-catalog.md).

### Read flow

- Middleware `productDetails` controller (`middleware/api/controllers/pages/index.ts:746`).
- Reads the RCL JSON from S3.
- Runs minimal enrichment (price formatting, brand-level overrides).
- Returns the section tree mostly as-authored.

### Render flow

- `pages/products/[urlKey].tsx` → `ProductPage` → `ProductScreenComposition`
  (`Screens/Product/index.tsx`).
- Composition is a **hard-coded JSX tree**: every section is referenced by name and
  passed to a specific React component. Reordering is impossible without code change.
- Below-the-fold: `ProductBF` lazily fetches additional sections via
  `utility/exp?type=product` and renders `BTF.tsx`.
- The 59 named section components live in
  `apps/storefront-web/src/components/shared/src/ComponentsV2/Screens/LJ-PDP/*` and are
  re-exported through `Screens/Product/imports.tsx`.

### Pros / cons

| | |
| ---- | ---- |
| ✓ Fast to ship a wildly-custom layout for a single brand | ✗ Adding a new section = React PR |
| ✓ Per-component optimization control | ✗ Reordering = React PR |
| ✓ No widget-type registration overhead | ✗ Marketers blocked on engineering |
| ✗ Brand-specific component bundles cause divergence | ✗ Mobile-app has to re-parse named sections |

---

## Widgetised pipeline — the full picture

### Authoring shape

Still authored as `data.sections` in RCL — that's the source of truth. The
**widgetised file** is a derivative produced by `rclToRclWidgetised`:

```
{
  meta: { ... },
  productInfo: { ... },
  pdpBrandConfig: { ... },
  widgetsData: {
    displayOrder: ["widget-id-1", "widget-id-2", ...],
    widgetIDMapping: {
      "widget-id-1": { id, type, header, layout, widgetData: { ... } },
      "widget-id-2": { id, type, header, layout, widgetData: { ... } },
      ...
    },
    gridTopLeftOrder?: [...],
    gridTopRightOrder?: [...],
  },
  dynamicWidgets: ["widget-id-N", ...],  // need API-driven enrichment
  experimentConfig?: { ... },
}
```

Every widget has: `id`, `type`, `header?`, `layout?`, `widgetData`. See
[`widgets/`](widgets/) for the per-widget schema.

### Transformer (static-service)

`static-service/src/modules/staticService/helpers/mappers/rcl-pdp-to-widetized-pdp/index.ts`
is the master. It calls 48 per-section transformers under `widget-utils/`:

| RCL section | static-service transformer | Emits widget type(s) |
| ----------- | -------------------------- | -------------------- |
| `keyIngredients` | `transform-key-ingredients-data.helper.ts` (and `extractAndTransformKeyIngredientsAccordion`) | `MEDIA_SLIDER`, `ACCORDION_WITH_SHOW_MORE`, etc. |
| `safeAndEffective` | `transform-safe-and-effective-data.helper.ts` | `MEDIA_WITH_HEADER_SLIDER` (varies by brand) |
| `howWeCompareV2` | `transform-how-we-compare.helper.ts` | `COMPARISON_TABLE` |
| `productSwitches` | `transform-products-switches.helper.ts` | `PRODUCT_SWITCHES` |
| `recentlyViewed` | `transform-recently-viewed-product-slider.helper.ts` | `PRODUCT_CARD_SLIDER` |
| `weGotAnswers` | `transform-we-got-answers-data.helper.ts` | `FAQ_ACCORDION` or `ACCORDION` |
| `howItWorks` | `transform-how-it-works.helper.ts` | `MEDIA_WITH_HEADER_SLIDER` / `INFO_LIST_WITH_ICONS` |
| `frequentlyBoughtTogether` | `transform-frequently-bought-together.helper.ts` | `MULTI_PRODUCT_SELECTOR` / `PRODUCT_CARD_SLIDER` |
| `productContainsDetails` | `transform-product-contains-card-data.helper.ts` | `PRODUCT_KIT_INFO` |
| `whyEndureData` | `transform-why-endure-data.helper.ts` | `INFO_TILE_CARD` |
| `whatsInTheKit` | `transform-whats-in-the-kit.helper.ts` | `PRODUCT_KIT_INFO` |
| `qna` | `transform-product-qna.helper.ts` | `QNA` |
| `topFeatures` | `transform-top-features.helper.ts` | `INFORMATION_GRID_STRIP` / `BENEFITS_HIGHLIGHTS` |
| `additionalInformation` | `transform-additional-info-data.helper.ts` | `ACCORDION` |
| `clinicalProof` | `transform-clinical-proof.helper.ts` | `MEDIA_WITH_HEADER_SLIDER` / `STATS_TILES_WITH_DESCRIPTION` |
| `howItsUsed` | `transform-how-to-use.helper.ts` | `MEDIA_WITH_HEADER_SLIDER` / `INFO_CARDS` |
| `mmHowToUseV2` | (same `transform-how-to-use.helper.ts`) | same |
| `giftCallout` | `transform-banner.helper.ts` (or per-brand override) | `BANNER` / `CALLOUT_WITH_IMAGE` |
| `stories` | `transform-reels-slider.helper.ts` | `REELS_SLIDER` |
| `mmBlogData` | (handled inline / via banners-to-widgets) | `CONTENT_CARD` slider |
| `imageGallery` | `transform-image-slider.helper.ts` / `transform-image-carousel.helper.ts` | `IMAGE_SLIDER` / `CAROUSEL_WITH_THUMBNAIL` |
| `productInfo` | `transform-pdp-hero-section.helper.ts` | `PRODUCT_SUMMARY` |
| `buyNow` | `transform-add-to-cart-cta.helper.ts` | `PRODUCT_CALL_TO_ACTION` |
| `checkDeliveryDate` | `transform-check-delivery-data.helper.ts` (and `extractAndTransformCheckDeliveryInfo`) | `CHECK_DELIVERY_INFO` / `PINCODE_BOX` |
| `breadCrumbs` | `transform-bread-crumbs.helper.ts` | `BREAD_CRUMBS` |
| `description` / `productDescription` | `transform-product-description.helper.ts` + `transform-product-description-with-media.helper.ts` | `TEXT_CONTAINER` / `MEDIA_TEXT_BLOCK` |
| `faqs` | `transform-faqs.helper.ts` | `FAQ_ACCORDION` |
| `whyChooseMM` | `transform-why-choose-mm.helper.ts` | `MEDIA_WITH_HEADER_SLIDER` |
| `whatItWorksBestWith` | `transform-what-it-works-best-with.helper.ts` | `PRODUCT_CARD_SLIDER` |
| `thingsToNote` | `transform-things-to-note.helper.ts` | `ACCORDION` / `INFO_LIST_WITH_ICONS` |
| `ingredients` (LJ) | `transform-ingredients.helper.ts` | `MEDIA_WITH_HEADER_SLIDER` |
| `consumerStudyV2` | `transform-consumer-study-data.helper.ts` | `STATS_TILES_WITH_DESCRIPTION` |
| `customerReview` (single) | `transform-customer-review.helper.ts` | `PRODUCT_REVIEW_CARD` |
| `reviewsVideo` | `transform-reviews-video.helper.ts` | `REVIEW_IMAGE_SLIDER` / `MEDIA_SLIDER` |
| `claimsData` | `transform-claims-data.helper.ts` | `BENEFITS_HIGHLIGHTS` |
| `safetyIcons` | `transform-safety-icon.helper.ts` | `INFO_LIST_WITH_ICONS` / `INFORMATION_GRID_STRIP` |
| `sugarNarrativeAndFacts` (LJ) | `transform-sugar-and-narrative-facts.helper.ts` | `NARRATIVE_AND_FACTS` |
| `doctorsYoutubeVideo` | `transform-doctors-youtube-video.helper.ts` | `YOUTUBE_CAROUSEL` / `MEDIA_SLIDER` |
| `walletDiscountBanner` | `transform-wallet-discount-banner.helper.ts` | `WALLET_BANNER_CTA` |
| `walletNudge` | `transform-wallet-nudge.helper.ts` | `OFFER_NUDGE_CARD` / `WALLET_BANNER_CTA` |
| `installmentOptions` | `transform-installment-options.helper.ts` | `INSTALLMENT_OPTIONS` |
| `snapMintData` | `transform-snap-mint-data.helper.ts` | `INSTALLMENT_OPTIONS` (Snapmint variant) |
| `offerCouponCard` | `transform-offer-coupon-card.helper.ts` | `OFFER_COUPON_CARD` |
| `affiliateCard` | `transform-affiliate-card.helper.ts` | `AFFILIATE_CARD` |
| `reels` | `transform-reel-slider.helper.ts` / `transform-reels-slider.helper.ts` | `REELS_SLIDER` |
| `imageCarousel` | `transform-image-carousel.helper.ts` | `CAROUSEL_WITH_THUMBNAIL` |
| `mediaSliderBanners` | `transform-banners-to-widgets.helper.ts` | `BANNER` (multiple) |
| `productSummary` | `transform-product-summary.helper.ts` | `PRODUCT_SUMMARY` |

Brand-specific transformer dispatch lives at the top of
`rcl-pdp-to-widetized-pdp/index.ts` — some sections only render for certain brands.

### Read enrichment (middleware)

After static-service has produced the widgetised JSON, middleware does one more pass at
read time. The dispatcher
`middleware/api/helpers/rcl-helpers/insertDynamicDataIntoProductPageWidgets.ts`
switches on `widget.type` and injects:

| Widget type (middleware case) | What gets injected |
| ----------------------------- | ------------------ |
| `PRODUCT_SUMMARY` | `productInfo` (live price, stock, image, variants), wallet bonus, ratings aggregate |
| `PRODUCT_KIT_INFO` | live prices for every kit item, kit-discount math |
| `SNAP_MINT_SNIPPET` | EMI options based on live price |
| `INSTALLMENT_OPTIONS` | Tabby / Snapmint installment math based on live price |
| `STATUS_CARD`, `EXPANDED_MEDIA` | per-product overrides |
| `BREAD_CRUMBS` | breadcrumb tail (category → product) |
| `ACCORDION_WITH_SHOW_MORE` | ingredient details from product attribute |
| `PRODUCT_FOOTER_STICKY` | live price + ATC button state |
| `PRODUCT_SWITCHES` | configurable child product variants |
| `TABBY_PROMO` | brand-level Tabby promo enabled flag + amount |
| `CHECK_DELIVERY_INFO`, `PINCODE_BOX` | QD eligibility for the user's pincode |
| `PRODUCT_SWITCHER` | sibling product list + pricing |
| `CAROUSEL_WITH_THUMBNAIL` | image gallery from product media |
| `RATINGS_AND_REVIEWS` | rating aggregate (avg, count, breakdown by star) |
| `QNA` | top-N QnA from QnA service |
| `AFFILIATE_CARD` | affiliate banner content from brand config |
| `OFFER_NUDGE_CARD` | live offers from offers service |
| `PRODUCT_CALL_TO_ACTION` | ATC button state, OOS / notify-me variant |
| `PRODUCT_SUBSCRIPTION` | subscription frequency + discount math |
| `ACCORDION` | per-product field injections |
| `WALLET_BANNER_CTA` | wallet balance for the user |

Widgets *not* listed in this switch are passed through unmodified (admin-authored data is
all they need).

### Render flow

- `WidgetProductPage` → `AuditedWidgetizedScreen` → `WidgetizedScreen` →
  `useSecondFoldPaginatedWidgets` (above/below fold split) → `WidgetRenderer`.
- `WidgetRenderer` iterates `widgets[]` and looks up `BASE_WIDGET_MAP[widget.type]`.
- The component receives the entire widget object (`{ id, type, header, layout, widgetData }`) and renders accordingly.

### Pros / cons

| | |
| ---- | ---- |
| ✓ Marketers ship layout changes without code | ✗ Two transformer passes (static-service then middleware) — easy to drift |
| ✓ Same widgets reusable on landing pages | ✗ Debugging requires understanding all layers |
| ✓ Mobile + web share the JSON | ✗ Adding a new widget = touch 4 repos (admin, static-service, middleware, frontend) |
| ✓ Experiments are JSON-only | ✗ Per-brand polish harder than fixed React |

---

## Adding a new widget type — the cross-repo checklist

1. **admin-mcp catalog**: define the widget schema (name, required fields, widgetData
   shape). The catalog auto-discovers from `get_widget_schema`. Coordinate with the
   admin-mcp team if it's truly net-new.
2. **admin-dashboard-be**: add the form template in `application/views/admin/all_pages/*`
   so admins can configure it through the UI (otherwise they have to paste raw JSON).
3. **static-service**: if the widget is derived from an authored section, add a
   `widget-utils/transform-<name>.helper.ts` and wire it into
   `rcl-pdp-to-widetized-pdp/index.ts`. If the widget is admin-authored as-is, no
   transformer is needed.
4. **middleware**: if the widget needs dynamic data, add a case to
   `insertDynamicDataIntoProductPageWidgets.ts` and an enricher under
   `InsertDynamicDataIntoWidgetsHelpers/`. If it's static data, skip this step.
5. **front-end-mono-repo**: create the widget under
   `apps/storefront-web/src/mono/web-core/widgets/<Name>/`, export from `index.ts`, add
   the type to `BASE_WIDGET_MAP_TYPES` and the component to `BASE_WIDGET_MAP` in
   `Widgets.Map.ts`.
6. **Spec**: add a markdown file under `docs/specs/pdp-widgets/widgets/<type>.md`
   following the per-widget template.

Always do the contract first (the widget schema). See
`.claude/rules/cross-repo-contracts.md`.
