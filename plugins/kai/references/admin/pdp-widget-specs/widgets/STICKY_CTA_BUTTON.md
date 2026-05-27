# `STICKY_CTA_BUTTON`

> A simpler sticky-button widget than `PRODUCT_FOOTER_STICKY`. Used for non-product
> CTAs ("Take quiz", "Consult").

## Identity

- type — `STICKY_CTA_BUTTON`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `COMMIT` (non-ATC) — persistent sticky button. For quiz / consult / refer flows.

### Edit-safety

🟢 `button.label`, padding numerics.
🟡 labels that imply a service guarantee.
🔴 `button.actions[]`, `addPadding`, `addShadow`, `isSticky`.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `button` | GenericCta | The CTA. |
| `isSticky` | bool | Pins to viewport bottom. |
| `addShadow` | bool | Adds elevation shadow. |
| `addPadding` | bool | Adds inner padding. |
| `paddingHorizontal`, `paddingVertical` | number | Padding overrides (px). |

## Gotchas

- Don't use this for ATC — that's `PRODUCT_CALL_TO_ACTION` or `PRODUCT_FOOTER_STICKY`.
- Two sticky widgets on the same page stack — usually you don't want that. Decide
  ownership of the sticky slot.
