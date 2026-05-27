# PDP Architecture — End-to-End Flow

The Product Detail Page is the most complex page in the storefront. Every PDP that
renders on `mansmatters.com`, `bebodywise.com`, `littlejoys.com`, etc. is the result of
**four repos coordinating** through S3 + HTTP.

This doc walks the request lifecycle hop-by-hop, in both the write and the read
direction, with the actual file paths where each step lives. Read this first before
touching anything in the PDP pipeline.

---

## Cast

| Layer | Repo | Role |
| ----- | ---- | ---- |
| Authoring UI | `admin-dashboard-be` (PHP/CodeIgniter, "Zeus") | The JSON editor where admins compose PDP sections. Writes to staging or production S3. |
| Schema-shaping service | `static-service` (Node/Express/TS) | (1) Receives upload requests from Zeus and writes RCL JSON to S3. (2) Has a separate transformer `rclToRclWidgetised` that converts RCL → widgetised format and uploads the second file. |
| Object store | AWS S3 | Holds two parallel JSON files per product: the RCL source and the widgetised derivative. |
| Read API + enrichment | `middleware` (Node/Express/TS) | The BFF the storefront calls. Reads from S3, fetches live data (Magento, ratings, wallet), enriches widgets, returns the response shape the frontend consumes. |
| Renderer | `front-end-mono-repo/apps/storefront-web` (Next.js) | SSR's the PDP, dispatches each widget to its React component. |
| Live product data source | Magento 2 | Source of truth for SKU price, stock, variant, image, etc. Middleware calls it on every PDP request. |

---

## Two parallel pipelines

A PDP today may render via one of **two** code paths depending on whether the brand has
the new widgetised pipeline enabled (`NEXT_PUBLIC_ENABLE_NEW_PDP`):

1. **Legacy "sections" pipeline** — admin authors named sections
   (`keyIngredients`, `howWeCompareV2`, `productSwitches`, …). Middleware's
   `productDetails` controller serves the raw section tree. The frontend's
   `ProductPage` component is a hand-wired composition that picks each section out of
   `data.sections.*` and passes it to a fixed React component.
2. **Widgetised pipeline** — same authored JSON, but `static-service` runs a
   transformer that produces a flat `widgets[]` array. Middleware's
   `widgetProductPage` controller serves it. The frontend's `WidgetRenderer` does
   type-based dispatch.

Most brands are mid-migration. The pipelines coexist in production. The
[`pipeline.md`](pipeline.md) doc compares them side-by-side.

The rest of this document focuses on the **widgetised pipeline** because (a) it's where
new widget types land, and (b) it's what `admin-mcp` understands.

---

## The write path (authoring → S3)

```
Zeus admin UI         static-service               S3
─────────────         ──────────────               ──

[Edit JSON]
    │
    │ HTTP POST /MM-trasnformation-and-upload
    │ body: { productId, brand, language, jsonBody }
    ▼
                   transformAndUpload
                        │
                        ├─ writeRclJsonToS3()
                        │       │
                        │       └────────────────────▶ {brand}-products-{env}/products/
                        │                                rcl/{slug}.json
                        │                                (the authored source)
                        │
                        └─ rclToRclWidgetised()
                                │
                                ├─ getProductData()           ← Magento + S3 fetches
                                ├─ getWidgetizedProductConfig() ← S3 brand-level config
                                │
                                ├─ transformRclPdpToWidgetizedPDP({
                                │     sourceData, urlKey, brand, widgetizedProductConfig
                                │   })
                                │       │
                                │       └─ for each section in sourceData:
                                │            run the matching widget-utils/*
                                │            transformer (see static-service
                                │            section-to-widget table below)
                                │
                                └─ uploadFileToS3()
                                        │
                                        └────────────▶ {brand}-products-{env}/products/
                                                         {widgetised-prefix}/{slug}.json
                                                         (the derived widgetised file)
```

### Key files

- Admin → static-service POST endpoint: `static-service/src/modules/staticService/routes/index.ts:61` (`/MM-trasnformation-and-upload` → `transformAndUpload`).
- Upload + transform controller: `static-service/src/modules/staticService/controllers/rcl-widetized-s3-trasnform-and-upload.controller.ts`.
- Master transformer entry: `static-service/src/modules/staticService/helpers/mappers/rcl-pdp-to-widetized-pdp/index.ts`.
- Per-section transformers (48 files): `static-service/src/modules/staticService/helpers/mappers/rcl-pdp-to-widetized-pdp/widget-utils/transform-*.helper.ts`.
- Admin save flow (PHP): `admin-dashboard-be/application/controllers/admin/All_pages.php`, view template `application/views/admin/all_pages/page_edit.php`.
- Page registry table: stored in the admin DB; `mcp__admin-mcp__list_pdp_pages` reads it. `page_type='pdp_rcl'` identifies a PDP source.

### S3 layout (verified from `widgetised-pdp.ts:415` + `list_pdp_pages` output)

```
{brand-prefix}-products-{env}/
└── products/
    ├── rcl/                           ← authored RCL source
    │   └── {slug}.json
    └── {widgetised-prefix}/           ← derived widgetised file
        └── {slug}.json
```

Where:
- `{brand-prefix}` is brand-specific. Examples: `manmatters-products-prod`,
  `bebodywise-products-staging`. Maps via `config[brand].BUCKET_MAP.PRODUCT`.
- `{env}` is `prod` or `staging`.
- `{widgetised-prefix}` comes from `config[brand].localization.widgetised[language]`
  and varies per brand/locale (often `widgetised/`).
- `{slug}` is the product URL key or, for some brands, the SKU id (`2024397.json`).

The two files are written by **two independent uploads** inside the same
`transformAndUpload` request, so they can drift if either upload fails or if downstream
transformer logic is incomplete.

### Staging vs production

`admin-dashboard-be` is the only legitimate path to production JSONs. The MCP / Zeus
direct write path is **staging-only**. See `meta-repo CLAUDE.md` Gotchas section.

`page_type='pdp_rcl'` rows in the admin DB carry an `env` column (`staging` /
`prod`) that controls which bucket the publish writes to.

---

## The read path (browser → rendered HTML)

```
Browser GET https://manmatters.com/products/shilajit-gummies
    │
    │  Next.js getServerSideProps
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ storefront-web                                                       │
│   pages/products/[urlKey].tsx                                        │
│      │                                                               │
│      │  fetchSSRData([{ url: "page/mwsc/widgetised/product/" + urlKey│
│      │                  + "?expId=..." }])                           │
│      ▼                                                               │
└──────┬───────────────────────────────────────────────────────────────┘
       │ HTTPS via /proxy/* rewrite
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ middleware                                                           │
│   GET /page/mwsc/widgetised/product/:product   (cdnCache 600s)       │
│      → widgetProductPage (api/controllers/pages/widgetised-pdp.ts)   │
│                                                                      │
│   Step 1: fetchWidgetisedPDPData (parallel)                          │
│     ├─ getSingleS3Object(productUrlKey, WIDGET_PDP, brand)           │
│     │       ↑ reads {brand}-products-{env}/products/{widg}/{slug}.json│
│     ├─ getSingleS3Object("widgetised-pdp-config", DEFAULT, brand)    │
│     │       ↑ brand-level PDP config (display order, feature flags) │
│     ├─ axios.postCall(Magento)         ← live product data           │
│     ├─ getOrgData(brand)                                             │
│     ├─ aiGeneratedCustomerSayData (S3)                               │
│     ├─ walletBonusJson (S3)                                          │
│     ├─ pdpTrafficDensity                                             │
│     └─ experimentData (if expId / utm_content)                       │
│                                                                      │
│   Step 2: getPDPDisplayOrder                                         │
│     resolves which widgets render and in what order:                 │
│     [main displayOrder, gridTopLeftOrder, gridTopRightOrder]         │
│                                                                      │
│   Step 3: mapDynamicDataFromWidgets                                  │
│     walks the resolved display order, builds widget objects,         │
│     queues product-ID-fetch promises for dynamic listings            │
│                                                                      │
│   Step 4: parallel data fetch                                        │
│     getProductsData([...productIds, productId], brand) ← Magento     │
│     + dynamicProductListingsPromises                                 │
│     + insertDynamicDataForWidgetsFromAPI (ratings, qna)              │
│     + getRatingAggregateData                                         │
│                                                                      │
│   Step 5: mapDynamicProductListings                                  │
│     extracts products from listing responses                         │
│                                                                      │
│   Step 6: insertDynamicDataIntoProductPageWidgets                    │
│     final per-widget enrichment switch — see table below             │
│                                                                      │
│   Step 7: transformStructuredMetaData                                │
│     builds JSON-LD product schema, twitter cards, etc.               │
│                                                                      │
│   Step 8 (optional): omitResponseKeys for native clients             │
│     strips `breadCrumbs`, `meta` for android-native / ios-native     │
│                                                                      │
│   Returns: { meta, widgets, topLeftWidgets, topRightWidgets,         │
│              productInfo, pdpBrandConfig, ... }                      │
└──────┬───────────────────────────────────────────────────────────────┘
       │
       │  response (cached 10min at CDN via cdnCache(600))
       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ storefront-web                                                       │
│   <WidgetProductPage data={pageData.data} />                         │
│      → <AuditedWidgetizedScreen data updatesToAppConfig />           │
│         → <WidgetizedScreen page identifier pageType="product" />    │
│            → useSecondFoldPaginatedWidgets (above/below fold split)  │
│            → <WidgetRenderer widgets={widgetsToShow} />              │
│               → for each widget:                                     │
│                   Component = BASE_WIDGET_MAP[widget.type]           │
│                   <Component {...widget} />                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Key files

- Storefront PDP page (new route): `front-end-mono-repo/apps/storefront-web/src/pages/products/[urlKey].tsx`.
- Storefront PDP page (legacy route): `apps/storefront-web/src/pages/product/[urlKey].tsx`.
- Variants route: `apps/storefront-web/src/pages/product/variants/[urlKey].tsx`.
- A/B variants route: `apps/storefront-web/src/pages/product/ab-variants/[urlKey].tsx`.
- Widgetised renderer: `apps/storefront-web/src/Screens/Product/WidgetProductPage.tsx`.
- Wrapper layer: `apps/storefront-web/src/Screens/AuditedWidgetizedScreen/WidgetizedScreen.tsx`.
- Widget renderer: `apps/storefront-web/src/mono/web-core/widgets/WidgetRenderer.tsx`.
- Widget type → component map (two registries — check both):
  - `apps/storefront-web/src/mono/web-core/widgets/Widgets.Map.ts:64` (`BASE_WIDGET_MAP_TYPES`) and `:172` (`BASE_WIDGET_MAP`) — older registry (~62 widgets).
  - `apps/storefront-web/src/mono/web-core/auditedWidgets/Widget.Map.ts` — newer schema-driven registry (~112 widgets, including `TAG_MEDIA`, `PRODUCT_SUMMARY`, `PRODUCT_CALL_TO_ACTION`, `FAQ_ACCORDION`, etc.).
- Middleware routes: `middleware/api/routes/pages/index.ts:86-99` (4 PDP routes).
- Middleware controller (widgetised): `middleware/api/controllers/pages/widgetised-pdp.ts`.
- Middleware controller (legacy): `middleware/api/controllers/pages/index.ts:746` (`productDetails`).
- Middleware controller (experiments): `middleware/api/controllers/pages/experiment-pdp.ts`.
- Per-widget enrichers (middleware): `middleware/api/helpers/rcl-helpers/InsertDynamicDataIntoWidgetsHelpers/`.

### Brand propagation

Brand is set on `req.mw.middleware_brand` by middleware's hostname → brand detection
(see `docs/architecture/brand-propagation.md`). The PDP controller picks it up via
`const brand = req.mw?.middleware_brand;` and uses it for:

- S3 bucket selection (`config[brand].BUCKET_MAP.PRODUCT`)
- Currency lookup (`config[brand].CURRENCY`)
- Magento downstream calls (brand-scoped product fetch)
- Brand-level PDP config fetch (`getSingleS3Object("widgetised-pdp-config", DEFAULT, brand)`)

The downstream call to `static-service` (when used at read time, e.g. for legacy) sends
`brand` in body / header. The downstream call to Magento is brand-aware via service
config.

### Auth / personalization passed through

The widgetised controller reads from `req.query`:

| Query / header | Effect |
| -------------- | ------ |
| `client` (default `mobile-web`) | One of `mobile-web`, `desktop-web`, `android-native`, `ios-native`. Drives the display-order resolver and `omitResponseKeys` for native. |
| `repeatUser` (`"1"`/`"true"`) | Conditional widget filtering inside display-order resolver. |
| `expId` | Experiment bucket — pulled from `MWEXP` cookie or query. Causes display order + widget overrides from `experimentData`. |
| `utm_content` | Used as `contentExpId` to look up a content-experiment JSON variant from S3. |
| Header `mwappversion`, `mwappversioncode`, `mwplatform` | Native-app version context — drives client-context-aware widget visibility. |

These are bundled into `clientContext` and passed to every transformer that supports
version-gated visibility.

---

## Display order — the heart of "which widgets render"

`getPDPDisplayOrder({ ... })` returns three ordered arrays of widget IDs:

| Slot | Used for |
| ---- | -------- |
| `displayOrder` | The main vertical stack of widgets |
| `gridTopLeftOrder` | Desktop two-column layout — left column above the fold |
| `gridTopRightOrder` | Desktop two-column layout — right column above the fold |

Order resolution precedence (highest → lowest):

1. **`experimentData.widgetsData.displayOrder`** — if the request maps to a running PDP
   experiment, the experiment JSON overrides everything.
2. **Product-level `widgetsData.displayOrder`** from the per-product widgetised JSON in
   S3.
3. **Brand-level `widgetisedPdpConfig.widgetsData.displayOrder`** as fallback.

If `productData.visibility === false` (discontinued), the order is replaced entirely by
`insertDataIntoWidgetsForDiscontinuedProductPage` so the PDP shows the discontinued
state instead.

Each ID in the display order is then looked up in `widgetIDMapping`
(product-level) or `brandLevelWidgetIDMapping` (brand-level) to get the actual widget
object.

---

## Cache layers

| Layer | TTL | Set in |
| ----- | --- | ------ |
| Middleware CDN cache | 600s (10 min) | `cdnCache(600)` in `middleware/api/routes/pages/index.ts:93` |
| Static-service (none for PDP fetch — it's just S3 reads) | — | — |
| S3 (object versioning) | indefinite | bucket policy |
| Next.js `getServerSideProps` | per-request | no caching unless `swr` headers from middleware |

A stale cached PDP at the CDN layer is the most common reason a freshly-published JSON
"hasn't picked up" — invalidate the CDN entry for `/page/mwsc/widgetised/product/{slug}`
after publishing.

---

## Cross-repo invariants (don't break these)

1. **Frontends only call middleware.** Never call static-service or S3 directly from the
   storefront. Middleware is the contract surface.
2. **All PDP widget types in `widgets[]` must be registered in `BASE_WIDGET_MAP`.** An
   unknown type renders as nothing (no error). See [`widget-catalog.md`](widget-catalog.md)
   for the registered set.
3. **Per-widget enrichment lives in middleware, not the frontend.** If a widget needs a
   live API call (price, stock, reviews), add it to
   `insertDynamicDataIntoProductPageWidgets.ts` and an enricher under
   `InsertDynamicDataIntoWidgetsHelpers/`. Do not fetch from the React component.
4. **Brand is required on every S3 read and Magento call.** Never hardcode bucket names
   — always read from `config[brand].BUCKET_MAP.*`.
5. **The widgetised JSON in S3 is a derivative.** If the RCL source changes but the
   transformer wasn't re-run, the PDP will be stale. Always re-run
   `transformAndUpload` after editing RCL.
6. **Production JSON writes go through `admin-dashboard-be` only.** `admin-mcp` and the
   Zeus dev UI both refuse to write production. Bypassing this triggers the
   PreToolUse hook described in the meta-repo `CLAUDE.md`.
