# `CHECK_DELIVERY_INFO`

> Pincode-based delivery-date estimator. Shows "Delivery by Tuesday" once the user
> enters a pincode or has one cached.

## Identity

- type — `CHECK_DELIVERY_INFO`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `LOGISTICS` — turns "I want this" into "it will arrive Tuesday." Concretises fulfilment.

### Edit-safety

🟢 `title`, `subTitle`, `desc`, `descImage` URL.
🟡 the live `qddData.*` delivery-date fields, `cta.label` if it implies a delivery commitment, copy in `setLocationConfig` / `editLocationConfig`. Delivery copy is a customer commitment.
🔴 `endpointData`, `pincodeBoxData` shape, `cta.actions[]`, `productInfo.sku`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | Heading (e.g. "Delivery"). |
| `subTitle` | string | Secondary line. |
| `desc` | string | Detail text shown above the pincode box. |
| `descImage` | string | Optional decorative icon next to `desc`. |
| `cta` | GenericCta | Action for the "check" button (usually `OPEN_SEARCH_LOCATION_MAP`). |
| `pincode` | string | The user's current pincode (frontend-injected from cookie if absent). |
| `pincodeBoxData` | object | Config for the inline pincode entry widget. |
| `checkDeliveryDateSectionData` | object | Brand-level QD config — copy/templates for the result text. |
| `commitmentType` | enum `quick` / `standard` | Drives badge styling. |
| `qddData` | object | Quick-delivery dates returned from middleware enrichment. |
| `isQuickDeliveryEligible` | bool | Set by middleware after pincode resolution. |
| `productInfo` | object | The product context (used to gate which QD lanes apply). |
| `editLocationConfig`, `setLocationConfig` | object | Copy/CTAs for "edit / set location" sub-flows. |
| `animationConfig` | object | Optional Lottie config for the loading state. |

## How it appears on a PDP today

Authored as `checkDeliveryDate` RCL section. Transformer:
`transform-check-delivery-data.helper.ts`. The related [`PINCODE_BOX`](PINCODE_BOX.md)
widget can render the pincode input as a standalone box.

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:245` (`CHECK_DELIVERY_INFO` case). Calls
the QD eligibility service with the user's pincode (from cookie / request header) and
injects `qddData`, `isQuickDeliveryEligible`, `commitmentType`. If pincode is unknown,
the widget shows the entry state.

## Frontend component

`apps/storefront-web/src/components/shared/.../CheckDeliveryDate/` or
`apps/storefront-web/src/mono/web-core/auditedWidgets/CheckDeliveryInfo/` — depends on
brand. Trace via `Widgets.Map.ts`.

Uses `useDeliveryEstimate` hook + `usePinCodeStore` for live pincode state.

## Gotchas

- The QD service has brand-specific lanes. A pincode eligible for QD on Bodywise may
  not be eligible on Man Matters. Middleware enrichment scopes the call by brand.
- Some PDPs (RX, consult products) skip this widget — handled by the display-order
  resolver, not by widget-level logic.
- The `editLocationCta` / `setLocationConfig` shapes vary across brands; pull
  `mcp__admin-mcp__get_widget_schema CHECK_DELIVERY_INFO` for the live constraint set.
