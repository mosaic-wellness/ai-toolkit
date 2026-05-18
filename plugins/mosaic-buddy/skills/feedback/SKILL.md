---
name: feedback
description: >
  Capture a rating + short title + description from the user and submit it to
  the beacon-telemetry dashboard. Three steps: rating (4-point AskUserQuestion),
  title (one-line text), description (1–3 sentences text). Submission is signed
  with the shared HMAC key. Honours MOSAIC_BUDDY_TELEMETRY_URL=off.
---

# Feedback

The user invoked `/mosaic-buddy feedback`. Drive a short three-step conversation, then submit.

Keep the tone warm — they're doing us a favour. Don't restate what you already asked.

## Step 1: Capture the rating

Call `AskUserQuestion` with **exactly** this shape (don't paraphrase the option labels — the script maps them to integer ratings):

```json
{
  "questions": [{
    "question": "How is mosaic-buddy going for you?",
    "header": "Rating",
    "multiSelect": false,
    "options": [
      { "label": "Loved it", "description": "It's been genuinely useful" },
      { "label": "Liked it", "description": "Useful overall, with a few rough edges" },
      { "label": "Meh", "description": "It's okay but not changing my workflow" },
      { "label": "Frustrated", "description": "Something's not working for me" }
    ]
  }]
}
```

Map the answer to an integer:

| Answer | `RATING` |
|---|---|
| Loved it | 4 |
| Liked it | 3 |
| Meh | 2 |
| Frustrated | 1 |

If the user picks "Other" and types something, infer the closest match (4 = positive, 3 = mostly positive, 2 = neutral, 1 = negative). If you can't tell, ask one short follow-up.

## Step 2: Capture the title

Ask in plain text (NOT AskUserQuestion):

> Got it — give it a one-line title (what's the headline?).

Wait for their reply. Store as `TITLE`. Hard cap 200 chars; if longer, trim to the first sentence and tell them you shortened it.

## Step 3: Capture the description

Ask in plain text (NOT AskUserQuestion):

> And a few more sentences — what happened, what'd you want instead, anything specific?

Wait for their reply. Store as `DESCRIPTION`. Hard cap 2000 chars; if longer, trim and tell them.

If the user says "skip" or replies with nothing meaningful, default `DESCRIPTION` to the title text — the script requires non-empty.

## Step 4: Submit

Invoke the submitter via the Bash tool:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/hooks/submit-feedback.sh" <RATING> "<TITLE>" "<DESCRIPTION>"
```

Pass `RATING` as the unquoted integer (1-4). Pass `TITLE` and `DESCRIPTION` as quoted strings — the script handles JSON encoding, so don't pre-escape anything beyond what bash quoting requires. If the strings contain double-quotes, use a heredoc-fed variable instead:

```bash
TITLE='user provided title here'
DESCRIPTION='user provided description here'
bash "${CLAUDE_PLUGIN_ROOT}/hooks/submit-feedback.sh" 3 "$TITLE" "$DESCRIPTION"
```

## Step 5: Report

- **On success (exit 0):** tell the user one line — "Thanks — feedback sent. Hitesh will see it in the dashboard." Don't quote the URL.
- **On failure (non-zero):** show the script's stderr verbatim so the user can see what went wrong (most common: server down, or `MOSAIC_BUDDY_TELEMETRY_URL=off`). Offer to retry once.

## Rules

1. **Three asks, no more.** Don't drag this out — they offered feedback, not a survey.
2. **Don't lecture.** No "your feedback is important to us" filler.
3. **Don't auto-fill.** If the user gives you a title but no description, ask once for the description rather than inventing one.
4. **Never log or echo the HMAC key.** The script handles it.
5. **One submission per invocation.** If the user wants to add more, they can re-run `/mosaic-buddy feedback`.
