# `PINCODE_BOX`

> A standalone pincode-entry box that resolves to delivery date / quick-delivery
> eligibility. Often appears alongside or instead of [`CHECK_DELIVERY_INFO`](CHECK_DELIVERY_INFO.md).

## Identity

- type — `PINCODE_BOX`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `LOGISTICS` — pincode-entry primitive. Companion to `CHECK_DELIVERY_INFO`.

### Edit-safety

🟢 `title`, `subTitle`, placeholder + error messages inside `pincodeBox`.
🟡 `cartMessage`, `toastText` (commitments shown to the user).
🔴 `endpointData`, `pincodeAnalytics`, `analyticsEvents`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title`, `subTitle` | string | Display copy. |
| `pincodeBox` | object | Config for the input box: placeholder, max-length, error messages. |
| `userPincode` | string | Current pincode (frontend-injected). |
| `cartMessage`, `toastText` | string | Templates for cart-impact messages after pincode resolves. |
| `category` | string | The product category — drives lane selection. |
| `endpointData` | `{ url, method }` | The pincode-lookup endpoint. |
| `analyticsEvents`, `pincodeAnalytics` | object | Event payloads emitted on resolve. |
| `headingLevel` | number | SEO heading level for `title`. |

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:255` (`PINCODE_BOX` case). Sets
`userPincode` from cookie if absent. Some brands pre-resolve QD eligibility into
`pincodeBoxData` if pincode is known.

## Gotchas

- This widget overlaps with `CHECK_DELIVERY_INFO`. Most PDPs use one or the other, not
  both. The combined experience comes when authors place both on the page — the
  `CHECK_DELIVERY_INFO` widget then *contains* a `pincodeBoxData` reference rather than
  rendering its own pincode entry.
