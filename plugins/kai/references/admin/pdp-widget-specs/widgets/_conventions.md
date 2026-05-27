# Widget Conventions — Narrative Coding & Edit Safety

This doc defines the two cross-cutting annotation systems used in every per-widget
spec:

1. **Narrative coding** — what *role* each widget plays in the PDP user story.
2. **Edit-safety classification** — per field, what an automated agent (skill, MCP tool,
   marketing-ops bot) is allowed to rewrite without operator review.

When a per-widget spec references "narrative role" or shows an "Edit" column in a
field table, the values come from this doc.

---

## Part 1 — Narrative coding

Every PDP is a story arc told through widgets. Each widget plays a beat. Narrative
coding labels that beat so:

- Marketers can plan layouts at the "beats" level instead of the widget-types level
- A/B-test designers can swap widgets in the same role without rewriting the page
- Automated content tools know the *intent* of a widget before they touch its copy

### The 12 narrative codes

| Code | Narrative role | Mental model | Examples on a typical PDP |
| ---- | -------------- | ------------ | ------------------------- |
| **HERO** | Hero pitch / first impression | "This is what you're looking at" — establishes identity, value, baseline trust | `PRODUCT_SUMMARY`, `EXPANDED_MEDIA`, `CAROUSEL_WITH_THUMBNAIL`, hero `BANNER` |
| **COMMIT** | Conversion / purchase moment | "Make the decision now" — turns intent into a cart line | `PRODUCT_CALL_TO_ACTION`, `PRODUCT_FOOTER_STICKY`, `STICKY_CTA_BUTTON` |
| **CALIBRATE** | Tailor to the user | "Pick the version that fits you" — variant / quantity / frequency choice | `PRODUCT_SWITCHES`, `PRODUCT_SUBSCRIPTION`, `PRODUCT_SWITCHER` (range) |
| **PROOF** | Social / scientific validation | "Other people / experiments back this up" — third-party voice | `RATINGS_AND_REVIEWS`, `TESTIMONIALS`, `PRODUCT_TESTIMONIALS`, `SOCIAL_REVIEW_LIST`, `PRODUCT_REVIEW_CARD`, `REVIEW_IMAGE_SLIDER`, `STATS_TILES_WITH_DESCRIPTION` |
| **EVIDENCE** | Brand-asserted proof | "Here's the data behind our claim" — clinical, regulatory, brand-stated facts | `STATS_TILES_WITH_DESCRIPTION` (when clinical), `NARRATIVE_AND_FACTS`, `COMPARISON_TABLE`, `HOW_WE_COMPARE`, `INFORMATION_GRID_STRIP` (trust markers), `BENEFITS_HIGHLIGHTS` (claims) |
| **SHOWCASE** | Visual product / feature exposition | "Here's what's interesting to look at" — ingredient strips, lifestyle imagery | `MEDIA_SLIDER`, `MEDIA_WITH_HEADER_SLIDER`, `MEDIA_WITH_FOOTER_SLIDER`, `MEDIA_CAROUSEL`, `REELS_SLIDER`, `YOUTUBE_CAROUSEL` |
| **STORY** | Brand narrative / "why we made this" | "Our voice telling the why" — emotional hook, not data | `MEDIA_TEXT_BLOCK`, `NARRATIVE_AND_FACTS` (when narrative-led), `USAGE_AND_TESTIMONIAL` |
| **OBJECTION** | Addresses unanswered doubt | "Here's the answer to the question in your head" — pre-empts friction | `FAQ_ACCORDION`, `QNA`, `ACCORDION` (additional info), `ACCORDION_WITH_SHOW_MORE` (ingredients), `PRODUCT_DETAILS_TILE` |
| **LOGISTICS** | Make abstract concrete | "It will arrive on Tuesday. You can afford it." — fulfilment + payment certainty | `CHECK_DELIVERY_INFO`, `PINCODE_BOX`, `INSTALLMENT_OPTIONS`, `TABBY_PROMO` |
| **NUDGE** | Monetary or behavioural prompt | "There's a reason to act differently / faster" | `BANNER` (promo), `CALLOUT_WITH_IMAGE`, `CALL_TO_ACTION` (non-ATC), `OFFER_NUDGE_CARD`, `OFFER_COUPON_CARD`, `AFFILIATE_CARD`, `WALLET_BANNER_CTA`, `STATUS_CARD` |
| **EXPAND** | Adjacent exploration | "Also look at these" — broadens cart or revisit | `MULTI_PRODUCT_SELECTOR` (FBT), `PRODUCT_KIT_INFO`, `PRODUCT_CARD_SLIDER`, `PRODUCT_CARD_GRID`, `RECENTLY_VIEWED_PRODUCT_CARD_SLIDER`, `RECENTLY_VIEWED_CATALOG_CARDS` |
| **ANCHOR** | Site context / SEO / nav | "Where am I, where can I go" — utility content | `BREAD_CRUMBS`, `TEXT_CONTAINER` (SEO body), `INFO_LIST_WITH_ICONS` (how-to-use steps), `INFO_TILE_CARD` (process), `CUSTOM_COMPONENT` (catch-all) |

### How to apply the codes

Each widget spec has a one-line **Narrative role** at the top:

```
**Narrative role:** PROOF — top-3 user reviews + aggregate rating; the social-proof beat between hero and FAQ.
```

A single widget can play **two roles** in different placements. Examples:

- `BANNER` is `HERO` above the fold and `NUDGE` mid-page.
- `STATS_TILES_WITH_DESCRIPTION` is `PROOF` when sourced from third-party clinical data, `EVIDENCE` when brand-stated.

When a widget can play multiple roles, the spec lists the primary one and notes the
alternates.

### How to use this for layout planning

A well-formed PDP has a roughly canonical narrative arc:

```
ANCHOR (breadcrumbs)
HERO (product summary + gallery)
CALIBRATE (variants, subscription)
COMMIT (ATC)
PROOF (rating, reviews above)
EVIDENCE (key claims / benefits / comparison)
SHOWCASE (ingredients, how it works, doctor video)
STORY (brand narrative)
OBJECTION (FAQs, Q&A, additional info accordions)
LOGISTICS (delivery, EMI)
EXPAND (FBT, related products, recently viewed)
NUDGE (offers, wallet)
COMMIT (sticky footer, persists)
ANCHOR (SEO body text, footer breadcrumbs)
```

This is a *guideline*, not a hard order. Some brands lead with EVIDENCE (clinical
brands), some with STORY (premium lifestyle brands), some interleave more PROOF
between sections. The display-order resolver in middleware doesn't enforce the arc —
it executes whatever order the admin authored. Use the narrative codes to plan the arc
before authoring the order.

---

## Part 2 — Edit-safety classification

Every field in a widget's `widgetData` falls into one of three classes. Skills,
agents, and ops tools must check the class before mutating a field.

### The three classes

| Class | Meaning | Examples |
| ----- | ------- | -------- |
| 🟢 **AI-safe** | Cosmetic copy and asset URLs an automated tool can rewrite freely without operator review. Mistakes are bounded to "the wording sounds off". | Headings, subtitles, body copy, alt text, CTA labels (when not regulated), decorative icon URLs, banner image URLs (marketing assets), placeholder text, button copy. |
| 🟡 **Sensitive** | Fields with **commercial, regulatory, or trust implications**. An automated tool may *propose* an edit but must flag it for operator review before write. Mistakes can mislead customers or trigger compliance issues. | Prices (`actualPrice`, `discountedPrice`, `discountText`), regulatory copy ("FSSAI-approved", "third-party tested", "clinically proven"), claim verbs ("cures", "treats", "guarantees"), `verified` flags on testimonials, `outOfStock` flags, ratings (numeric), rating counts, coupon codes (`couponCode`), wallet amounts, EMI / installment numbers, `discountPercent`, expert / doctor names, study footnotes (`n=120, 8-week study`), product names, SKUs as displayed (vs SKUs as identifiers — see Structural), legal disclaimers, T&C copy, brand promises ("free returns", "money-back guarantee"). |
| 🔴 **Structural** | Fields that wire the widget into the platform. Touching them breaks rendering, routing, analytics, or integrations. **Never rewrite. Only an engineer should change these.** | `id`, `type`, `sku` (as identifier), `urlKey`, `slug`, `productHandle`, `productId`, action wiring (`action`, `actionName`, `actions[]`, `actionData`), URL paths in `NAVIGATE` actions, `endpointData.url` / `.method`, widget references in `SCROLL_TO_WIDGET`, `videoId` on YouTube widgets, all `*Id`, all internal `key` / `name` fields, `triggerEvent` analytics names, brand-config keys, `widgetIDMapping` keys, display-order references, `pageHandle`. |

### How edit-safety annotations appear in widget specs

Every field table gains a **🟢/🟡/🔴 Edit** column:

```
| Field           | Type    | Required | Edit | Notes                          |
| --------------- | ------- | -------- | ---- | ------------------------------ |
| productSummary.name | string | yes | 🟡 | Product name. Sensitive — branded claim. |
| productSummary.discountedPrice | number | yes | 🟡 | Live-injected; rewriting it is a pricing event. |
| productSummary.subtitle | string | yes | 🟢 | "60 capsules · 30-day supply" — safe to rewrite. |
| id              | string | yes | 🔴 | Page-unique. Never change. |
```

Fields nested deeper than one level get the strictest class of any of their
sub-fields. When in doubt, the widget spec lists the safety class per sub-field.

### Decision tree for an automated tool

```
Tool wants to edit field F on widget W.
│
├─ Look up F in W's spec.
│
├─ F is 🟢 AI-safe?
│   → Write directly. Log the change for audit.
│
├─ F is 🟡 Sensitive?
│   → Stage a proposed edit. Show diff + reason to a human operator.
│     Wait for explicit approval. Only then write.
│     Special case: prices, claims, regulatory copy require legal/marketing sign-off in
│     addition to operator approval.
│
├─ F is 🔴 Structural?
│   → Refuse to edit. Tell the user this requires engineer change.
│     Don't try to "be helpful" by inferring a safe replacement.
│
└─ F not in spec?
    → Default to 🔴 Structural. Refuse. File a doc-drift issue.
```

### Why three classes and not two

A binary safe/unsafe distinction collapses two genuinely different risk profiles:

- "I rewrote the FAQ heading" — recoverable, low-stakes; should be allowed.
- "I rewrote the discount percentage" — money on the line; should be reviewed.
- "I rewrote the SKU" — kills the page; should never happen.

Three classes give automated tools a clear escalation ladder.

### What an operator approval looks like (for 🟡 fields)

When a skill stages a 🟡 edit, it should show the operator:

1. The current value.
2. The proposed value.
3. The narrative role of the widget (from Part 1 above).
4. The reason the skill thinks the edit is correct (e.g. "Magento price changed to X").
5. The blast radius (which products / pages share this widget's data).

The operator approves with one click; the change goes through the normal Zeus
publish flow and is logged.

### Brand-specific overrides

A brand may opt to **tighten** a class — e.g. an Ayurvedic brand may treat all body
copy as 🟡 because all health claims need legal sign-off in their jurisdiction. A
brand may not **loosen** a class — 🔴 is universal.

Tightening lives in brand-level config, not per-widget config.

---

## Cross-reference

- The full PDP narrative-coding index of every widget is in
  [`../narrative-index.md`](../narrative-index.md).
- The widget catalog with PDP-relevance markers is in
  [`../widget-catalog.md`](../widget-catalog.md).
- Each per-widget spec under `widgets/` carries:
  - One **Narrative role** line near the top.
  - An **Edit** column in its field table.
  - Any brand-specific narrative or edit-safety overrides in the Gotchas section.
