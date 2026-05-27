# Narrative Index — every PDP widget by story role

A single-page index of every PDP-renderable widget, grouped by its narrative role, with
the best-fit use case and the default edit-safety class of its primary copy/asset
fields.

Read this when you want to **plan the PDP arc** ("what beats does this product need?")
before picking widget types, or when an automated skill needs a quick lookup of "what
role does X play and how safe is it to edit?"

Conventions: see [`widgets/_conventions.md`](widgets/_conventions.md).

---

## 🎯 HERO — first impression, identity, baseline trust

The opening beat of the page. Establishes *what* the product is, *what it costs*, and
*why someone might want it* — all within first scroll.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`PRODUCT_SUMMARY`](widgets/PRODUCT_SUMMARY.md) | The buy-box. Name + price + discount + rating + key highlights. **Every PDP has exactly one.** | 🟡 (prices, name, claims are sensitive; subtitle / highlights are 🟢) |
| [`EXPANDED_MEDIA`](widgets/EXPANDED_MEDIA.md) | Full-bleed product image / video gallery — the hero visual. | 🟡 (image URLs sensitive when they show legal-mandated packaging; alt text 🟢) |
| [`CAROUSEL_WITH_THUMBNAIL`](widgets/CAROUSEL_WITH_THUMBNAIL.md) | Legacy gallery variant with thumb-strip. Same hero job as `EXPANDED_MEDIA`. | 🟡 |
| [`BANNER`](widgets/BANNER.md) (above-fold) | First-fold promo / brand banner. Tells "this brand stands for X". | 🟢 for marketing creatives; 🟡 if the banner asserts a claim |
| [`PRODUCT_CARD_SLIDER`](widgets/PRODUCT_CARD_SLIDER.md) (alt) | Brand range entry-point on category-hub PDPs. Doubles as EXPAND. | 🟡 |

---

## 🛒 COMMIT — the conversion moment

Where intent → action. Always the most-visible widget on the page; usually appears
inline near the hero **and** as a sticky footer.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`PRODUCT_CALL_TO_ACTION`](widgets/PRODUCT_CALL_TO_ACTION.md) | The standard ATC + Buy-Now block. Inline or sticky, configurable per page. | 🟡 (CTA labels are 🟢; productInfo is 🟡 — live-injected; SKU is 🔴) |
| [`PRODUCT_FOOTER_STICKY`](widgets/PRODUCT_FOOTER_STICKY.md) | Rich sticky footer when the page needs more than ATC + Buy-Now (Notify Me, QD, repeat-user nudges). | 🟡 |
| [`STICKY_CTA_BUTTON`](widgets/STICKY_CTA_BUTTON.md) | Non-ATC sticky button — "Take quiz", "Consult". For when the page primary action *isn't* purchase. | 🟢 label; 🔴 action wiring |

---

## ⚙️ CALIBRATE — tailor to this user

The widgets that let the user say "I want the X version, not Y." Most PDPs have one or
two — variant pick + subscription frequency.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`PRODUCT_SWITCHES`](widgets/PRODUCT_SWITCHES.md) | Variant selector — size / quantity / flavour. Each option is a sibling SKU. | 🟡 (variant labels 🟢; SKU 🔴; price 🟡) |
| [`PRODUCT_SUBSCRIPTION`](widgets/PRODUCT_SUBSCRIPTION.md) | "Subscribe & save" recurring-order picker. | 🟡 (`discountPercent` is sensitive; copy 🟢) |
| [`PRODUCT_SWITCHER`](widgets/PRODUCT_SWITCHER.md) | Cross-product nav row — "shop the range" / "for related goals". Sometimes plays a HERO/CALIBRATE hybrid role. | 🟡 |

---

## 🏅 PROOF — social validation

External voices. Customers, ratings, third-party reviews. Most pages have **at least
one** PROOF widget between hero and FAQ.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`RATINGS_AND_REVIEWS`](widgets/RATINGS_AND_REVIEWS.md) | Star rating + top reviews + "read all reviews" CTA. The standard PROOF widget. | 🟡 (ratings, review counts, `verified` are sensitive; AI summary is 🟡) |
| [`TESTIMONIALS`](widgets/TESTIMONIALS.md) | Influencer / expert testimonials with photos and quotes. | 🟡 (testimonial copy, `verified` 🟡; styling 🟢) |
| [`PRODUCT_TESTIMONIALS`](widgets/PRODUCT_TESTIMONIALS.md) | Testimonials that also link to other products — for multi-product PDPs. | 🟡 |
| [`SOCIAL_REVIEW_LIST`](widgets/SOCIAL_REVIEW_LIST.md) | Instagram-style UGC review feed. | 🟡 |
| [`PRODUCT_REVIEW_CARD`](widgets/PRODUCT_REVIEW_CARD.md) | Single-product review carousel. Tighter than `RATINGS_AND_REVIEWS`. | 🟡 |
| [`REVIEW_IMAGE_SLIDER`](widgets/REVIEW_IMAGE_SLIDER.md) | Customer photo strip — "real photos from customers". | 🟡 (`verified` 🟡; rating numbers 🟡) |

---

## 🧪 EVIDENCE — brand-asserted proof, data, comparison

The widgets that say "here's *why* you should believe us" — clinical numbers,
ingredient claims, vs-competition tables. Distinct from PROOF in that the brand is the
voice, not the customer.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`STATS_TILES_WITH_DESCRIPTION`](widgets/STATS_TILES_WITH_DESCRIPTION.md) | "92% saw results in 8 weeks" — stat tiles + a body paragraph + a footnote. Most likely to need regulatory review. | 🟡 across the board; `footnote` is 🟡 (legal attribution). |
| [`COMPARISON_TABLE`](widgets/COMPARISON_TABLE.md) | "Us vs them" feature grid. Highly persuasive but legally sensitive. | 🟡 (every cell is a comparative claim) |
| [`HOW_WE_COMPARE`](widgets/HOW_WE_COMPARE.md) | Deprecated 2-column variant of `COMPARISON_TABLE`. Same sensitivity. | 🟡 |
| [`BENEFITS_HIGHLIGHTS`](widgets/BENEFITS_HIGHLIGHTS.md) | Bulleted list of benefits / claims. Each line is a brand claim. | 🟡 (especially the verb — "helps" / "boosts" / "cures" matters legally) |
| [`INFORMATION_GRID_STRIP`](widgets/INFORMATION_GRID_STRIP.md) | Trust-marker strip ("Vegan", "FSSAI-approved", "Lab-tested"). | 🟡 (regulatory marks are sensitive; icon URLs 🟢) |
| [`INFO_TILE_CARD`](widgets/INFO_TILE_CARD.md) | "Why us" tile-grid with gradient. | 🟡 |
| [`NARRATIVE_AND_FACTS`](widgets/NARRATIVE_AND_FACTS.md) (data-led variant) | When the section is data-driven — facts dominate over narrative. | 🟡 |

---

## 🎞 SHOWCASE — visual exploration of features / ingredients / use

The widgets you'd skip past on quick scroll but linger on if buying intent is high.
Picture-driven content.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`MEDIA_SLIDER`](widgets/MEDIA_SLIDER.md) | Generic horizontal slider of images / videos. Used for ingredient strips, lifestyle imagery. | 🟢 (image URLs 🟢; alt text 🟢; per-slide CTAs 🟢) |
| [`MEDIA_WITH_HEADER_SLIDER`](widgets/MEDIA_WITH_HEADER_SLIDER.md) | Each slide has a title + subtitle above the media — for "how it works" steps. | 🟢 |
| [`MEDIA_WITH_FOOTER_SLIDER`](widgets/MEDIA_WITH_FOOTER_SLIDER.md) | Same as above but text below the media; supports zoom modal. | 🟢 |
| [`MEDIA_CAROUSEL`](widgets/MEDIA_CAROUSEL.md) | More configurable carousel — when the simpler `MEDIA_SLIDER` runs out of knobs. | 🟢 |
| [`REELS_SLIDER`](widgets/REELS_SLIDER.md) | Vertical-video reels. Tap → fullscreen player. | 🟡 (video content potentially contains claims) |
| [`YOUTUBE_CAROUSEL`](widgets/YOUTUBE_CAROUSEL.md) | Doctor explainers / expert video roundup. | 🟡 (`videoId` is 🔴; titles 🟢) |

---

## 📖 STORY — brand narrative, "why we made this"

When the brand voice itself is the value. Used heaviest on premium / lifestyle brands.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`MEDIA_TEXT_BLOCK`](widgets/MEDIA_TEXT_BLOCK.md) | Side-by-side hero media + paragraph. The "about this product" beat. | 🟢 body copy; 🟡 if the paragraph contains claims |
| [`NARRATIVE_AND_FACTS`](widgets/NARRATIVE_AND_FACTS.md) (story-led) | LJ "Sugar narrative" — story-led intro with mascot. | 🟢 narrative; 🟡 facts |
| [`USAGE_AND_TESTIMONIAL`](widgets/USAGE_AND_TESTIMONIAL.md) | Combined how-to-use + voice quote. | 🟢 voice; 🟡 dosage/timing instructions |

---

## ❓ OBJECTION — addresses the doubt in their head

The "I have a question" widgets. Pre-empts the unanswered question that would
otherwise drive bouncing.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`FAQ_ACCORDION`](widgets/FAQ_ACCORDION.md) | Branded FAQ — pre-baked Q&A. JSON-LD-eligible. | 🟢 questions and answers (when not making new claims); 🟡 when the answer asserts a claim ("does this cure X?") |
| [`QNA`](widgets/QNA.md) | Customer-driven Q&A — questions asked by users, answered by experts. | 🟡 (`answeredBy` is 🟡; question/answer copy 🟢) |
| [`ACCORDION`](widgets/ACCORDION.md) | Generic collapsible content blocks — "Additional information", "Storage", "Things to note". | 🟢 mostly; 🟡 if discussing storage / safety |
| [`ACCORDION_WITH_SHOW_MORE`](widgets/ACCORDION_WITH_SHOW_MORE.md) | Per-card show-more for rich content — "Key ingredients" with images. | 🟡 (ingredient claims are sensitive) |
| [`PRODUCT_DETAILS_TILE`](widgets/PRODUCT_DETAILS_TILE.md) | Multi-tile drop-down with show-more / show-less. | 🟡 |

---

## 📦 LOGISTICS — make the abstract concrete

Delivery date, payment splits, location. The widgets that say "you can actually have
this, here's how it'll happen."

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`CHECK_DELIVERY_INFO`](widgets/CHECK_DELIVERY_INFO.md) | Pincode → delivery date. The QD / standard delivery promise. | 🟡 (delivery date copy is a commitment) |
| [`PINCODE_BOX`](widgets/PINCODE_BOX.md) | Standalone pincode input. Often paired with `CHECK_DELIVERY_INFO`. | 🟡 |
| [`INSTALLMENT_OPTIONS`](widgets/INSTALLMENT_OPTIONS.md) | EMI / BNPL math. Live-injected by middleware. | 🟡 across the board (financial copy) |
| [`TABBY_PROMO`](widgets/TABBY_PROMO.md) | UAE "split into 4 payments" SDK promo. | 🟡 |

---

## 💸 NUDGE — monetary or behavioural prompt

The "act now" / "you have benefits" widgets. Heavily personalised by middleware.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`BANNER`](widgets/BANNER.md) (mid-page) | Promo banner — "Diwali sale", "Free gift with cart > ₹999". | 🟢 marketing creative; 🟡 if it asserts a discount % |
| [`CALLOUT_WITH_IMAGE`](widgets/CALLOUT_WITH_IMAGE.md) | Inline strip nudge — "Free delivery on orders > ₹999". | 🟢; 🟡 if it states a guarantee |
| [`CALL_TO_ACTION`](widgets/CALL_TO_ACTION.md) | Non-ATC CTA — "Take the quiz", "Refer a friend", "Consult a doctor". | 🟢 labels |
| [`OFFER_NUDGE_CARD`](widgets/OFFER_NUDGE_CARD.md) | Wallet / coupon nudge banner. Middleware sets `shouldShow`. | 🟡 (offer copy is commercial) |
| [`OFFER_COUPON_CARD`](widgets/OFFER_COUPON_CARD.md) | Tap-to-copy coupon code card. | 🟡 (`couponCode` is 🔴 — never auto-rewrite the code itself) |
| [`AFFILIATE_CARD`](widgets/AFFILIATE_CARD.md) | Affiliate "share & earn" card — affiliates only. | 🟡 |
| [`WALLET_BANNER_CTA`](widgets/WALLET_BANNER_CTA.md) | Wallet balance / use-credits banner. | 🟡 (amounts) |
| [`STATUS_CARD`](widgets/STATUS_CARD.md) | "Item in your cart" / contextual alert. | 🟢 |

---

## 🔭 EXPAND — adjacent products / cart expansion

The "you might also want" widgets. Bigger cart, better LTV.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`MULTI_PRODUCT_SELECTOR`](widgets/MULTI_PRODUCT_SELECTOR.md) | Frequently Bought Together — multi-product picker that adds the whole bundle in one click. | 🟡 (bundle pricing is sensitive; copy 🟢) |
| [`PRODUCT_KIT_INFO`](widgets/PRODUCT_KIT_INFO.md) | "What's in the kit" — kit/bundle product contents reveal. Plays a HERO/EXPAND hybrid for kit products. | 🟡 (kit item prices 🟡; copy 🟢; SKU 🔴) |
| [`PRODUCT_CARD_SLIDER`](widgets/PRODUCT_CARD_SLIDER.md) | "Related / explore range" slider. | 🟡 (product prices 🟡; SKUs/urlKeys 🔴; titles 🟢) |
| [`PRODUCT_CARD_GRID`](widgets/PRODUCT_CARD_GRID.md) | Grid variant of the above for "shop the collection" sections. | 🟡 |
| [`RECENTLY_VIEWED_PRODUCT_CARD_SLIDER`](widgets/RECENTLY_VIEWED_PRODUCT_CARD_SLIDER.md) | Personalised "you viewed" trail. Empty payload — content from user history. | 🟢 (only configuration) |
| [`RECENTLY_VIEWED_CATALOG_CARDS`](widgets/RECENTLY_VIEWED_CATALOG_CARDS.md) | Grid variant of the above. | 🟢 |

---

## 🧭 ANCHOR — site context, navigation, SEO

Utility widgets that anchor the page in the catalogue / give search engines structure.

| Widget | Best use case | Default copy safety |
| ------ | ------------- | ------------------- |
| [`BREAD_CRUMBS`](widgets/BREAD_CRUMBS.md) | The trail: Home › Category › Product. Drives JSON-LD `BreadcrumbList`. | 🔴 (URLs and category names are structural — they affect SEO and crawlability) |
| [`TAG_MEDIA`](widgets/TAG_MEDIA.md) | Brand-mark / logotype image at the top of the page (navbar decoration). Brand identity, not marketing creative. | 🟡 (brand asset) |
| [`TEXT_CONTAINER`](widgets/TEXT_CONTAINER.md) | Long-form SEO body / fine-print disclaimer. | 🟢 SEO body; 🟡 disclaimers and legal text |
| [`INFO_LIST_WITH_ICONS`](widgets/INFO_LIST_WITH_ICONS.md) | Numbered "how to use" steps. ANCHOR / OBJECTION hybrid. | 🟡 (dosage / timing instructions are sensitive) |
| [`CUSTOM_COMPONENT`](widgets/CUSTOM_COMPONENT.md) | Escape hatch for one-off layouts. | 🔴 (the node tree is structural — no automated editing) |

---

## How to use this index

**Planning a new PDP**: walk the table top-to-bottom (HERO → ANCHOR) and choose
the minimum set of widgets that tells the story. Most products need 8–12 widgets
spanning 7–8 narrative roles.

**Auditing an existing PDP**: pull the widget list (`mcp__admin-mcp__get_pdp_summary`)
and group each widget by its narrative code from this index. Missing roles often
indicate where the page underperforms — e.g. a PDP with no LOGISTICS may have a
delivery-anxiety drop-off.

**Routing an automated copy edit**: a skill receives "rewrite the FAQ for warmer tone"
→ looks up `FAQ_ACCORDION` in this index → confirms narrative role is OBJECTION →
checks the per-widget spec for the AI-safe field list (questions + answers when not
claim-bearing) → stages the edit.

**Cross-brand consistency**: this index is brand-agnostic. A widget plays the same
narrative role on Bodywise as on Man Matters. Brand-specific narrative *order* and
*emphasis* differ — see [`pipeline.md`](pipeline.md) for layout patterns.
