# PDP Narrative Compilation

How to translate a raw advertising / marketing narrative into a concrete PDP variant — beats extracted, layout planned, modifications listed.

Read this as the LLM logic the skill runs in steps 2–3 of `narrative-experiment-flow.md`. The output of this doc is the input to the operator preview and to `create_pdp_experiment`.

---

## Stage 1 — Decompose the narrative into beats

A narrative is a short text the operator pastes: an ad script, a campaign brief, a positioning angle. It rarely says "the hook is X, the proof is Y". The skill has to extract structured beats.

### The 7-beat schema

| Beat | Question it answers | Example phrase from a narrative |
|------|---------------------|---------------------------------|
| **HOOK** | What's the opening promise? | "Tired of waking up with thinning hair?" |
| **VILLAIN** | What's the problem the customer feels? | "Stress is silently killing your hair follicles" |
| **MECHANISM** | What does the product actually do? | "Our minoxidil 5% reactivates dormant follicles in 8 weeks" |
| **PROOF** | What credibility does the brand show? | "Dermatologist-recommended, used by 50,000+ men" |
| **PERSONA** | Who is this for? | "For new dads, busy professionals, men 28–40" |
| **OBJECTIONS** | What hesitations to address? | "Wondering if it's safe? Won't make my scalp itchy?" |
| **CLOSE** | What action frames best? | "Take back your hair routine in under 60 seconds a day" |

Extraction is best-effort: not every narrative carries every beat. Skill marks absent beats explicitly so the operator can fill gaps if desired.

### Extraction prompt structure

```
You are extracting narrative beats from an ad / campaign narrative.

For each of HOOK, VILLAIN, MECHANISM, PROOF, PERSONA, OBJECTIONS, CLOSE:
- Quote the phrase(s) in the source that express this beat (verbatim, no paraphrase).
- If absent in the source, output null. Do not invent.

Source narrative:
"""<operator's raw text>"""

Output as JSON:
{
  "hook":        { "present": bool, "quote": "..." | null },
  "villain":     { "present": bool, "quote": "..." | null },
  "mechanism":   { "present": bool, "quote": "..." | null },
  "proof":       { "present": bool, "quote": "..." | null },
  "persona":     { "present": bool, "quote": "..." | null },
  "objections":  { "present": bool, "quote": "..." | null },
  "close":       { "present": bool, "quote": "..." | null }
}
```

Verbatim quoting (not paraphrase) is important — it lets the skill show the operator "this is what I read as the HOOK" without ambiguity.

---

## Stage 2 — Sample brand voice

Before generating any copy, the skill samples 2–3 existing PDPs on the same brand to extract tone patterns and the *vocabulary actually in use*.

### Sampling protocol

```
1. list_pdp_pages(brand) → pick 2–3 most-recently-updated PDPs that are NOT the control
2. For each sampled PDP: get_pdp_summary  (lightweight — title, hero copy, USPs)
3. Aggregate:
   - Tone signals: sentence length, formality, hedging frequency, second-person address
   - Claim verbs in use: "helps", "supports", "promotes", "boosts" — record the set
   - Forbidden patterns (inferred): if absent across all samples, do NOT introduce
```

### Claim-verb whitelist

Output of sampling is a per-session whitelist:

```
ALLOWED_CLAIM_VERBS = { verbs appearing in ≥1 sampled PDP }
FORBIDDEN_PATTERNS  = { "cure", "guarantee", "prevent", "treat", "diagnose",
                        "100%", "no side effects", ... }
                      ∪ { strong verbs absent from all samples }
```

When generating variant copy, the skill MUST NOT introduce verbs from FORBIDDEN_PATTERNS. Skill flags the operator if the narrative's source text requires a forbidden verb to express the intended beat — operator must explicitly approve before the skill writes.

This is the compliance guard for health brands. It's lighter than an authored claim-allowlist (which we deliberately punted on) but catches the obvious regulatory traps.

---

## Stage 3 — Map beats to narrative codes

The narrative beats from Stage 1 map to the **12 narrative codes** documented in `pdp-widget-specs/widgets/_conventions.md`:

| Beat | Default narrative code(s) | Notes |
|------|---------------------------|-------|
| HOOK | `HERO` | Lands on the gallery + PRODUCT_SUMMARY copy, sometimes a hero BANNER |
| VILLAIN | `STORY` or `EVIDENCE` (if data-led) | The "problem" framing widget — `MEDIA_TEXT_BLOCK`, `NARRATIVE_AND_FACTS` |
| MECHANISM | `EVIDENCE` or `SHOWCASE` | `STATS_TILES_WITH_DESCRIPTION`, `MEDIA_WITH_HEADER_SLIDER`, `INFO_LIST_WITH_ICONS` |
| PROOF | `PROOF` (social) or `EVIDENCE` (brand-asserted) | `RATINGS_AND_REVIEWS`, `TESTIMONIALS`, `STATS_TILES_WITH_DESCRIPTION`, `COMPARISON_TABLE` |
| PERSONA | Subtext in `HERO` + `STORY` widget copy | Rarely a dedicated widget; influences tone everywhere |
| OBJECTIONS | `OBJECTION` | `FAQ_ACCORDION`, `QNA`, `ACCORDION` |
| CLOSE | `COMMIT` + `NUDGE` | `PRODUCT_CALL_TO_ACTION`, `PRODUCT_FOOTER_STICKY`, `OFFER_NUDGE_CARD`, CTA copy |

### Two-zone planning

**Top-fold zone (`widgets[0..5]`) — content edits only.**

The three anchors (gallery + optional TAG_MEDIA + PRODUCT_SUMMARY) carry HOOK + the first PERSONA cue. The skill rewrites their copy fields to lead with the narrative's HOOK:

- `PRODUCT_SUMMARY.productSummary.subtitle` → HOOK fragment if short, else the PERSONA framing
- `PRODUCT_SUMMARY.productSummary.highlights[].text` → 2–3 mechanism-led bullets ("Activates dormant follicles", "5% minoxidil dermatologist formula", "Visible in 8 weeks")
- Gallery `items[].altText` → hook-aligned alt text (SEO + accessibility)

The skill MUST NOT add/remove/reorder anchors. See `first-fold-rules.md` for the validator.

**Below-fold zone (`widgets[6..]`) — full composition.**

The skill plans a narrative arc using the narrative codes. Default arc, walked top-to-bottom:

```
HERO   (already in top fold)
  ↓
STORY     → MEDIA_TEXT_BLOCK or NARRATIVE_AND_FACTS — open the VILLAIN
  ↓
EVIDENCE  → STATS_TILES_WITH_DESCRIPTION or BENEFITS_HIGHLIGHTS — explain MECHANISM
  ↓
SHOWCASE  → MEDIA_WITH_HEADER_SLIDER — visualize how it works
  ↓
PROOF     → RATINGS_AND_REVIEWS + TESTIMONIALS — close the social-proof gap
  ↓
OBJECTION → FAQ_ACCORDION — handle hesitations
  ↓
COMMIT    → PRODUCT_CALL_TO_ACTION (sticky), CLOSE phrasing on CTA label
  ↓
LOGISTICS → CHECK_DELIVERY_INFO — concrete delivery promise
  ↓
EXPAND    → MULTI_PRODUCT_SELECTOR or PRODUCT_CARD_SLIDER — adjacent suggestions
```

Default doesn't mean mandatory. The skill should keep most of the control PDP's below-fold widgets intact and **only** add/remove/reorder where the narrative explicitly calls for it. Aggressive rewriting bricks the page and confuses attribution.

---

## Stage 4 — Build the modifications list

Output of compilation is a list of `{ json_path, value, narrative_reason }`:

```
[
  {
    "json_path": "widgets[0].widgetData.productSummary.subtitle",
    "value": "Lost in a sea of diapers AND hair fall?",
    "narrative_reason": "HOOK — reframes loss as relatable persona (new dad)",
    "edit_safety": "🟢"
  },
  {
    "json_path": "widgets[0].widgetData.productSummary.highlights[0].text",
    "value": "Activates dormant follicles",
    "narrative_reason": "MECHANISM — mechanism-led first bullet",
    "edit_safety": "🟢"
  },
  {
    "json_path": "widgets[7].widgetData.mainTitle",
    "value": "Stress is silently killing your hair",
    "narrative_reason": "VILLAIN — opens the story arc below the fold",
    "edit_safety": "🟢"
  },
  {
    "json_path": "widgets[13].widgetData.accordionItems[3]",
    "value": { "question": "Will this affect my baby if I'm holding them?",
                "answer": "..." },
    "narrative_reason": "OBJECTIONS — new-dad-specific concern",
    "edit_safety": "🟡 — new claim about safety; needs sample-set verification"
  }
]
```

Every modification carries an `edit_safety` label derived from the per-widget spec's field table. 🔴 modifications are **rejected before they reach the operator** — the compiler should not emit them.

For widget add / remove / reorder (below-fold only), modifications use array-mutation paths the way admin-mcp expects (full array replacement at the parent path is the safest pattern):

```
{
  "json_path": "widgets",
  "value": [ ...complete new widget array... ],
  "narrative_reason": "Add VILLAIN widget at index 7; reorder PROOF before EVIDENCE"
}
```

When mutating the whole array, the first-fold validator re-runs on the new array before write.

---

## Stage 5 — Render the story map

The operator preview is the most important UX moment. Render the modifications as a **story map** — group by widget, narrative role, and the change:

```
NARRATIVE: "Hair loss recovery for new dads — stress is the villain,
            dermatologist-approved is the proof"
BRAND VOICE: sampled from minoxidil-5-hair-growth.json, hair-fall-shampoo.json
ALLOWED CLAIM VERBS: helps, supports, activates, reactivates, promotes
COMPLIANCE FLAGS: none

VARIANT: minoxidil-5-hair-growth-exp-stressed-dads-v1
─────────────────────────────────────────────────────────────────────

TOP-FOLD (widgets[0..5]) — content edits only
  [0] CAROUSEL_WITH_THUMBNAIL    🟢 alt text aligned to HOOK
  [1] TAG_MEDIA                   no change
  [2] PRODUCT_SUMMARY             🟢 subtitle: "Lost in a sea of diapers AND hair fall?"
                                  🟢 highlights[0]: "Activates dormant follicles"
                                  🟢 highlights[1]: "Dermatologist-recommended formula"
                                  🟢 highlights[2]: "Visible in 8 weeks"

BELOW-FOLD
  [7]  MEDIA_TEXT_BLOCK           🟢 NEW — VILLAIN beat opens story:
                                          "Stress is silently killing your hair"
  [8]  STATS_TILES_WITH_DESCRIPTION  🟡 EDIT — MECHANISM beat with 8-week stat
                                              (verified against sampled set)
  [9–10] MEDIA_WITH_HEADER_SLIDER    no change
  [11] RATINGS_AND_REVIEWS        no change (PROOF — keeps control reviews)
  [12] TESTIMONIALS               🟢 REORDER — moved above FAQ for late-funnel reassurance
  [13] FAQ_ACCORDION              🟡 ADD — new objection item:
                                         "Will this affect my baby if I'm holding them?"
                                         (new claim — operator must approve)
  [14] PRODUCT_CALL_TO_ACTION     🟢 CTA label: "Reclaim your hair, not your sleep"

VALIDATION: ✅ first-fold rules pass (g=0 < t=1 < s=2, all < 6, canonical)
COMPLIANCE: 1 🟡 flag — new safety claim in FAQ. Operator must explicitly approve.
PERMISSIONS:  Requires all_pages.edit on brand mm. Your context: ✓ allowed.

[ approve | edit a widget | regenerate ]
```

Story map columns:
- Widget index + type + (id if relevant)
- Edit-safety marker for each change
- One-line narrative reason
- Old → new diff snippet (collapsed by default; expand on operator request)

---

## Stage 6 — Iterative refinement

After preview, the operator can:

- **Approve** → proceed to write
- **Edit a widget** → operator gives a specific change ("make hero more emotional", "drop the testimonials swap") → skill regenerates only that widget's modifications, re-runs validation, re-renders preview
- **Regenerate** → skill rolls a new compilation from scratch (preserving the narrative + voice + perms — only the layout/copy changes)

The skill should **not** auto-approve. Even when validation passes and compliance is clean, the operator must explicitly confirm before any admin-mcp write fires.

---

## Edge cases

- **Narrative is too vague** (e.g. "make it more premium") — skill should ask 1–2 clarifying questions before extraction. Example: "What audience does 'premium' speak to? Is the premium signal price, packaging, ingredients, or expertise?"
- **Narrative names a competitor** — strip the competitor name from copy outputs; comparative claims belong in `COMPARISON_TABLE` widget content which is heavily 🟡 and should require explicit operator approval.
- **Narrative is in a language not in `ctx.languages`** — fail early in Stage 0 (auth pre-flight in the flow doc). The skill cannot generate language variants its caller can't write.
- **Narrative produces zero below-fold changes** — that's a valid outcome (some narratives only reshape the hook). Skill should still write the variant and explain in handoff: "below-fold left intact; this experiment isolates the hero rewrite."
- **Narrative produces a complete page redesign** — skill should push back: "this looks like a full retrofit, not an A/B test. Consider scoping to the top 3 changes by narrative impact?" Heuristic: if modifications touch > 8 widgets, surface the warning.

---

## What this doc does NOT cover

- The admin-mcp tool sequence (see `narrative-experiment-flow.md`)
- The first-fold validator algorithm (see `first-fold-rules.md`)
- Per-widget field tables and edit-safety markers (see `pdp-widget-specs/widgets/<TYPE>.md` for each type)
- The 12 narrative code definitions (see `pdp-widget-specs/widgets/_conventions.md`)
