# `INSTALLMENT_OPTIONS`

> EMI / BNPL options block. Renders Snapmint, Simpl, or Pay-on-Salary terms based on
> the live price.

## Identity

- type — `INSTALLMENT_OPTIONS`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `LOGISTICS` — affordability framing. EMI / BNPL math.

### Edit-safety

🟢 `widgetContent` HTML when it's pure copy.
🟡 **everything else** — `price`, `installMentOptionType`, `isPayLater`, `snapmintPayOnSalaryWidget.maximumPrice`. Financial copy.
🔴 `installMentOptionType` enum value itself when it changes the provider.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `price` | number | The base price the EMI math runs against. **Always injected by middleware** — admin authoring is ignored. |
| `installMentOptionType` | enum `simpl` / `snapmint` | Which provider tab to default to. |
| `isPayLater` | bool | If true, renders the BNPL ("buy now, pay in 30 days") variant. |
| `snapmintPayOnSalaryWidget` | `{ isEnabled: bool, maximumPrice: number }` | Toggles the salary-EMI tab visibility. |
| `widgetContent` | string | Optional HTML rendered below the options. |

## How it appears on a PDP today

Authored as `installmentOptions` or `snapMintData` RCL section. Transformers:
`transform-installment-options.helper.ts`, `transform-snap-mint-data.helper.ts`.

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:174` (`INSTALLMENT_OPTIONS` case). Pulls
live price from `productData` and re-runs the EMI calculation. Decides which provider
tab to enable based on brand config + cart-value gating.

## Frontend component

`apps/storefront-web/src/components/shared/.../InstallmentOptions/` — exact path
varies; trace via `Widgets.Map.ts`. The tab switcher renders Snapmint/Simpl side-by-side
when both are enabled.

## Gotchas

- This widget is *not* available for every product — international / RX / consult
  products typically suppress it via the display-order resolver.
- BNPL eligibility may depend on the user's prior BNPL history — handled in the
  payment service, not here. This widget just shows the "best case" options.
