# `CUSTOM_COMPONENT`

> Escape hatch — renders a tree of arbitrary "nodes" via a generic
> `CustomComponentWidget`. Used for one-off bespoke layouts that don't justify a real
> widget type.

## Identity

- type — `CUSTOM_COMPONENT`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `ANCHOR` — escape hatch for one-off layouts. Hard to categorise narratively.

### Edit-safety

🔴 **entire `nodes[]` tree** — the node tree is structural. No safe automated rewriting. If new copy is needed, file a request to promote it to a real widget.
🟢 leaf-level `text` content inside nodes (when an automated tool can verify the node is a pure text leaf).

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `nodes` | array of node objects | Each node has a `type` (e.g. `view`, `text`, `image`, `button`) and `style` + nested `children`. Mirrors a React Native-like primitive tree. |
| `style` | object | Container CSS overrides. |

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/CustomWidget/`. Walks the node tree
and dispatches each primitive to a small React renderer.

## Gotchas

- This widget is hard to debug — there's no schema enforcement on the node tree, and a
  malformed node silently renders nothing. Reserve for one-off cases where no real
  widget fits.
- It has **no SEO benefits** — search engines can't introspect the node tree the way
  they can semantic HTML.
- If you find yourself using `CUSTOM_COMPONENT` more than once, that's a signal a new
  named widget type is needed. Promote it.
