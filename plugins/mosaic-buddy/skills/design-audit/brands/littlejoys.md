# Little Joys — Brand Context for Audit

## Brand Overview
- **Brand**: Little Joys (by Mosaic Wellness)
- **Category**: Children's nutrition and healthy food (ages 2–13+)
- **Mission**: Make healthy eating joyful for kids and stress-free for parents
- **Products**: Nutrimix chocolate powder, multivitamin gummies, chocolate spread, millet snacks, protein bars, flavored milk mixes
- **Logo**: Playful rounded lowercase lettering with childlike handwriting style. Always lowercase "little joys"
- **Market**: Urban India, mobile-first, primarily mothers aged 25–40

## Domain Weights

| Domain | Weight | Why |
|--------|--------|-----|
| Usability & Flow | 20% | Core functionality |
| Visual Design & Craft | 15% | Brand perception |
| Brand Compliance | 15% | Warm playful aesthetic IS the brand promise |
| Content & Communication | 10% | Clarity drives conversion |
| Accessibility | 10% | Inclusion baseline |
| Trust & Credibility | 20% | Critical — parents need to trust what they feed children |
| Conversion Design | 5% | Important but secondary to trust |
| Emotional Design | 5% | Differentiator |

---

## Tone of Voice

- **Warm & Comforting** — like a trusted friend who understands parenting struggles
- **Playful** — childlike energy, never corporate or clinical
- **Reassuring** — "you're making the right choice for your child"
- **Simple & Honest** — transparent about ingredients, no jargon

### Do Use
- "Nutrition they'll actually enjoy"
- "No junk, just joy"
- "Made with love (and real ingredients)"
- "No artificial colors"
- "Clean-label"
- "Kid-approved taste"
- "Expert-backed"

### Don't Use
- "Buy our health supplements"
- "Clinically proven formula"
- "Best price guaranteed"
- Emojis in product UI (use SVG icons instead)

---

## Visual Identity

- **Illustration style**: Flat 2D with subtle 2.5D crayon texture. Soft rounded forms.
- **Photography**: Simple grounded backgrounds, people mid-action. Real moments, not posed.
- **Shapes**: Only organic, soft-edged shapes — blobs, waves, drops. NO sharp corners or geometric patterns.

---

## Design System — Colors

### Core Brand
| Name | Hex | Usage |
|------|-----|-------|
| Banana Yellow | `#F8D759` | Primary brand color, joyful accents, promos |
| Tomato Red | `#E34234` | Energy, appetite, warnings |
| Ocean Blue | `#0085BC` | Trust, calm, informational |
| Spinach Green | `#009853` | Primary CTA, trust signals, certifications |

### Functional
| Name | Hex | Usage |
|------|-----|-------|
| Eggshell | `#FFFEF5` | Page background |
| Kale | `#3A4731` | Headings, dark text |
| Milk | `#F9F7F2` | Default card surface |
| Oat | `#F6F2E8` | Warm card surface, neutral background |
| Muted | `#8A8A7A` | Captions, secondary text |

### Semantic
| Name | Hex | Usage |
|------|-----|-------|
| Trust BG | `#E8F5E9` | Trust badge backgrounds |
| Critical BG | `#FEF2F2` | Error/critical alerts |
| Warning BG | `#FFF8E1` | Warnings, promo surfaces |

---

## Design System — Typography

### Primary Font: MiSans Latin VF
Variable font using weights 380 (regular), 520 (medium), 630 (bold). NOT standard 400/700.

| Style | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| Display | 32px | 630 | 38px | Hero headlines. One per screen max. |
| Heading | 24px | 630 | 30px | Section titles |
| Subheading Lg | 18px | 630 | 24px | Card titles, list headers |
| Subheading | 16px | 520 | 22px | Emphasis text, button labels |
| Body Emphasis | 15px | 520 | 20px | Product names, CTA text, prices |
| Body | 14px | 380 | 20px | Descriptions, paragraphs |
| Small Body | 13px | 380 | 18px | Secondary text, testimonials |
| Caption | 12px | 380 | 16px | Labels, helper text |
| Badge/Tag | 11px | 520 | 16px | Trust badges, category labels (uppercase, letter-spacing: 0.08em) |

### Secondary Font: Alwyn New Rounded
Used for display headlines, hero moments, brand statements, playful accents. Its rounded letterforms complement the organic visual identity. **Using Alwyn alongside MiSans is on-brand — do NOT flag as a violation.**

| Text Example | Size | Weight | Usage |
|------|------|--------|-------|
| "Nutrition they'll actually enjoy" | 32px | Light (300) | Display moments |
| "No junk, just joy" | 28px | Regular (400) | Hero moments |
| "Made with love (and real ingredients)" | 24px | Medium (500) | Brand statements |
| "Kid-approved taste, expert-backed" | 20px | Bold (700) | Playful accents |

---

## Design System — Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| Page padding | `0 20px` | Horizontal screen padding |
| Section gap | `16–24px` | Vertical space between sections |
| Card padding | `14–20px` | Internal card padding |
| Element gap | `6–12px` | Between related items |
| Text gap | `3–6px` | Between heading and body text |
| CTA safe area | `padding-bottom: 28px` | Bottom of screen, below CTA |

### Layout Rules
- All layout uses `display: flex` + `flex-direction` + `gap`
- Use `gap` for spacing, `padding` for containers
- **Never use margins** — flex gap handles all spacing
- Screen dimensions: **375px wide, min-height: 812px**

---

## Design System — Corner Radius

| Element | Radius |
|---------|--------|
| Screen frame | `24px` |
| Cards | `16px` |
| Buttons | `20px` |
| Small buttons | `10px` |
| Images | `12px` |
| Pills/badges | `999px` |

**Rule: No sharp corners anywhere.** All shapes are organic and soft.

---

## Design System — Buttons

### Primary CTA (full-width)
```
background: #009853; color: white; font-weight: 520; font-size: 15px;
padding: 14px 24px; border-radius: 20px; width: 100%;
```
Example: "Add to Cart — ₹499"

### Secondary (outline)
```
background: transparent; border: 1.5px solid #009853; color: #009853;
font-weight: 520; padding: 12px 20px; border-radius: 20px;
```
Example: "View Details"

### Ghost/Subtle
```
background: #F6F2E8; color: #3A4731; font-weight: 520;
padding: 10px 16px; border-radius: 20px;
```
Example: "Browse All"

### Small Inline Action
```
background: #009853; color: white; font-weight: 520; font-size: 13px;
padding: 8px 16px; border-radius: 10px;
```
Example: "Add+"

### Icon Button
```
background: #009853; color: white; width: 36px; height: 36px;
border-radius: 10px; display: flex; align-items: center; justify-content: center;
```

---

## Design System — Card Surfaces

| Variant | Background | Radius | Text Color |
|---------|-----------|--------|------------|
| Default card | `#F9F7F2` (Milk) | `16px` | `#3A4731` |
| Warm card | `#F6F2E8` (Oat) | `16px` | `#3A4731` |
| Dark card | `#3A4731` (Kale) | `16px` | `#FFFEF5` |
| Page bg | `#FFFEF5` (Eggshell) | — | `#3A4731` |

---

## Design System — Badges, Pills & Trust Signals

| Type | Background | Color | Size | Weight | Padding | Radius |
|------|-----------|-------|------|--------|---------|--------|
| Trust pill | `#E8F5E9` | `#009853` | 11px | 520 | `6px 12px` | `999px` |
| Filled trust | `#009853` | white | 11px | 520 | `6px 12px` | `999px` |
| Promo pill | `#F8D759` | `#3A4731` | 11px | 520 | `4px 12px` | `999px` |
| Mini badge | `#E8F5E9` | `#009853` | 10px | 520 | `3px 8px` | `999px` |
| Star rating | — | `#F8D759` | 13px | — | — | — |
| Active tab | `#3A4731` | white | 13px | 520 | `8px 16px` | `999px` |
| Inactive tab | `#F6F2E8` | `#3A4731` | 13px | 380 | `8px 16px` | `999px` |

Star ratings use `★` character repeated (e.g., ★★★★★).
Examples: "No Preservatives", "FSSAI Certified", "20% Off", "Clean Label"

---

## Product Catalog & Pricing

| Product | Category | Price |
|---------|----------|-------|
| Nutrimix Chocolate | Powder | ₹499 |
| Immunity Gummies | Gummies | ₹399 |
| Choco Spread | Spread | ₹349 |
| Protein Bites | Snack | ₹299 |
| Millet Munchies | Snack | ₹249 |

### Pricing Rules
- Always in INR with `₹` symbol
- No decimal places for round numbers (₹499, not ₹499.00)

---

## Target Personas

### 1. Clean Label Parent
**Core Need**: Avoids artificial ingredients, preservatives, added sugars.
**Design Priority**: Ingredient lists, certifications, trust UI front and center.

### 2. Fussy Eaters Parent
**Core Need**: Child rejects healthy food.
**Design Priority**: Taste-first messaging, playful visuals, kid-friendly formats.

### 3. Growth Concerned Parent
**Core Need**: Child underweight or not growing as expected.
**Design Priority**: Nutrition facts, calorie info, transformation stories.

### 4. Immunity Focused Parent
**Core Need**: Boost child's immunity naturally.
**Design Priority**: Key ingredients highlighted, expert/doctor endorsements.

### 5. Milk Resistance Parent
**Core Need**: Child refuses plain milk.
**Design Priority**: Flavor variety, quick-prep messaging, parent testimonials.

### Common Traits
- **Device**: Mobile-first (95% on mobile)
- **Location**: Urban India (metros and tier-1 cities)
- **Age Range**: 25–40 years old
- **Decision Maker**: Primarily mothers
- **Influenced by**: Instagram, parenting communities
- **Key Trust Signals**: Ingredient transparency, certifications, real testimonials, expert endorsements

---

## Design Principles

1. **No sharp corners anywhere** — all shapes are organic and soft
2. **Food-inspired color palette** — bananas, tomatoes, spinach, ocean
3. **Warm, accessible, child-friendly aesthetic** — never corporate
4. **Trust through transparency** — certifications, ingredients, honest copy
5. **Mobile-first** — 375px width is the primary design target
6. **Flex + gap layout** — no margins, consistent spacing system

---

## Key Audit Considerations

- Mobile-first is non-negotiable — 95% of users are on mobile
- Trust & Credibility is heavily weighted (20%) because parents need to trust what they feed their children
- Brand Compliance is weighted at 15% — the warm, playful, organic aesthetic IS the brand promise. Deviations hurt brand perception.
- Every screen should serve at least one persona specifically
- Clean-label positioning must be reflected in clean, transparent UI
- Alwyn New Rounded alongside MiSans is on-brand — do NOT flag as inconsistency
- Page background must be Eggshell (#FFFEF5), not plain white
- ALL interactive elements need 20px or 999px radius — sharp corners are a violation
