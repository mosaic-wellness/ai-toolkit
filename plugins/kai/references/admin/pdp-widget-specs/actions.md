# Action Catalog

Actions are the verbs you bind to a widget's CTAs and interactive surfaces. Every
clickable CTA in a widget specifies an `action` (the verb) and `actionData` (the
payload). On the frontend they're dispatched through `useGenericCta` /
`useGenericCtaV2`, which routes each action type to a handler that calls the right
service or navigates the user.

Catalog source: `mcp__admin-mcp__list_widget_types kind=action` (41 actions).
Frontend handlers: `front-end-mono-repo/apps/storefront-web/src/actions/actions/*`.

## Action shape

```json
{
  "action": "NAVIGATE",
  "actionData": {
    "url": "/products/shilajit-gummies",
    "openInNewTab": false
  }
}
```

Most widgets accept actions inside `widgetData.cta`, `widgetData.items[].cta`,
or `widgetData.actions[]`. A single click can fire **multiple actions** when bound
inside an `actions[]` array — useful for "do X then analytics".

## Action table

| Action | Group | actionData payload (typical) |
| ------ | ----- | ---------------------------- |
| `ADD_TO_CART` | general | `{ sku, quantity, source, options? }` |
| `ADD_TO_CART_MULTIPLE` | general | `{ items: [{ sku, quantity }, ...] }` |
| `ADD_TO_CART_MULTIPLE_AND_RESET_CART` | general | `{ items }` — empties cart first |
| `APP_CART_REFETCH` | general | `{}` — native bridge to re-pull cart |
| `AUTHENTICATE_AND_NAVIGATE` | general | `{ url, fallbackUrl? }` — login wall, then route |
| `AUTHENTICATE_AND_PERFORM_ACTIONS` | general | `{ actions: [...] }` — login wall, then dispatch all |
| `ENDPOINT` | general | `{ method, url, body?, onSuccess?, onError? }` — POST/GET via middleware |
| `FETCH_WALLET_POINTS` | general | `{}` |
| `GENERIC_APP_ACTION` | general | `{ type, payload }` — opaque native-app bridge call |
| `LOGOUT` | general | `{ redirectUrl? }` |
| `NAVIGATE` | general | `{ url, openInNewTab?, scroll? }` |
| `NAVIGATE_BACK` | general | (no actionData) |
| `OPEN_SEARCH_LOCATION_MAP` | general | `{ context }` — opens pincode/location picker |
| `PRODUCT_BUY_NOW` | general | `{ sku, source }` — single-product checkout shortcut |
| `PRODUCT_CLOSE_RECOMMENDATION` | general | (no actionData) |
| `PRODUCT_NOTIFY_ME` | general | `{ sku, productInfo }` — OOS notify flow |
| `PRODUCT_OPEN_RECOMMENDATION` | general | `{ sku }` — opens recommended bottom sheet |
| `REORDER_WITH_ORDER_ID` | general | `{ orderId }` |
| `REQUEST_ALL_APPLE_HEALTH_PERMISSIONS` | general | `{}` — native iOS only |
| `REQUEST_APPLE_HEALTH_PERMISSIONS` | general | `{ permissions: [...] }` |
| `RESET_NAVIGATION` | general | `{ url }` — clears stack and navigates |
| `SCROLL_TO_ELEMENT` | general | `{ selector, offset?, behavior? }` |
| `SCROLL_TO_WIDGET` | general | `{ widgetId, offset?, behavior? }` |
| `SET_IN_SESSION_STORAGE` | general | `{ key, value }` |
| `SHARE` | general | `{ url, title, text }` |
| `SHOW_INFO_MODAL` | general | `{ title, body, ctas? }` |
| `SIDE_CART_TOGGLE` | general | `{ open?: boolean }` |
| `SYNC_APPLE_HEALTH_DATA` | general | `{}` |
| `TOGGLE_COUPON_BOTTOM_SHEET` | general | `{ open? }` |
| `TOGGLE_RECHARGE_BOTTOM_SHEET` | general | `{ open? }` |
| `TOGGLE_RECOMMENDED_BOTTOM_SHEET` | general | `{ open? }` |
| `TRACK_EVENTS_SELECTIVE` | general | `{ events: [{ name, properties }] }` — analytics subset |
| `TRACK_EVENTS_SELECTIVE_WEB_VIEW` | general | same — web view bridge |
| `TRIGGER_ALL_ANALYTICS_EVENTS` | general | `{ events }` — fire-and-forget bulk |
| `TRIGGER_EVENTS` | general | `{ events: [...] }` |
| `TRIGGER_EVENTS_SELECTIVE` | general | `{ events, channels: [...] }` |
| `TRIGGER_EVENTS_SELECTIVE_WEB_VIEW` | general | webview variant |
| `TRIGGER_EVENTS_WEB_VIEW` | general | webview variant |
| `UPDATE_CART` | general | `{ sku, quantity }` |
| `UPDATE_MEMBERSHIP` | general | `{ membershipId, planId }` |
| `UPDATE_ROOK_USER_ID` | general | `{ userId }` — Rook health integration |

For the exact JSON schema of any action's `actionData`, use:

```
mcp__admin-mcp__get_widget_schema widget_type="ACTION_NAME"
```

## Multi-action composition

Two-action click example — add to cart, then track:

```json
{
  "cta": {
    "label": "Add to cart",
    "actions": [
      { "action": "ADD_TO_CART", "actionData": { "sku": "ABC-001", "quantity": 1 } },
      { "action": "TRIGGER_EVENTS_SELECTIVE", "actionData": { "events": [...] } }
    ]
  }
}
```

Login-gated click example:

```json
{
  "cta": {
    "label": "Subscribe",
    "actions": [
      {
        "action": "AUTHENTICATE_AND_PERFORM_ACTIONS",
        "actionData": {
          "actions": [
            { "action": "UPDATE_MEMBERSHIP", "actionData": { ... } },
            { "action": "NAVIGATE", "actionData": { "url": "/my-account" } }
          ]
        }
      }
    ]
  }
}
```

## Frontend handlers

Each action has a handler under
`apps/storefront-web/src/actions/actions/<group>/<kebab-action-name>/`. The handler
file exports a single function consumed by `useGenericCta`. Adding a new action:

1. Register the type in the admin-mcp action catalog.
2. Add the handler in the frontend.
3. Document the `actionData` payload here.

Native-app actions (`GENERIC_APP_ACTION`, `APP_CART_REFETCH`, the Apple Health set,
`UPDATE_ROOK_USER_ID`, `*_WEB_VIEW` variants) require the React Native bridge — they
no-op on the web.
