# Design Audit Skill

A Claude Code skill that performs structured UX, UI & Brand audits with scoring across 8 domains. Built for Mosaic Wellness brands (Little Joys, Man Matters, Be Bodywise).

Upload a mobile screenshot, get a PDF scorecard with spider chart, scores, strengths, and prioritized findings.

---

## What It Does

1. You share a **mobile screenshot** (or URL)
2. The skill auto-detects the brand (or asks you to pick one)
3. Scores across **8 domains** (1-5 scale, weighted per brand)
4. Outputs a **multi-page PDF** with spider chart, score cards, strengths, and all findings
5. Optionally **deep dive** into specific domains for detailed analysis

---

## Installation

This skill ships as part of the **mosaic-buddy** plugin in the
[`mosaic-wellness/claude-plugins`](https://github.com/mosaic-wellness/claude-plugins) marketplace.

### Requirements
- [Claude Code](https://claude.ai/code) (desktop app, CLI, or IDE extension)
- Claude subscription (Pro or Team)
- Google Chrome (for PDF generation)

### Install
In Claude Code, run:
```
/plugin marketplace add mosaic-wellness/claude-plugins
/plugin install mosaic-buddy
```

### Verify
Type `/design-audit` in Claude Code, or just share a mobile screenshot and ask for an audit. If the skill responds, you're set.

---

## Usage

### Quick Scan (default)
```
/design-audit
```
Share a mobile screenshot. The skill will score all 8 domains and generate a PDF.

### Deep Dive (on request)
```
deep dive on brand compliance and accessibility
```
Returns 3-4 detailed findings per domain with evidence and fixes.

### Example
```
User: /design-audit [uploads mobile screenshot]
Skill: Detected brand: Little Joys. What screen is this?
User: Shop page
Skill: Overall: 3.2 / 5.0 — Grade B
       PDF saved at audit-shop-page-2026-04-13.pdf
```

---

## How It Works — Internal Architecture

### File Structure
```
design-audit/
├── SKILL.md              # The audit engine — all rules, scoring, PDF generation
├── README.md             # This file
├── brands/
│   ├── littlejoys.md     # LJ brand: colors, typography, 5 personas, design system
│   ├── manmatters.md     # MM brand: Athena tokens, 2 personas, 3D illustration rules
│   └── bebodywise.md     # BBW brand: colors, 12 personas, Lucide icons, Gambetta font
└── templates/
    ├── spider-chart.html # HTML template for the PDF — chart + score cards + findings
    └── fill.py           # Fills the template from an audit JSON (token-light path)
```

### Flow

```
User uploads screenshot
    │
    ▼
Step 1: Detect brand (or ask)
    │  Look for logos, brand colors, product type
    │  If unclear → stop and ask user to pick
    │
    ▼
Step 2: Load brand context
    │  Read brands/{brand}.md
    │  Contains: colors (hex), typography, components, personas, weights, audit rules
    │
    ▼
Step 3: Quick Scan
    │  Score all 8 domains (1-5)
    │  One-line summary per domain
    │  3 strengths + all findings (ordered P1 > P2 > P3)
    │
    ▼
Step 4: Generate PDF
    │  Write audit data as JSON, run templates/fill.py
    │  (falls back to filling the template by hand if no python3)
    │  Convert to PDF via Chrome headless
    │  Falls back to HTML if Chrome not found
    │
    ▼
Output: multi-page PDF scorecard
```

### Scoring Engine

**Each domain is scored 1-5:**

| Score | Meaning |
|-------|---------|
| 1 | Broken — critical issues |
| 2 | Significant problems — below acceptable |
| 3 | Meets basic expectations — functional but unremarkable |
| 4 | Good — minor issues only |
| 5 | Excellent — best-in-class, could be a reference |

**Finding severity:**

| Tag | Meaning | Action |
|-----|---------|--------|
| P1 | Critical — blocks tasks, damages trust | Fix immediately |
| P2 | Important — degrades experience noticeably | Fix soon |
| P3 | Polish — minor improvement | Fix when time allows |

**Overall score** = weighted average of all 8 domain scores (each domain's 1–5 score × its weight, summed). Rounded to one decimal.

**Grade bands:**

| Grade | Score range | Grade | Score range |
|-------|-------------|-------|-------------|
| A  | 4.5 – 5.0  | C+ | 2.5 – 2.99 |
| A− | 4.0 – 4.49 | C  | 2.0 – 2.49 |
| B+ | 3.5 – 3.99 | D  | 1.5 – 1.99 |
| B  | 3.0 – 3.49 | F  | below 1.5  |

---

## Domain Weights by Brand

Each brand has different weights because different things matter most to their audience.

| Domain | Little Joys | Man Matters | Be Bodywise | Why it differs |
|--------|:-----------:|:-----------:|:-----------:|----------------|
| Usability & Flow | 20% | 20% | 20% | Core for everyone |
| Visual Design & Craft | 15% | 15% | 15% | Brand perception |
| Brand Compliance | **15%** | 10% | 10% | LJ's warm aesthetic IS the brand promise |
| Content & Communication | 10% | 10% | **15%** | BBW has complex health topics (PCOS, hairfall stages) |
| Accessibility | 10% | 10% | 10% | Baseline for all |
| Trust & Credibility | **20%** | **20%** | 15% | Parents (LJ) and men with sensitive health (MM) need more trust |
| Conversion Design | 5% | **10%** | 10% | Men (MM) are more transactional buyers |
| Emotional Design | 5% | 5% | 5% | Differentiator for all |

### Why these weights?

- **Little Joys**: Trust (20%) and Brand Compliance (15%) are highest because parents need to trust what they feed their children, and the warm/playful aesthetic IS the brand promise — a cold design feels wrong even if functional.
- **Man Matters**: Trust (20%) and Conversion (10%) are weighted up because men dealing with sensitive health topics (hair loss, sexual health) need reassurance, and they tend to be more transactional in purchase behavior.
- **Be Bodywise**: Content (15%) is weighted higher because the brand covers complex health topics (PCOS, hormonal health, hairfall stages) that need clear, jargon-free explanation. Trust (15%) matters for clinical claims.

---

## Brand Context Files — What's Inside

Each brand file in `brands/` contains everything the AI needs to ground its audit. If you want to refine a brand's scoring, edit its file.

### What each brand file contains

| Section | What it defines | Why it matters for the audit |
|---------|----------------|------------------------------|
| **Brand Overview** | Name, category, mission, products, market | Sets the overall context |
| **Domain Weights** | Per-domain scoring weights (must total 100%) | Controls how the overall score is calculated |
| **Voice & Tone** | Do/Don't examples, tone by state | Grounds Content & Communication scoring |
| **Colors** | Every hex code with usage rules | Grounds Brand Compliance — wrong colors get flagged |
| **Typography** | Font families, weights, sizes, line heights | Wrong fonts/sizes get flagged |
| **Spacing & Layout** | Padding, gaps, grid rules | Inconsistent spacing gets flagged |
| **Components** | Buttons, cards, badges, pills with full CSS specs | Deviations from component specs get flagged |
| **Icons** | Icon library, style, sizes | Wrong icon style gets flagged (e.g., filled vs outlined) |
| **Illustrations & Imagery** | Photography style, illustration rules | Off-brand imagery gets flagged |
| **Logo** | Usage rules, variants, clear space | Logo violations get flagged |
| **Target Personas** | Who the users are, their needs, pain points | Findings reference specific personas |
| **Accessibility** | WCAG level, min touch targets, contrast ratios | Accessibility scoring criteria |
| **Competitive Context** | How the brand differentiates | Helps identify when design looks too similar to competitors |
| **Key Audit Considerations** | Brand-specific rules and gotchas | Prevents false positives (e.g., "Alwyn font is NOT a violation for LJ") |

### Key differences between brands

| | Little Joys | Man Matters | Be Bodywise |
|---|---|---|---|
| **Primary font** | MiSans Latin VF | MiSans Latin VF | Mi Sans |
| **Display font** | Alwyn New Rounded | Begum | Gambetta (serif) |
| **Icons** | SVG (custom) | Material Symbols Rounded | Lucide (outlined, 1.5px) |
| **Illustrations** | Flat 2D, crayon texture | 3D matte-textured objects | Premium 3D realistic |
| **Page background** | Eggshell #FFFEF5 (warm) | White #FFFFFF (clean) | White #F5F5F5 (clean) |
| **Corner radius** | No sharp corners (organic) | Varies by component (4-128px) | Clean, geometric |
| **CTA color** | Spinach Green #009853 | Electric Blue #005995 | Blue Deep #005995 |
| **Touch targets** | 44px minimum | 48px minimum | Standard |
| **Personas** | 5 parent types | 2 professional types | 12 concern-based + 3 states |

---

## Modifying a Brand

### Changing weights
Open `brands/{brand}.md` and edit the **Domain Weights** table. Weights must add up to 100%.

### Adding colors/typography
Add entries to the relevant tables. Include hex codes — the AI uses these to check actual screenshots against the spec.

### Adding personas
Add a new persona section. Include: who they are, their goals, pain points, and design implications. The AI will reference specific personas in its findings.

### Adding audit rules
Add entries to the **Key Audit Considerations** section at the bottom. These are the brand-specific "gotchas" — things that should or shouldn't be flagged. Example: "Alwyn New Rounded alongside MiSans is on-brand — do NOT flag as inconsistency."

---

## Adding a New Brand

1. Create `brands/yourbrand.md`
2. Follow the structure of any existing brand file (littlejoys.md is the most complete reference)
3. Must include at minimum: brand overview, domain weights, colors with hex, typography, and at least one persona
4. Add brand detection clues to `SKILL.md` (logo keywords, brand colors, product types)
5. The skill will automatically load the new brand file when selected

---

## PDF Output

- **Page 1 is fixed**: header + score + spider chart + 8 score cards. Page 2 onward: strengths + all findings + footer.
- The report is **2 pages or more** — short audits fit in 2, longer ones flow onto page 3+.
- Cards, strengths, and individual findings use `break-inside: avoid` so no single element splits across a page break
- Cross-platform Chrome detection: macOS, Linux, Windows
- Falls back to HTML if Chrome isn't installed (user can Cmd+P to save as PDF)
- Spider chart uses Canvas 2D rendering — no external dependencies

---

## Rules

- **Mobile-first**: Desktop screenshots are rejected. 95% of users are on mobile.
- **Brand detection**: If the brand can't be identified, the skill stops and asks.
- **Specific over generic**: Every finding references actual elements from the screenshot.
- **Honest scoring**: 3/5 means "meets basic expectations." Scores are not inflated.
- **Actionable fixes**: Every finding includes a specific, implementable recommendation.
- **Brand-grounded**: Findings connect to the brand's actual colors, typography, personas, and values.
- **Screenshot preferred over URL**: Screenshots give more accurate visual analysis.

---

Built at Mosaic Wellness for the product design team. Powered by [Claude Code](https://claude.ai/code).
