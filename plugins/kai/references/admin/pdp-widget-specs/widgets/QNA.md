# `QNA`

> Customer Q&A — questions asked by users, answered by the brand team or experts.

## Identity

- type — `QNA`
- headerSupported — true · layoutSupported — true · PDP relevance — ✓
- **Narrative role** — `OBJECTION` — customer-driven Q&A. Distinct from `FAQ_ACCORDION` (brand-driven) because the questions are from real users.

### Edit-safety

🟢 `askQuestionText`, `viewAllQuestionsCTA.label`, items' `question` and `answer` body (when not adding new claims).
🟡 `items[].answeredBy` (expert/author claim), `items[].verified`, claim-bearing answers.
🔴 `items[].id`, `productInfo.sku`, `endpointData.url`, `allQuestionsUrl`, action wiring.

## widgetData

| Field | Type | Notes |
| ----- | ---- | ----- |
| `productInfo` | object | sku + urlKey. |
| `items` | array of `{ id, question, answer, askedBy?, answeredBy?, date, helpfulCount }` | Top-N Q&A. |
| `qnaConfig` | object | Brand-level config (min answer length, allow anonymous, etc.). |
| `askQuestionText` | string | "Ask a question" CTA label. |
| `showAskQuestion` | bool | Whether to render the ask-question CTA. |
| `viewAllQuestionsCTA` | GenericCta | "View all questions" — links to `/all-questions`. |
| `allQuestionsUrl` | string | The full URL for the all-questions page. |
| `newQuestion` | object | Empty in JSON — frontend writes into it for the ask flow. |
| `endpointData` | `{ url, method }` | The Q&A submit endpoint. |
| `isLoading` | bool | Frontend-managed. |

## How it appears on a PDP today

Authored as `qna` RCL section. Transformer: `transform-product-qna.helper.ts`. The Q&A
items themselves come from the live QnA service via middleware's
`insertDynamicDataForWidgetsFromAPI.ts` (case `product-qna`).

## Middleware enrichment

`insertDynamicDataIntoProductPageWidgets.ts:312` (`QNA` case) — fills `items[]` with
the latest top Q&A from the QnA service. Authored `items[]` are usually empty.

## Frontend component

`apps/storefront-web/src/mono/web-core/widgets/QNA/` (or nearby; trace from
`Widgets.Map.ts`).

## Gotchas

- The QnA service is rate-limited — heavy admin panels listing all PDPs side-by-side
  may show stale data.
- Submitting a question requires authentication. If `showAskQuestion: true` and the
  user is anonymous, clicking opens the login flow first (via
  `AUTHENTICATE_AND_PERFORM_ACTIONS`).
- Items are sorted by `helpfulCount` desc on the server, so authoring an order in
  `items[]` is ignored at read time.
