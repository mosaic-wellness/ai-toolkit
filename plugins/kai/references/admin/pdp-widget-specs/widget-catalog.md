# Widget Catalog — every widget that can appear in a PDP

This is the master table of every widget type the platform knows about. The "PDP"
column marks each widget as one of:

- **✓** — verified in production PDP JSONs or wired up in the middleware PDP enricher
- **○** — supported by the frontend `BASE_WIDGET_MAP` (renderable on a PDP, but mostly
  used on other surfaces today)
- **—** — not PDP-relevant (lives on landing pages, widget pages, referral pages, etc.)

Catalog source: `mcp__admin-mcp__list_widget_types` (catalog generated 2026-03-04). 122 widget
types + 41 action types. Frontend cross-reference: **two** widget registries (see
below). Middleware enricher cross-reference:
`middleware/api/helpers/rcl-helpers/insertDynamicDataIntoProductPageWidgets.ts`.

> **Two frontend widget registries exist** and a widget can live in either one — or
> both. When auditing whether a widget type is renderable, **check both files**:
>
> 1. **`apps/storefront-web/src/mono/web-core/widgets/Widgets.Map.ts`** — `BASE_WIDGET_MAP`
>    (~62 entries). The older registry — used heavily by widget pages and landing pages.
>    Devices-targeted aliases (`MOBILE_BANNER`, `DESKTOP_BANNER`) live here.
> 2. **`apps/storefront-web/src/mono/web-core/auditedWidgets/Widget.Map.ts`** — the
>    "audited" registry (~112 entries). The newer schema-driven registry. Most widgets
>    in the admin-mcp catalog (including `PRODUCT_SUMMARY`, `PRODUCT_CALL_TO_ACTION`,
>    `FAQ_ACCORDION`, `TAG_MEDIA`, all the new schema-driven types) live here. Each
>    widget directory has `*.interface.ts` + `*Container.tsx` + `*.spec.tsx` —
>    "audited" means it's covered by schema generation and tests.
>
> When the admin-mcp `get_widget_schema` response shows
> `x-sourceFiles` containing `auditedWidgets/`, that widget renders via the audited
> registry. When it points to `widgets/`, it renders via `BASE_WIDGET_MAP`. The
> `WidgetRenderer` dispatches to whichever registry knows the type.

> **Reading note:** every widget has the shape `{ id, type, header?, layout?, widgetData }`.
> `id`, `type`, and `widgetData` are always required. `header` and `layout` are supported
> by every widget but optional. The widget-specific config lives entirely in `widgetData`.

---

## Master table

| Type | PDP | widgetData fields | Spec |
| ---- | --- | ----------------- | ---- |
| `ACCESS_REQUEST` | — | `items`, `title` | — |
| `ACCORDION` | ✓ | `iconVariant`, `isInitiallyOpen`, `list`, `source`, `titleFontWeight`, `triggerEvent` | [widgets/ACCORDION.md](widgets/ACCORDION.md) |
| `ACCORDION_HEADER` | ○ | `items`, `title` | — |
| `ACCORDION_WITH_BACKGROUND` | ○ | `footerData`, `footerImage`, `sectionData`, `titleImageDesktop`, `titleImageMobile` | — |
| `ACCORDION_WITH_SHOW_MORE` | ✓ | `decorationIcons`, `items` | [widgets/ACCORDION_WITH_SHOW_MORE.md](widgets/ACCORDION_WITH_SHOW_MORE.md) |
| `AFFILIATE_CARD` | ✓ | `affiliateUser`, `color`, `copied`, `cta`, `isFullCardClickable`, `isLoading`, `media`, `membershipPassNudge`, `preTitle`, `productInfo`, `shouldShow`, `showAffiliateCard`, `showWalletNudgeNew`, `subtitle`, `tag`, `title`, `urlKey` | [widgets/AFFILIATE_CARD.md](widgets/AFFILIATE_CARD.md) |
| `APP_PROMO_CARD` | ○ | `cta`, `downloadText`, `items`, `textColor` | — |
| `ATHENA_PRODUCT_CARD_SLIDER` | ○ | `enableQuantityIndicator`, `isMobile`, `pillSectionConfig`, `productImageAspectRatio`, `products`, `searchBarConfig`, `searchResultConfig`, `sliderConfig`, `source` | — |
| `BANNER` | ✓ | `aspectRatio`, `cta`, `media`, `removePadding`, `slug` | [widgets/BANNER.md](widgets/BANNER.md) |
| `BENEFITS_HIGHLIGHTS` | ✓ | `items` | [widgets/BENEFITS_HIGHLIGHTS.md](widgets/BENEFITS_HIGHLIGHTS.md) |
| `BREAD_CRUMBS` | ✓ | `category`, `iconColor`, `options` | [widgets/BREAD_CRUMBS.md](widgets/BREAD_CRUMBS.md) |
| `BRICK_SECTION` | ○ | `aspectRatio`, `cta`, `description`, `heading`, `items`, `media`, `mediaConfig`, `shouldShowGap`, `textField`, `title`, `variant` | — |
| `BUTTON` | ○ | `actions`, `fullWidth`, `isDisabled`, `isLoading`, `label`, `leftAccessory`, `rightAccessory`, `showShimmer`, `size`, `testId`, `variant` | — |
| `CALLOUT_WITH_IMAGE` | ✓ | `altText`, `image`, `text`, `variant` | [widgets/CALLOUT_WITH_IMAGE.md](widgets/CALLOUT_WITH_IMAGE.md) |
| `CALL_TO_ACTION` | ✓ | `direction`, `isArrowAnimatedButton`, `isSticky`, `isStickyFooter`, `items`, `source`, `stickyFooterVariant` | [widgets/CALL_TO_ACTION.md](widgets/CALL_TO_ACTION.md) |
| `CAROUSEL_WITH_THUMBNAIL` | ✓ | (see schema — empty top-level fields, deep nested) | [widgets/CAROUSEL_WITH_THUMBNAIL.md](widgets/CAROUSEL_WITH_THUMBNAIL.md) |
| `CATALOG_CARDS` | ○ | `products`, `sliderConfig` | — |
| `CATEGORY_CARD_GRID` | — | `aspectRatio`, `items` | — |
| `CATEGORY_FILTERS` | — | `chipListProps`, `chipVariant` | — |
| `CHECK_DELIVERY_INFO` | ✓ | `animationConfig`, `checkDeliveryDateSectionData`, `commitmentType`, `cta`, `desc`, `descImage`, `editLocationConfig`, `isQuickDeliveryEligible`, `pincode`, `pincodeBoxData`, `productInfo`, `qddData`, `setLocationConfig`, `subTitle`, `title` | [widgets/CHECK_DELIVERY_INFO.md](widgets/CHECK_DELIVERY_INFO.md) |
| `COMPARISON_TABLE` | ✓ | `icons`, `items`, `tableHeader` | [widgets/COMPARISON_TABLE.md](widgets/COMPARISON_TABLE.md) |
| `CONTACT_LIST` | — | many (referrals) | — |
| `CONTENT_CARD` | ○ | `animationData`, `cta`, `subTitle`, `title` | — |
| `CUSTOM_COMPONENT` | ✓ | `nodes`, `style` | [widgets/CUSTOM_COMPONENT.md](widgets/CUSTOM_COMPONENT.md) |
| `EARNINGS_TRACKER` | — | (referrals) | — |
| `EXPANDED_MEDIA` | ✓ | `discontinuedProductOverlayText`, `id`, `items`, `previewModal`, `productInfo`, `productOSSOverlayText`, `showShareButton`, `sliderConfig` | [widgets/EXPANDED_MEDIA.md](widgets/EXPANDED_MEDIA.md) |
| `EXTERNAL_IFRAME` | ○ | `allow`, `allowFullScreen`, `aspectRatio`, `height`, `keepObserving`, `name`, `referrerPolicy`, `rootMargin`, `sandbox`, `src`, `srcDoc`, `threshold`, `title`, `width` | — |
| `FAQ_ACCORDION` | ✓ | `accordionItems`, `faqLabel`, `faqText` | [widgets/FAQ_ACCORDION.md](widgets/FAQ_ACCORDION.md) |
| `FEATURE_CARD_SLIDER_WITH_IMAGE_MODAL` | ○ | `items`, `sliderConfig`, `zoomHintText` | — |
| `FEATURE_CARD_SLIDER_WITH_TEXT` | ○ | `items`, `sliderConfig` | — |
| `FLOATING_ACTION_BUTTON` | ○ | `actions`, `height`, `label`, `media`, `position`, `width`, `zIndex` | — |
| `HEADER_WITH_ACTION` | ○ | `buttonType`, `cta`, `genericActions`, `headerTitle`, `icon` | — |
| `HORIZONTAL_PRODUCT_CARD_GRID` | ○ | many | — |
| `HOW_WE_COMPARE` | ✓ | `happy`, `rowTitle`, `rows`, `sad`, `title` | [widgets/HOW_WE_COMPARE.md](widgets/HOW_WE_COMPARE.md) |
| `IMAGE_CTA_GRID` | ○ | (deep nested) | — |
| `INFORMATION_GRID_STRIP` | ✓ | `category`, `items` | [widgets/INFORMATION_GRID_STRIP.md](widgets/INFORMATION_GRID_STRIP.md) |
| `INFO_CARDS` | ○ | `items`, `sliderConfig` | — |
| `INFO_LIST_WITH_ICONS` | ✓ | `list`, `showSerialNumber` | [widgets/INFO_LIST_WITH_ICONS.md](widgets/INFO_LIST_WITH_ICONS.md) |
| `INFO_STRIP` | ○ | `backgroundColor`, `image`, `text`, `textColor` | — |
| `INFO_TABS` | ○ | `items` | — |
| `INFO_TILE_CARD` | ✓ | `bannerGradient`, `heading`, `items` | [widgets/INFO_TILE_CARD.md](widgets/INFO_TILE_CARD.md) |
| `INSTALLMENT_OPTIONS` | ✓ | `installMentOptionType`, `isPayLater`, `price`, `snapmintPayOnSalaryWidget`, `widgetContent` | [widgets/INSTALLMENT_OPTIONS.md](widgets/INSTALLMENT_OPTIONS.md) |
| `KEY_METRIC_DISPLAY` | ○ | `items` | — |
| `MARQUEE` | ○ | `items` | — |
| `MARQUEE_WITH_SCROLL` | ○ | `imageHeight`, `imageWidth`, `marqueeBackground`, `marqueeTagBackground`, `marqueeTags`, `showBorder` | — |
| `MEDIA_BACKGROUND_WITH_CTA` | ○ | many | — |
| `MEDIA_CAROUSEL` | ✓ | `items`, `carouselConfig` | [widgets/MEDIA_CAROUSEL.md](widgets/MEDIA_CAROUSEL.md) |
| `MEDIA_GRID` | ○ | many | — |
| `MEDIA_LABELED_SLIDER` | ○ | `items`, `sliderConfig` | — |
| `MEDIA_SLIDER` | ✓ | (rich schema — see spec) | [widgets/MEDIA_SLIDER.md](widgets/MEDIA_SLIDER.md) |
| `MEDIA_TEXT_BLOCK` | ✓ | `items` | [widgets/MEDIA_TEXT_BLOCK.md](widgets/MEDIA_TEXT_BLOCK.md) |
| `MEDIA_TEXT_GRID_TABS` | ○ | `items` | — |
| `MEDIA_WITH_CONTENT` | ○ | `items` | — |
| `MEDIA_WITH_FOOTER_SLIDER` | ✓ | `items`, `modalEnabled`, `sliderConfig` | [widgets/MEDIA_WITH_FOOTER_SLIDER.md](widgets/MEDIA_WITH_FOOTER_SLIDER.md) |
| `MEDIA_WITH_HEADER_SLIDER` | ✓ | `cardBackground`, `checkIcon`, `items`, `sliderConfig`, `slidesUiType`, `subtitleColor`, `titleColor` | [widgets/MEDIA_WITH_HEADER_SLIDER.md](widgets/MEDIA_WITH_HEADER_SLIDER.md) |
| `MEDIA_WITH_INFO_CARDS` | ○ | `carouselConfig`, `items`, `textColor` | — |
| `MEDIA_WITH_INFO_PANEL` | ○ | `items` | — |
| `MEDIA_WITH_LIST` | ○ | `aspectRatio`, `items`, `media`, `tickIcon` | — |
| `MEDIA_WITH_LOGIN_CTA_AND_MODAL` | ○ | many | — |
| `MEDIA_WITH_PILLS_SLIDER` | ○ | `carouselConfig`, `items` | — |
| `MEDIA_WITH_PRODUCT_OVERLAY` | ○ | `items`, `productImageAspectRatio`, `sliderConfig`, `videoMutedIcon`, `videoUnMutedIcon` | — |
| `MEDIA_WITH_PROGRESS_SLIDER` | ○ | `aspectRatio`, `carouselConfig`, `items` | — |
| `MEDIA_WITH_READ_MORE` | ○ | `isCardClickable`, `items` | — |
| `MEMBERSHIP_PASS_CARD` | — | (empty top-level) | — |
| `MILESTONE_TRACKER` | — | (referrals) | — |
| `MULTI_PRODUCT_SELECTOR` | ✓ | (rich schema — FBT) | [widgets/MULTI_PRODUCT_SELECTOR.md](widgets/MULTI_PRODUCT_SELECTOR.md) |
| `NARRATIVE_AND_FACTS` | ✓ | `content`, `mainTitle`, `media`, `title`, `topIcon` | [widgets/NARRATIVE_AND_FACTS.md](widgets/NARRATIVE_AND_FACTS.md) |
| `OFFER_COUPON_CARD` | ✓ | `buttonText`, `copiedButtonText`, `couponCode`, `offerText`, `subText`, `useCodeText` | [widgets/OFFER_COUPON_CARD.md](widgets/OFFER_COUPON_CARD.md) |
| `OFFER_NUDGE_CARD` | ✓ | (same shape as AFFILIATE_CARD) | [widgets/OFFER_NUDGE_CARD.md](widgets/OFFER_NUDGE_CARD.md) |
| `PARALLAX_IMAGE` | ○ | `items` | — |
| `PARALLAX_MEDIA_TEXT` | ○ | `containerStyle`, `contentZIndex`, `medias`, `parallaxSpeedConfig`, `textBlocks` | — |
| `PERSONALIZED_BANNER` | ○ | `animationBanner`, `helperText`, `rewardEarned`, `subTitle`, `title` | — |
| `PINCODE_BOX` | ✓ | `analyticsEvents`, `cartMessage`, `category`, `endpointData`, `headingLevel`, `pincodeAnalytics`, `pincodeBox`, `subTitle`, `title`, `toastText`, `userPincode` | [widgets/PINCODE_BOX.md](widgets/PINCODE_BOX.md) |
| `PRODUCT_CALL_TO_ACTION` | ✓ | `bottomSheetProductsList`, `ctaLabel`, `goToCartLabel`, `isStickyFooter`, `productInfo`, `showBottomSheetOnAtc`, `showCtaInProductDescription`, `showProductInfoOnStickyFooter`, `showStickyFooterPermanent`, `stickyFooterVariant` | [widgets/PRODUCT_CALL_TO_ACTION.md](widgets/PRODUCT_CALL_TO_ACTION.md) |
| `PRODUCT_CARD_GRID` | ✓ | many | [widgets/PRODUCT_CARD_GRID.md](widgets/PRODUCT_CARD_GRID.md) |
| `PRODUCT_CARD_SLIDER` | ✓ | many | [widgets/PRODUCT_CARD_SLIDER.md](widgets/PRODUCT_CARD_SLIDER.md) |
| `PRODUCT_DETAILS_TILE` | ✓ | `description`, `heading`, `items`, `sectionName`, `showLessBtnText`, `showMoreBtnText` | [widgets/PRODUCT_DETAILS_TILE.md](widgets/PRODUCT_DETAILS_TILE.md) |
| `PRODUCT_FOOTER_STICKY` | ✓ | (very rich schema) | [widgets/PRODUCT_FOOTER_STICKY.md](widgets/PRODUCT_FOOTER_STICKY.md) |
| `PRODUCT_KIT_INFO` | ✓ | `items`, `itemsCardsHeading`, `kitItems`, `sectionName` | [widgets/PRODUCT_KIT_INFO.md](widgets/PRODUCT_KIT_INFO.md) |
| `PRODUCT_LISTING` | ○ | (deep nested) | — |
| `PRODUCT_REVIEW_CARD` | ✓ | `category`, `heading`, `items`, `sliderConfig`, `subHeading` | [widgets/PRODUCT_REVIEW_CARD.md](widgets/PRODUCT_REVIEW_CARD.md) |
| `PRODUCT_SUBSCRIPTION` | ✓ | `oneTimeOrderCta`, `options`, `productInfo`, `subscriptionInfo`, `title`, `toolTip` | [widgets/PRODUCT_SUBSCRIPTION.md](widgets/PRODUCT_SUBSCRIPTION.md) |
| `PRODUCT_SUMMARY` | ✓ | `callouts`, `cashbackInfo`, `installMentOptionType`, `isPayLater`, `onRatingsClick`, `productSummary`, `showInstallmentOptions`, `snapMintData`, `snapmintPayOnSalaryWidget`, `widgetContent` | [widgets/PRODUCT_SUMMARY.md](widgets/PRODUCT_SUMMARY.md) |
| `PRODUCT_SWITCHER` | ✓ | `productInfo`, `rows`, `showBorder`, `showTopBorder`, `spacing`, `urlKey` | [widgets/PRODUCT_SWITCHER.md](widgets/PRODUCT_SWITCHER.md) |
| `PRODUCT_SWITCHES` | ✓ | `isCartUpdating`, `itemBeingUpdated`, `productInfo`, `productSku`, `products`, `shouldShowAtcButtonOnProductSwitch`, `showATCButton`, `showAtcButtonOnProductSwitch`, `source`, `urlKeyOfBasePdp` | [widgets/PRODUCT_SWITCHES.md](widgets/PRODUCT_SWITCHES.md) |
| `PRODUCT_TABS` | ○ | many | — |
| `PRODUCT_TESTIMONIALS` | ✓ | `carouselConfig`, `products` | [widgets/PRODUCT_TESTIMONIALS.md](widgets/PRODUCT_TESTIMONIALS.md) |
| `QNA` | ✓ | `allQuestionsUrl`, `askQuestionText`, `endpointData`, `isLoading`, `items`, `newQuestion`, `productInfo`, `qnaConfig`, `showAskQuestion`, `viewAllQuestionsCTA` | [widgets/QNA.md](widgets/QNA.md) |
| `RATINGS_AND_REVIEWS` | ✓ | `allReviewsCta`, `allReviewsCtaLabel`, `customerSay`, `endpointData`, `newReview`, `productInfo`, `ratingOverview`, `showAllReviewCta`, `showWriteReview`, `starLabels`, `topReviews`, `topReviewsLabel`, `urlKey`, `writeReviewCta` | [widgets/RATINGS_AND_REVIEWS.md](widgets/RATINGS_AND_REVIEWS.md) |
| `RECENTLY_VIEWED_CATALOG_CARDS` | ✓ | (empty top-level — dynamic injected) | [widgets/RECENTLY_VIEWED_CATALOG_CARDS.md](widgets/RECENTLY_VIEWED_CATALOG_CARDS.md) |
| `RECENTLY_VIEWED_PRODUCT_CARD_SLIDER` | ✓ | (empty top-level — dynamic injected) | [widgets/RECENTLY_VIEWED_PRODUCT_CARD_SLIDER.md](widgets/RECENTLY_VIEWED_PRODUCT_CARD_SLIDER.md) |
| `REELS_SLIDER` | ✓ | `bottomCta`, `crossIcon`, `items`, `sliderConfig`, `variant` | [widgets/REELS_SLIDER.md](widgets/REELS_SLIDER.md) |
| `REFERRAL_DASHBOARD` | — | (referrals) | — |
| `REFERRED_USER_LIST` | — | (referrals) | — |
| `REVIEW_IMAGE_SLIDER` | ✓ | `aspectRatio`, `customerRating`, `items`, `sliderConfig` | [widgets/REVIEW_IMAGE_SLIDER.md](widgets/REVIEW_IMAGE_SLIDER.md) |
| `SCROLLABLE_MEDIA_BACKGROUND` | ○ | many | — |
| `SCROLL_TRIGGERED_MEDIA` | ○ | `aspectRatio`, `fallingDelayAfterPrimaryMs`, `fallingMedia`, `fallingStaggerMs`, `primaryMedia`, `triggerThreshold` | — |
| `SEARCH_INPUT_ROUTER` | — | (search-specific) | — |
| `SEARCH_INPUT_WITH_RECOMMENDATION` | — | (search-specific) | — |
| `SELECTABLE_SLIDER` | ○ | (deep nested) | — |
| `SHARE` | ○ | `cta`, `helperText`, `isKnowMoreBottomModalOpen`, `isShareContent`, `knowMorePopUpData`, `shareData`, `shareLink`, `shortCode`, `subTitle` | — |
| `SHAREABLE_CERTIFICATE` | — | (referrals) | — |
| `SHOP_PRODUCT_CARD_GRID` | — | (shop page) | — |
| `SOCIAL_REVIEW_LIST` | ✓ | `cta`, `reviews`, `showButton` | [widgets/SOCIAL_REVIEW_LIST.md](widgets/SOCIAL_REVIEW_LIST.md) |
| `STATS_TILES_WITH_DESCRIPTION` | ✓ | `items`, `text`, `title` | [widgets/STATS_TILES_WITH_DESCRIPTION.md](widgets/STATS_TILES_WITH_DESCRIPTION.md) |
| `STATUS_CARD` | ✓ | `alertMessage`, `heading` | [widgets/STATUS_CARD.md](widgets/STATUS_CARD.md) |
| `STICKY_CART_SUMMARY` | ○ | (empty top-level) | — |
| `STICKY_CTA_BUTTON` | ✓ | `addPadding`, `addShadow`, `button`, `isSticky`, `paddingHorizontal`, `paddingVertical` | [widgets/STICKY_CTA_BUTTON.md](widgets/STICKY_CTA_BUTTON.md) |
| `TABBY_PROMO` | ✓ | `price` | [widgets/TABBY_PROMO.md](widgets/TABBY_PROMO.md) |
| `TAB_WIDGET` | ○ | `backgroundColor`, `initialActiveTab`, `tabs` | — |
| `TAG_MEDIA` | ✓ | `desktopHeight`, `desktopImage`, `desktopWidth`, `mobileHeight`, `mobileImage`, `mobileWidth` | [widgets/TAG_MEDIA.md](widgets/TAG_MEDIA.md) |
| `TESTIMONIALS` | ✓ | `backgroundColor`, `items`, `labelColor`, `pillColor`, `pillTextColor`, `sliderConfig`, `starIcon`, `verifiedIcon` | [widgets/TESTIMONIALS.md](widgets/TESTIMONIALS.md) |
| `TEST_RESULTS` | ○ | `bottomText`, `items`, `subtitle`, `title`, `zoomHintText` | — |
| `TEXT_CONTAINER` | ✓ | `displayHTMl`, `textContent`, `textContentAlign`, `variant` | [widgets/TEXT_CONTAINER.md](widgets/TEXT_CONTAINER.md) |
| `TILES_WITH_MEDIA_SECTION` | ○ | `items`, `media` | — |
| `TILE_BAND` | ○ | `headingImage`, `items` | — |
| `TILE_GRID` | ○ | `columns`, `items`, `rows` | — |
| `TRACK_REFERRALS_TABS` | — | (referrals) | — |
| `USAGE_AND_TESTIMONIAL` | ✓ | `content`, `media`, `section`, `subtitle`, `title` | [widgets/USAGE_AND_TESTIMONIAL.md](widgets/USAGE_AND_TESTIMONIAL.md) |
| `VECTOR_SEARCH_INPUT_WITH_RECOMMENDATION` | — | (search) | — |
| `WALLET_BANNER_CTA` | ✓ | (empty top-level — dynamic) | [widgets/WALLET_BANNER_CTA.md](widgets/WALLET_BANNER_CTA.md) |
| `YOUTUBE_CAROUSEL` | ✓ | `carouselConfig`, `items`, `playIcon`, `sliderConfig` | [widgets/YOUTUBE_CAROUSEL.md](widgets/YOUTUBE_CAROUSEL.md) |

**Totals:** 122 widget types in the platform. ~50 are PDP-active (✓). ~50 are
PDP-renderable but rarely used there (○). ~22 are exclusive to other surfaces (—).

---

## Frontend widget map (additional types not in admin-mcp catalog)

The frontend `BASE_WIDGET_MAP` (`Widgets.Map.ts`) includes a few "compound" or
device-specific type aliases that don't exist in the admin-mcp catalog. They all
dispatch to the same React component as a sibling type:

| Frontend type | Aliased to | Notes |
| ------------- | ---------- | ----- |
| `MOBILE_BANNER`, `DESKTOP_BANNER` | `BANNER` | device-targeted banner |
| `DESKTOP_TILES`, `MOBILE_TILES` | `TILES` | device-targeted tile grid |
| `DESKTOP_IMAGE_SLIDER`, `MOBILE_IMAGE_SLIDER` | `MEDIA_SLIDER` | device-targeted slider |
| `DESKTOP_HYBRID_LAYOUT`, `MOBILE_HYBRID_LAYOUT` | `HYBRID_LAYOUT` | device-targeted layout container |
| `MOBILE_PRODUCT_CARD_GRID`, `DESKTOP_PRODUCT_CARD_GRID` | `PRODUCT_CARD_GRID` | device-targeted grid |
| `MOBILE_CATEGORY_PRODUCT_CARD_CAROUSEL`, `DESKTOP_CATEGORY_PRODUCT_CARD_CAROUSEL` | `CATEGORY_PRODUCT_CARD_CAROUSEL` | |
| `CLICKABLE_IMAGE_SLIDER` | `MEDIA_SLIDER` | |

These are emitted by middleware enrichers to target one breakpoint without duplicating
widget config.

The frontend also registers types that aren't in the platform catalog but exist for
internal composition: `HYBRID_LAYOUT`, `CATEGORY_PRODUCT_CARD_CAROUSEL`,
`CATEGORY_PRODUCT_CARD_GRID`, `CATEGORY_TAGS_PRODUCT_CARD_V2_GRID`,
`VIDEO_IMAGE_PRODUCT_CARD_SLIDER`, `PRODUCT_CARD_V2_SLIDER`, `IMAGE_SLIDER`,
`IMAGE_CAROUSEL`, `IMAGE_GRID`, `IMAGE_WITH_DESCRIPTION_SLIDER`,
`TESTIMONIAL_PRODUCT_CARD_CAROUSEL`, `DOWNLOAD_APP_CALLOUT`, `KIT_BREAKDOWN`,
`MINI_ASSESSMENT`, `CTA_BUTTON`, `MENU_ROW_ITEM`, `INFO_CARD_SLIDER`,
`VIDEO_SLIDER`, `RX_PREVIEW`, `RX_CONSULT_DETAILS`, `ICON_GRID`,
`ICON_WITH_LABEL_SLIDER`, `PRODUCTS_GRID`, `STICKY_BOTTOM_NAV`,
`FEEDBACK_BANNER`, `ORDERS_LISTING_IN_SUPPORT`, `SUPPORT_TICKETS_LISTING`,
`SUPPORT_MENU_ITEMS`, `DOCTOR_LISTING_*` (5 variants),
`DOCTOR_APPOINTMENT_CARD`, `DOCTOR_LISTING_CARD`, `IMAGE_GALLERY`,
`PRODUCT_DETAILS`, `PDP_VARIANTS`, `TABBED_CONTENT`, `CHECK_DELIVERY`,
`MEDIA_WITH_CTA_GRID`, `MEDIA_DESCRIPTION_SLIDER`, `PRODUCT_CONTENTS`,
`STORIES`, `ICON_CARD_GRID`, `RATINGS_BREAKDOWN`, `REVIEW_LISTING`,
`QNA_LISTING`, `ICON_CARD_WITH_INFO_LIST`, `COLLAPSIBLE_TEXT_SECTION`,
`MAT_PALLET`, `TABBED_PRODUCT_LISTING`, `STEP_SUMMARY`, `BLOG_CARD_SLIDER`,
`BOOSTS`, `MEDIA_ROW`, `TABBED_ACCORDION`.

These names are sentinels — most resolve to a frontend-only composition or wrap one of
the named widgets above. Verify against `Widgets.Map.ts:64` for the live registry.

---

## Cross-layer status legend

| Marker | Meaning |
| ------ | ------- |
| Has `widgetData` | Always — every widget has one |
| `headerSupported: true` | Widget may render a `header` block above content (title, subtitle, decoration) |
| `layoutSupported: true` | Widget may render inside a `layout` wrapper (spacing, background, padding) |

The shape of `header` and `layout` is shared across all widgets — see
[`widgets/_common.md`](widgets/_common.md) for details.
