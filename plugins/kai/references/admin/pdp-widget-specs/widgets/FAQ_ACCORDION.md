# `FAQ_ACCORDION`

> A simple list of expandable Q&A items. The "We've got answers" / "FAQ" section near
> the bottom of every PDP.

## Identity

- **type** — `FAQ_ACCORDION`
- **headerSupported** — true
- **layoutSupported** — true
- **PDP relevance** — ✓
- **Narrative role** — `OBJECTION` — pre-answers the doubts that would otherwise cause bouncing. JSON-LD eligible for SEO.

### Edit-safety summary

🟢 AI-safe: `faqLabel`, `faqText`, `accordionItems[].title`, `accordionItems[].description` (when no new claims).
🟡 Sensitive: any `description` that makes a health / efficacy / regulatory claim ("cures", "treats", "clinically proven"). Adding such language requires legal review.
🔴 Structural: nothing rich here — this widget is mostly copy.

## widgetData

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `accordionItems` | `{ title: string, description: string }[]` | **yes** | The Q&A list. `title` is the question; `description` is the (HTML-supported) answer. |
| `faqLabel` | string | **yes** | Small label above the section title (e.g. "FAQ"). |
| `faqText` | string | **yes** | The section title text (e.g. "We've got answers"). |

## Example

```json
{
  "id": "pdp-faq",
  "type": "FAQ_ACCORDION",
  "layout": { "type": "CONTAINED", "verticalSpacing": { "top": "GENEROUS", "bottom": "GENEROUS" } },
  "widgetData": {
    "faqLabel": "FAQ",
    "faqText": "We've got answers",
    "accordionItems": [
      {
        "title": "How long does it take to see results?",
        "description": "Most users see noticeable energy improvements within <b>2-3 weeks</b> of daily use."
      },
      {
        "title": "Is it safe for daily use?",
        "description": "Yes — our shilajit is third-party tested and safe for daily consumption."
      },
      {
        "title": "Can I take this with other supplements?",
        "description": "Yes, shilajit pairs well with most supplements. Consult your doctor for personalised advice."
      }
    ]
  }
}
```

## How it appears on a PDP today

Authored as the `weGotAnswers` or `faqs` RCL section. Static-service transforms via
`transform-we-got-answers-data.helper.ts` or `transform-faqs.helper.ts`.

## Middleware enrichment

None. Admin-authored, passes through middleware as-is.

## Frontend component

- `apps/storefront-web/src/mono/web-core/auditedWidgets/FaqAccordion/FaqAccordion.tsx`
- Renders SEO-friendly `FAQPage` structured data (JSON-LD) for every authored Q&A —
  improves rich snippets in Google search results.
- Uses `<details>` / `<summary>` HTML elements for the accordion, so it works without
  JS.

## Gotchas

- `description` accepts HTML — `<b>`, `<i>`, `<a href>` work. Don't paste rich content
  from Google Docs; it brings inline styles that break the design system.
- Each `accordionItems[]` entry becomes a `FAQPage` Question/Answer pair in JSON-LD.
  Don't author marketing copy as a question — Google may penalise.
- Keep answers under ~200 words. Beyond that, link to a knowledge-base article via an
  `<a>` tag in `description`.
- The widget is collapsed by default. For above-fold FAQs (rare on PDPs), use
  `ACCORDION` with `isInitiallyOpen` instead.
