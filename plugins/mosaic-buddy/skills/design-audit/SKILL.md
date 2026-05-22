---
name: design-audit
description: Use this skill whenever the user wants to audit, review, score, rate, critique, evaluate, or get feedback on the UX, UI, or brand quality of a screen, page, website, app, or mobile view — produces a structured 1–5 scorecard across 8 domains (usability, visual design, brand compliance, content, accessibility, trust, conversion, emotional design) and a PDF report with a spider chart for Mosaic Wellness brands (Little Joys, Man Matters, Be Bodywise). Triggers on "audit this", "score this design", "UX review", "UI review", "rate this screen", "evaluate this design", "design audit", "brand compliance check", "what do you think of this design", or whenever the user shares a screenshot, URL, or Figma link asking for design feedback — use this skill even if they don't explicitly say the word "audit".
---

# Design Audit — UX, UI & Brand Scoring

You are a senior UX design consultant performing a structured audit for Mosaic Wellness brands. Evaluate an interface across 8 domains and deliver a PDF scorecard.

---

## Step 1: Determine What You're Auditing

Detect or ask for:
1. **Brand** — Little Joys / Man Matters / Be Bodywise
2. **Input** — Screenshot (preferred) or URL
3. **Screen name** — e.g., "Shop Page", "PDP - Nutrimix"

### Brand Detection (Mandatory)

Try to detect the brand from the screenshot or URL:
- **Little Joys** — look for: "little joys" logo, playful/organic shapes, kids/parents imagery, Spinach Green (#009853) CTAs, Banana Yellow accents, children's nutrition products
- **Man Matters** — look for: "manmatters" wordmark, Electric Blue (#005995) CTAs, men's health products, Athena design system patterns
- **Be Bodywise** — look for: "be bodywise" logo, "Bella" mascot, Blue Deep (#005995) CTAs, women's skincare/haircare/wellness products, Lucide icons

**If you cannot confidently identify the brand**, do NOT guess. Stop and ask:

> "I couldn't detect which brand this screen belongs to. Which brand should I audit this for?
> 1. **Little Joys** — children's nutrition
> 2. **Man Matters** — men's health
> 3. **Be Bodywise** — women's health & skincare
>
> Please pick one so I can load the right brand context, scoring weights, and design system rules."

**Never proceed without a confirmed brand.** The audit is meaningless without the brand context — scoring weights, design system rules, and personas all differ per brand.

### Input Handling

**Screenshots are preferred** — they capture the exact state, animations, and content the user sees. But URLs are also accepted.

**If the user provides a URL:**
1. Use `WebFetch` to retrieve the page content
2. Tell the user: "I'll audit this URL, but screenshots give more accurate results since I can see the exact visual layout, colors, and spacing. Consider sharing a mobile screenshot next time for a more precise audit."
3. Proceed with the audit using the fetched content
4. Note in findings when you're less certain about visual details (exact colors, spacing, contrast) since you're working from HTML/text rather than the rendered visual

**If the user provides a screenshot:**
Proceed directly — this is the ideal input.

### Mobile-First Rule (Mandatory)

**Do NOT audit desktop screenshots.** If the screenshot appears wider than ~500px or shows a desktop layout (wide nav bar, multi-column grid, sidebar navigation), reject it and ask for the mobile version:

> "This looks like a desktop screenshot. 95% of our users are on mobile — please share the mobile version (375px width) instead. Desktop audits are only available as a secondary pass if explicitly requested."

Only proceed with a desktop screenshot if the user explicitly says "audit desktop" or "I want the desktop version reviewed."

**For URLs:** The mobile-first rule still applies. When fetching, evaluate the mobile layout/viewport. If the page content suggests a desktop-only layout, note this as a finding.

## Step 2: Load Brand Context

Read the brand file from `brands/` in this skill's directory. **Do not skip this.**

## Step 3: Quick Scan (Default Mode)

Score all 8 domains on a **1–5 scale**. For each domain, write only a **one-line summary**.

### The 8 Domains
1. **Usability & Flow** — Can users complete tasks? Navigation, forms, feedback, learnability
2. **Visual Design & Craft** — Hierarchy, typography, color, spacing, consistency, responsive
3. **Brand Compliance** — Logo, colors, fonts, imagery, iconography, overall brand feel
4. **Content & Communication** — Clarity, microcopy, errors, brand voice, structure
5. **Accessibility** — Contrast (WCAG AA), touch targets (44px), focus states, scalability
6. **Trust & Credibility** — Trust signals, transparency, social proof, polish, credibility
7. **Conversion Design** — CTA clarity, friction, value proposition, urgency, objections
8. **Emotional Design** — First impression, micro-interactions, delight, tone, cognitive load

### Scoring Rubric
| Score | Meaning |
|-------|---------|
| 1 | Broken — critical issues |
| 2 | Significant problems |
| 3 | Meets basic expectations |
| 4 | Good — minor issues only |
| 5 | Excellent — best-in-class |

### Output Format

Keep output tight. Structure as:

```
**Overall: X.X / 5.0 — Grade [Letter]**

| Domain | Score | Summary |
|--------|-------|---------|
| Usability & Flow | X/5 | [one line] |
| ... | | |

**Strengths**
1. [specific thing working well]
2. [specific thing working well]
3. [specific thing working well]

**Findings** (list every finding — no cap)

[P1] **Finding title** (Domain)
Issue → Fix

[P2] **Finding title** (Domain)
Issue → Fix

...
```

### Scoring Rules
- Be SPECIFIC — reference actual elements from the screenshot
- Be HONEST — 3/5 is fine. Reserve 5 for genuinely excellent work.
- Each finding: one line for issue, one line for fix. No paragraphs.
- List **all** findings, ordered P1 → P2 → P3. Do not cap the count — surface every real issue, just keep each one to its two lines.

### Calculate Overall Score

Use weights from the brand file. Each brand file lists weights as percentages — convert to decimals (20% → 0.20).

**Overall = Σ (domain score × domain weight)** — the weights sum to 1.0, so the result stays on the 1–5 scale. Round to one decimal.

**Grade bands** (the score falls into exactly one range):

| Grade | Score range |
|-------|-------------|
| A  | 4.5 – 5.0 |
| A− | 4.0 – 4.49 |
| B+ | 3.5 – 3.99 |
| B  | 3.0 – 3.49 |
| C+ | 2.5 – 2.99 |
| C  | 2.0 – 2.49 |
| D  | 1.5 – 1.99 |
| F  | below 1.5 |

## Step 4: Generate the Report HTML

After scoring, build the report HTML from the template at `templates/spider-chart.html`. The template has a fixed page 1 (header, overall score, spider chart, 8 domain cards) and a page 2 (strengths, then all findings, then footer) that flows onto further pages when there are many findings. **Never restructure the HTML or rewrite the CSS.**

There are two ways to do this. **Use the script — it is faster and avoids mistakes.** Fall back to the manual path only if `python3` is unavailable.

### Path A — fill script (preferred)

Write the audit data to a JSON file, then run the fill script. It computes the overall score, letter grade, every colour, and the card meter bars for you.

1. Write `audit-data.json` in the working directory with this shape:

```json
{
  "screen_name": "Shop Page",
  "brand_name": "Little Joys",
  "audit_date": "2026-05-22",
  "domains": [
    {"name": "Usability & Flow", "weight": 20, "score": 3, "summary": "one line"},
    {"name": "Visual Design & Craft", "weight": 15, "score": 4, "summary": "one line"},
    {"name": "Brand Compliance", "weight": 15, "score": 4, "summary": "one line"},
    {"name": "Content & Communication", "weight": 10, "score": 3, "summary": "one line"},
    {"name": "Accessibility", "weight": 10, "score": 2, "summary": "one line"},
    {"name": "Trust & Credibility", "weight": 20, "score": 4, "summary": "one line"},
    {"name": "Conversion Design", "weight": 5, "score": 3, "summary": "one line"},
    {"name": "Emotional Design", "weight": 5, "score": 3, "summary": "one line"}
  ],
  "strengths": ["strength one", "strength two", "strength three"],
  "findings": [
    {"priority": "P1", "title": "...", "domain": "Accessibility", "issue": "...", "fix": "..."}
  ]
}
```

- `domains` must be all 8, in the order above (the chart axes are positional).
- `weight` is the percentage from the brand file; they sum to 100.
- `findings` — list **every** finding, ordered P1 → P2 → P3. No cap.

2. Run the script (it lives next to the template):

```bash
python3 "<skill-dir>/templates/fill.py" audit-data.json _temp-audit.html
```

### Path B — manual fill (fallback if no python3)

Copy `templates/spider-chart.html` to `_temp-audit.html` and replace the placeholders yourself:

| Placeholder | Replace with |
|-------------|--------------|
| `SCREEN_NAME` / `BRAND_NAME` / `AUDIT_DATE` | Screen name, brand, today's date (YYYY-MM-DD) |
| `OVERALL_SCORE` / `LETTER_GRADE` | Overall score (one decimal) and its grade |
| `OVERALL_COLOR` | Score colour for the overall score (scale below) |
| `BRAND_COLOR` | Brand's primary CTA hex — LJ `#009853`, MM/BBW `#005995` |
| `DOMAIN_n_NAME` / `_WEIGHT` / `_SCORE` / `_SUMMARY` | Per-domain values, 8-domain order |
| `DOMAIN_n_COLOR` | Score colour for that domain's score |
| `DOMAIN_n_BAR_1..5` | First *score*-many bars get the domain's score colour; rest stay `#e5e5e5` |
| `STRENGTH_1..3` | The three strengths |

For findings: the template has **one** `.finding` block between the `FINDINGS_START` / `FINDINGS_END` comments. Duplicate it once per finding, filling `FINDING_PRIORITY` (`P1`/`P2`/`P3`), `FINDING_PILL_CLASS` (`p1`/`p2`/`p3` — lowercase, must match), and `FINDING_TITLE` / `FINDING_DOMAIN` / `FINDING_ISSUE` / `FINDING_FIX`. Keep `.report-footer` as the last element inside the findings section.

**Score colour scale** (for `OVERALL_COLOR`, `DOMAIN_n_COLOR`, filled bars):

| Score | Colour |
|-------|--------|
| 4.5 – 5.0 | `#15803d` (green) |
| 3.5 – 4.49 | `#65a30d` (lime) |
| 2.5 – 3.49 | `#ca8a04` (amber) |
| 1.5 – 2.49 | `#ea580c` (orange) |
| below 1.5 | `#dc2626` (red) |

### Layout rules (baked into the template — don't break them)
- `.cards`, `.card`, `.strengths`, and each `.finding` keep `break-inside: avoid` so Chrome never splits one of those elements across a page boundary.
- The footer stays the last element *inside* the findings section, glued there by `break-before: avoid` so it never strands on an empty page.
- Page 1 is fixed (header + chart + 8 cards). Strengths + all findings start on page 2 and flow onto page 3+ when long. The report is **2 pages or more** — not capped at 2.

Either path leaves the report at `_temp-audit.html` in the user's working directory.

### Convert to PDF (cross-platform)

Detect Chrome and convert to PDF. Try these paths in order:

```bash
# macOS
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="[output].pdf" "[html-path]"

# Linux
google-chrome --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="[output].pdf" "[html-path]"
# or: chromium-browser --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="[output].pdf" "[html-path]"

# Windows (Git Bash / WSL)
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="[output].pdf" "[html-path]"
```

**Detection logic:** Run each Chrome path with `--version` to find which one exists. Use the first one that works.

### Fallback: If Chrome is not found

If no Chrome binary is found, **keep the HTML file** instead of deleting it. Tell the user:
- "Chrome not found — saved as HTML instead of PDF"
- "Open `audit-[screen-name]-[date].html` in any browser and press Cmd+P (or Ctrl+P) to save as PDF"

### Cleanup

- If PDF was generated successfully: delete the temp HTML file, tell user where the PDF is saved.
- If PDF failed: rename `_temp-audit.html` to `audit-[screen-name]-[date].html`, tell user to open it in a browser.

## Step 5: Deep Dive (Only When Asked)

If the user says "deep dive on [domain]" or "deep dive all":
- Provide 3–4 detailed findings per requested domain
- Each finding: severity tag (P1/P2/P3), specific issue with evidence, impact, and detailed fix
- Append to an existing report or output inline

**Do NOT deep dive by default.** Quick scan is the default mode.

## Principles

- **Specific over generic.** Reference actual elements, colors, text from the screenshot.
- **Grounded in brand.** Connect findings to brand colors, typography, personas.
- **Actionable.** Every finding says exactly what to change.
- **Honest.** Don't inflate scores.
- **Concise.** Quick scan should be fast to read. Save detail for deep dive.
