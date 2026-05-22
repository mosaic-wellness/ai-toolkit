# Man Matters — Brand Context for Audit

## Brand Overview
- **Brand**: ManMatters (by Mosaic Wellness)
- **Category**: Men's health & wellness, DTC
- **Market**: India
- **Platform**: Mobile-first (iOS + Android) + Web
- **Tagline**: Science-backed solutions for men
- **Products**: Hair care, beard care, sexual wellness, weight management, supplements
- **Differentiator**: Calm, trust-led UX — medical credibility without intimidation, strong focus on discretion
- **Design System**: Athena Design System (token-based, styled-components)

## Domain Weights

| Domain | Weight | Why |
|--------|--------|-----|
| Usability & Flow | 20% | Core functionality |
| Visual Design & Craft | 15% | Brand perception |
| Brand Compliance | 10% | Athena system is well-defined but less visually distinctive than LJ |
| Content & Communication | 10% | Must normalize taboo topics clearly |
| Accessibility | 10% | WCAG 2.1 AA target, 48px touch targets |
| Trust & Credibility | 20% | Critical for sensitive health topics (hair loss, sexual health) |
| Conversion Design | 10% | Men are more transactional buyers |
| Emotional Design | 5% | Discretion and calm are the emotional goals |

---

## Design Principles

1. **Discretion first** — Reduce anxiety, never amplify it. Never draw attention to sensitive health data. Give users control over what is visible.
2. **Clarity over persuasion** — Explain before selling. Be the most honest, clearest voice in a category full of exaggerated claims.
3. **Consistency builds trust** — Predictable UI across all journeys. Users should never have to relearn how the app works.

---

## Voice & Tone

**Primary voice**: Confident, reassuring, non-judgmental, science-led.

ManMatters normalises conversations about men's health. The tone is always on the side of the user — never clinical, never alarmist, never condescending.

### Do
- Be clear and direct — short sentences, plain language
- Normalise the health topic — treat it as routine, not shameful
- Respect privacy — never surface sensitive health data unnecessarily
- Use simple language — no jargon, no Latin, no acronyms without explanation
- Lead with reassurance in error and loading states

### Don't
- Be alarmist or use fear-based framing
- Use medical or technical jargon in user-facing copy
- Overpromise results — "may help" over "will cure"
- Use humour around sensitive topics (sexual health, hair loss, weight)
- Write long, hedging paragraphs — say it once, say it clearly

### Copy Tone by State
| State | Tone | Example |
|-------|------|---------|
| Success | Understated confidence | "Done." / "Sorted." / "You're all set." |
| Error | Calm, no blame | "Something didn't go through. Please try again." |
| Empty state | Helpful, not apologetic | "Nothing here yet." + clear next action |
| Loading | Neutral, not cutesy | "Loading…" — no puns, no excessive personality |
| Onboarding | Warm, matter-of-fact | Explain what's happening and why |
| Sensitive topic | Factual, normalising | Never euphemise, never dramatise |

---

## Design System — Colors

### Brand
| Token | Value | Hex | Usage |
|-------|-------|-----|-------|
| BRAND[1] | ELECTRIC_BLUE[10] | `#E6F5FF` | Lightest brand surface |
| BRAND[2] | ELECTRIC_BLUE[20] | `#BADCF0` | Light brand bg |
| BRAND[3] | ELECTRIC_BLUE[30] | `#A1CBE6` | Medium brand |
| BRAND[4] | ELECTRIC_BLUE[40] | `#4292C7` | Hover state |
| BRAND[5] | ELECTRIC_BLUE[50] | `#005995` | **Primary brand color** — CTAs, brand text |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| TEXT.PRIMARY | `#212121` | Main body text |
| TEXT.SECONDARY | `#666666` | Supporting text |
| TEXT.TERTIARY | `#8D8D8D` | Hints, meta |
| TEXT.SUBTLE | `#9E9E9E` | Subtle labels |
| TEXT.DISABLED | `#C6C6C6` | Disabled text |
| TEXT.INVERSE | `#FFFFFF` | Text on dark/brand backgrounds |
| TEXT.BRAND.DEFAULT | `#005995` | Brand-colored text |

### Background
| Token | Hex | Usage |
|-------|-----|-------|
| BACKGROUND[0] | `#FFFFFF` | Primary page bg (white) |
| BACKGROUND[1] | `#F5F5F5` | Secondary bg (light gray) |
| BACKGROUND[2] | `#E3E3E3` | Tertiary bg |
| BACKGROUND[3] | `#C6C6C6` | Heavy bg |
| BACKGROUND.DISABLED | `#F5F5F5` | Disabled state bg |
| BACKGROUND.INVERSE | `#000000` | Dark bg |
| BACKGROUND.POP | `#FFFFCC` | Promotional/highlight bg |

### Border
| Token | Hex | Usage |
|-------|-----|-------|
| BORDER[0] | `#F5F5F5` | Lightest border |
| BORDER[1] | `#E3E3E3` | Standard border |
| BORDER.HOVER | `#C6C6C6` | Hover state |
| BORDER.SELECTED | `#9E9E9E` | Selected state |
| BORDER.BRAND.DEFAULT | `#005995` | Brand-accent border |

### Feedback
| Category | Light BG | Medium BG | Solid |
|----------|---------|----------|-------|
| Error | RED[10] | RED[20] | RED[50] |
| Success | GREEN[10] | GREEN[20] | GREEN[50] |
| Warning | YELLOW[10] | YELLOW[20] | YELLOW[50] |
| Info | ELECTRIC_BLUE[10] | ELECTRIC_BLUE[20] | ELECTRIC_BLUE[50] |

---

## Design System — Typography

### Primary Font: MiSans Latin VF
Same variable font as Little Joys. Weights: 380 (regular/medium), 520 (semibold), 630 (bold).

### Display Font: Begum
Used for hero titles, marketing surfaces, brand campaign moments, large display headings only. **Never for body text, buttons, captions, form labels, or dense UI.**

### Type Scale (Mobile)

| Category | Variant | Size | Weights |
|----------|---------|------|---------|
| Caption | caption-1 | 8px | reg/med/bold |
| Caption | caption-2 | 10px | reg/med/bold |
| Caption | caption-3 | 13px | reg/med/bold (uppercase, letter-spacing: 1.2px) |
| Caption | caption-4 | 16px | reg/med/bold (uppercase, letter-spacing: 1.2px) |
| Body | body-1 | 13px | reg/med/bold |
| Body | body-2 | 13px | reg/med/bold |
| Body | body-3 | 14px | reg/med/bold |
| Body | body-4 | 16px | reg/med/bold |
| Button | btn-1 | 13px | — |
| Button | btn-2 | 14px | — |
| Button | btn-3 | 16px | — |
| Title | title-1 | 16px | reg/med/bold |
| Title | title-2 | 18px | reg/med/bold |
| Title | title-3 | 20px | reg/med/bold |
| Title | title-4 | 24px | reg/med/bold |
| Title | title-5 | 28px | reg/med/bold |
| Title | title-6 | 36px | reg/med/bold |

---

## Design System — Spacing

Scale: `0, 1, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 60, 64, 72, 80, 100, 120, 128`
Use only values from this scale — no arbitrary pixel values.

---

## Design System — Border Radius

| Value | Usage |
|-------|-------|
| 0px | Full-width buttons |
| 4px | Tiny buttons |
| 6px | Small buttons |
| 8px | Medium/Large buttons, standard cards |
| 12px | Cards, panels |
| 16px | Large cards |
| 20-24px | Rounded surfaces |
| 128px (round) | Pills, circular elements |

---

## Design System — Buttons

### Variants & Colors
| Variant | Background | Border | Text |
|---------|-----------|--------|------|
| Primary | `#005995` (BRAND[5]) | `#005995` | White |
| Primary (hover) | `#4292C7` (BRAND[4]) | `#4292C7` | White |
| Primary (disabled) | `#F5F5F5` | `#F5F5F5` | `#C6C6C6` |
| Secondary | `#FFFFFF` | `#E3E3E3` | `#005995` |
| Tertiary | transparent | none | `#005995` |
| Link | transparent | none | `#005995` |

### Sizes (Mobile)
| Size | Height | Radius |
|------|--------|--------|
| Tiny | 24px | 4px |
| Small | 32px | 6px |
| Medium | 40px | 8px |
| Large | 48px | 8px |
| Full | 60px | 0px |

---

## Design System — Icons

**Google Material Symbols (Rounded)** — not the legacy Material Icons.
- Weight: 400, Grade: 0, Optical Size: 24px
- Fill: 0 (rounded/resting) or 1 (filled/active)
- Default size: 24px
- Always use `fill="currentColor"` — color via `--athena-theme-color-icon-*` tokens
- **Never** use font-based icon rendering

---

## Design System — Illustrations & Imagery

### Illustration Style
**Matte-textured 3D object realism** — warm-lit, front-facing, grain-surfaced illustrations. Not smooth CGI, not flat illustration.

Key characteristics:
- Fine, uniform **grain/matte texture** on ALL surfaces (the style's fingerprint)
- Soft, diffuse, front-biased lighting — no harsh shadows
- Front-facing or slight 3/4 angle
- Objects fill 70-85% of canvas
- Two background modes: warm cream tile (`#F5EDD8`–`#FAF0DC`) or transparent

### Do
- Always include grain/matte texture
- Use front-facing perspective for single objects
- Use ₹ for all currency references (Indian market)
- Keep to one dominant object per illustration

### Don't
- Use smooth, glossy, or clay-like renders
- Mix flat 2D with 3D illustration in the same screen
- Use cartoon or character-based illustration — no faces, no people
- Use cool-dominant or dark/moody colour schemes
- Use $ or € symbols

### Photography
- Product shots: Clean white/neutral background, studio lighting
- Lifestyle: Warm natural light, real men (not models), everyday settings
- Reflect Indian male demographic — avoid Western-default casting
- **No overly perfect** hair/skin/body — honest, not vanity-driven

---

## Design System — Logo

### App Logo
Stylised "M" droplet on brand gradient (`#27649B` → `#254078`). Three shapes: circle (rx:135), rounded rect (rx:80), square (rx:0).
**Never recolour** the app logo.

### Wordgram
Full "manmatters®" logotype. Three variants:
| Variant | Fill | Use on |
|---------|------|--------|
| Default | `#285389` | White/light backgrounds |
| On dark | `#FFFFFF` | Dark backgrounds |
| On light | `#212121` | Light grey surfaces |

**Logo gradient colors are NOT the same as Athena ELECTRIC_BLUE palette — do not substitute.**

---

## Target Personas

### Primary: Urban Professional
- **Age**: 25–35
- **Profile**: Tech-savvy, working professional in Tier 1/2 Indian cities
- **Goals**: Prevent hair loss, improve confidence, access discreet healthcare
- **Pain points**: Confusion from conflicting information, embarrassment, lack of trustworthy guidance
- **Emotional context**: Wants privacy, reassurance, and control
- **Design implication**: Move fast, respect time, keep health data private, don't over-explain

### Secondary: Settled Professional
- **Age**: 32–45
- **Profile**: Career-stable, family-oriented, more skeptical of DTC
- **Goals**: Long-term wellness, sexual health confidence, managing lifestyle conditions
- **Pain points**: Time constraints, skepticism about online-only solutions, wants evidence not marketing
- **Design implication**: Surface credibility signals (doctor endorsement, clinical evidence), allow deeper reading

---

## Accessibility Requirements

| Requirement | Specification |
|-------------|---------------|
| Standard | WCAG 2.1 Level AA |
| Min touch target | **48×48px** (not 44px like LJ) |
| Body text contrast | 4.5:1 minimum |
| Large text contrast | 3:1 (≥18px regular or ≥14px bold) |
| Focus states | All interactive elements must have visible focus indicators |
| Color alone | Never use color as the only means of conveying information |

---

## Competitive Context

| Competitor | Their UX | ManMatters' differentiation |
|-----------|---------|---------------------------|
| Traya | Aggressive diagnostic, urgency-heavy | Calmer onboarding, no fear tactics |
| Vedix | Ayurvedic authority, traditional tone | Science-backed, modern, evidence-led |
| Bold Care | Bold, sexual wellness focused | Broader wellness, more discreet |

---

## Key Audit Considerations

- **Discretion is paramount** — sensitive health data must never be visible by default
- Trust & Credibility (20%) is the highest-weighted domain — users are dealing with embarrassing topics
- Conversion (10%) is weighted higher than LJ — men are more transactional
- Page background is white (#FFFFFF), not warm like LJ — clean, clinical, modern
- Brand color is Electric Blue (#005995) — all CTAs and brand text should use this
- Touch targets are 48×48px (stricter than LJ's 44px)
- Illustrations are 3D matte-textured objects — NOT flat 2D like LJ. Flagging 3D illustrations as off-brand is WRONG.
- Begum font for display/hero only — using it in body text or UI is a violation
- MiSans is shared with LJ — same weights (380/520/630)
- No fear-based or alarmist copy — flag any "your hair is falling out!" type messaging
- Icons must be Google Material Symbols Rounded — not custom, not legacy Material Icons
