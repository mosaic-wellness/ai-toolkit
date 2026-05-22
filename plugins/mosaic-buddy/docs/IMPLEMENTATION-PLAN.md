# Implementation Plan: mosaic-buddy Plugin Redesign

## Context

The mosaic-buddy plugin is being repurposed from an AI-app development tool into a **single-stop technical co-pilot for non-engineering teams**. The SPEC.md and REQUIREMENTS.md define the full vision and testable acceptance criteria. This plan sequences the implementation into phases that build on each other, so each phase produces a usable increment.

**Key constraint:** Each phase should be independently testable. Don't build agents that depend on skills/references that don't exist yet.

---

## Phase 1: Foundation (Skills + References + CLAUDE.md + AGENTS.md)

**Why first:** Every agent reads these. Without them, agent prompts have no knowledge base to reference.

### Steps:

1. **Update `skills/conventions/SKILL.md`** (already exists, 443 lines)
   - Review and align with REQUIREMENTS.md GR-1 through GR-10
   - Ensure the 10 golden rules are encoded
   - Ensure approved stack section matches GR-10 (auth clarification)
   - Add TLDR-first output pattern (GR-2) as a communication rule
   - Add the "So What?" test (GR-7) as guidance

2. **Update `skills/ai-app-conventions/SKILL.md`** (already exists, 628 lines)
   - Review and ensure model selection, cost management, MCP conventions are current
   - Trim any content that duplicates the conventions skill

3. **Create `skills/ux-heuristics/SKILL.md`** (new)
   - Nielsen's 10 simplified for internal tools
   - Data table patterns, progressive disclosure rules
   - Component patterns (forms, tables, navigation)
   - Accessibility basics

4. **Create `skills/doc-templates/SKILL.md`** (new)
   - PRD template structure
   - Tech spec template (with mermaid diagram types)
   - ADR template
   - Folder structure convention (`docs/`, `docs/decisions/`)
   - Update/refresh behavioral rules

5. **Create `references/guidance-quality-framework.md`** (new)
   - Move from `plugins/code-review/references/` (written by earlier research agent)
   - Purposeful vs nitpicky examples
   - "So What?" decision criteria
   - Impact-first language translation table
   - Confidence-building patterns

6. **Create `references/approved-stack.md`** (new)
   - Deep documentation of each stack choice with WHY
   - What it means for the user (not just what it is)

7. **Create `references/deployment-checklist.md`** (new)
   - EC2 readiness requirements
   - Port, health endpoint, process management, env vars

8. **Create `references/anti-patterns.md`** (new)
   - AI slop indicators
   - Frontend anti-patterns
   - Over-engineering signs

9. **Create `references/recommended-plugins.md`** (new)
   - code-review-graph, agent-browser descriptions and relevance

10. **Create `references/mcp-conventions.md`** (new)
    - Tool naming, validation, error format, documentation

11. **Create `CLAUDE.md`** (plugin root)
    - Target audience definition
    - The 10 golden rules (brief)
    - Approved stack constraints
    - Pointer to skills and references

12. **Create `AGENTS.md`** (plugin root)
    - Agent roles and when to use each
    - Handoff patterns table
    - Tone per agent
    - Model assignments

### Delete after Phase 1:
- `skills/ai-app-essentials/SKILL.md` (replaced by ai-app-conventions)
- `skills/security-checklist/SKILL.md` (folded into conventions)
- `references/claude-api-reference.md` (folded into ai-app-conventions)
- `references/agent-sdk-reference.md` (folded into ai-app-conventions)
- `references/mcp-dev-reference.md` (replaced by mcp-conventions.md)
- `references/prompt-engineering.md` (folded into ai-app-conventions)
- `references/testing-ai-apps.md` (folded into conventions)

### Verify:
- Read each skill file and confirm it references the REQUIREMENTS.md rules correctly
- Ensure no circular dependencies between skills

---

## Phase 2: Command Router + Entry Point (CMD-1, CMD-12)

**Why second:** The router is the shell that dispatches to agents. Get this right before building agents.

### Steps:

1. **Rewrite `commands/mosaic-buddy.md`**
   - New YAML frontmatter (keep same name, user-invocable: true)
   - Add all new subcommand aliases to routing table
   - Implement first-run detection (check if project has been scanned before)
   - Implement task-based menu (CMD-1 acceptance criteria 1.1-1.6)
   - Implement help output (CMD-12)
   - Implement recommendations inline (CMD-11)
   - Route each subcommand to the correct agent by name
   - Include the capped first-pass scan logic for Option 1

2. **Update `.claude-plugin/plugin.json`**
   - New description reflecting "technical co-pilot for non-engineering teams"
   - Updated keywords

### Verify:
- `/mosaic-buddy` shows task-based menu
- `/mosaic-buddy help` shows all commands with task descriptions
- `/mosaic-buddy recommendations` shows plugin list
- Routing to agents works (they won't exist yet, but verify the dispatch pattern)

---

## Phase 3: Stack Check Agent (CMD-4)

**Why third:** Simplest agent — deterministic checks, no conversation, fast to validate. Good first agent to nail the pattern.

### Steps:

1. **Create `agents/stack-reviewer.md`**
   - YAML frontmatter: name, color, description with examples, tools, model: sonnet
   - Encode the exhaustive blocklist/warnlist from CMD-4
   - Implement TLDR-first output format
   - Include fix offer at end
   - Reference `${CLAUDE_PLUGIN_ROOT}/skills/conventions/SKILL.md` for stack rules

2. **Delete `agents/stack-advisor.md`** (replaced)

### Verify:
- `/mosaic-buddy review-stack` on a project with Express → blocks with outcome language
- `/mosaic-buddy review-stack` on a compliant project → clean pass with positive observation

---

## Phase 4: Doctor Agent (CMD-2)

**Why fourth:** Most complex agent (80+ checks, 4 groups, 5 tiers). But highest value — the core "Check before sharing" flow.

### Steps:

1. **Create `agents/doctor.md`**
   - YAML frontmatter
   - Encode 4 groups: Reliability, Safety, Code Health, User Experience
   - Encode 5-tier finding system
   - Encode the billboard/status-bar output format from SPEC.md
   - Reference conventions skill for what to check
   - Reference deployment-checklist for EC2 checks
   - Reference anti-patterns for code quality
   - Encode the TLDR-first pattern for every finding
   - Include count summary + 3-option close

2. **Delete `agents/setup-reviewer.md`** (replaced)
3. **Delete `agents/security-auditor.md`** (folded into doctor)

### Verify:
- `/mosaic-buddy doctor` produces narrative output with billboard
- Findings use outcome language, not jargon
- Nice-work tier always populated
- 3-option close appears

---

## Phase 5: Grillme Agent (CMD-7)

**Why fifth:** High-impact, distinctive personality. Tests whether the tone system works.

### Steps:

1. **Create `agents/grillme.md`**
   - YAML frontmatter
   - Full personality instructions (Ted Lasso + product coach)
   - THE GOOD STUFF → FIX TODAY → FIX SOON → WHEN YOU GET A CHANCE → PRODUCT QUESTIONS → THE BOTTOM LINE structure
   - Include 2-3 full example findings in-prompt for Sonnet to match tone
   - Product-side and implementation-side audit categories
   - "Want me to roll up my sleeves?" close
   - Reference guidance-quality-framework for purposeful-vs-nitpicky

### Verify:
- `/mosaic-buddy grillme` produces the right tone and structure
- Starts with genuine positives
- Findings are in everyday metaphors, not jargon
- Offers help at the end

---

## Phase 6: Review Agent (CMD-3)

**Why sixth:** Depends on understanding intent-based questioning — more nuanced than stack-check.

### Steps:

1. **Create `agents/reviewer.md`**
   - YAML frontmatter
   - Intent-first approach: asks before flagging
   - Checks: frontend-backend separation, progressive disclosure, pattern consistency
   - Findings framed as questions/trade-offs
   - Default 5-finding cap

### Verify:
- `/mosaic-buddy review` asks about intent before flagging
- No false positives on intentional architecture choices

---

## Phase 7: UX Reviewer Agent (CMD-5)

**Why seventh:** Requires the ux-heuristics skill (built in Phase 1).

### Steps:

1. **Create `agents/ux-reviewer.md`**
   - YAML frontmatter
   - Discovery questions (one at a time)
   - 6 audit categories
   - Time-estimate findings format
   - Business language throughout
   - Reference ux-heuristics skill

### Verify:
- `/mosaic-buddy ux` asks discovery questions first
- Findings include time estimates
- No jargon in output

---

## Phase 8: Brainstorm Agent (CMD-6)

**Why eighth:** Conversational agent with no code analysis needed — can work on greenfield.

### Steps:

1. **Create `agents/brainstormer.md`**
   - YAML frontmatter
   - Personality: senior product advisor, curious, encouraging
   - Behavioral rules: one question at a time, mirror language, challenge assumptions
   - Spec output template
   - Handoff trigger to documenter
   - If code exists: read project and offer 3 directions

### Verify:
- `/mosaic-buddy brainstorm` opens with thoughtful question (not a form)
- Produces 1-page spec after ~8 turns
- Offers handoff to document

---

## Phase 9: Document Agent (CMD-9)

**Why ninth:** Depends on doc-templates skill. Most complex subcommand routing.

### Steps:

1. **Create `agents/documenter.md`**
   - YAML frontmatter (needs Write, Edit tools)
   - Subcommand routing logic (prd/spec/adr/update/refresh/bare)
   - PRD: conversation-first, never fabricates
   - Tech Spec: code-first, asks "what's wrong?"
   - ADR: conversational, immutable records
   - Update: per-doc-type behavior (PRD trusts user, spec verifies code)
   - Refresh: compare docs vs code, list discrepancies, skip ADRs
   - Handoff contract: if from brainstorm, skip question phase
   - "Explain to my team" mode
   - Stakeholder summary on update/refresh
   - Reference doc-templates skill

### Verify:
- `/mosaic-buddy document` asks task-oriented question
- `/mosaic-buddy document prd` asks questions before drafting
- `/mosaic-buddy document spec` drafts from code
- ADRs stored in `docs/decisions/NNN-*.md`

---

## Phase 10: Debug Agent (CMD-8)

**Why tenth:** Restructure of existing agent — least urgency.

### Steps:

1. **Rewrite `agents/debugger.md`**
   - Keep YAML format, update description
   - Implement 6-step workflow: Classify, Gather, Hypothesize, Investigate, Document, Fix
   - Error type classification
   - Documentation trail preservation

### Verify:
- `/mosaic-buddy debug` classifies error type in early value
- Follows systematic workflow
- Produces documented trail

---

## Phase 11: Coach Agent — 10x (CMD-10)

**Why last for main agents:** Opus, token-heavy, depends on session transcript access. Most novel implementation.

### Steps:

1. **Create `agents/coach.md`**
   - YAML frontmatter (model: opus)
   - Two-phase consent flow
   - Session counting (Phase 1: Glob for JSONL files by mtime)
   - Transcript analysis (Phase 2: Read files, pattern detection)
   - HTML report generation (Write tool)
   - Report template: coaching first, stats at end
   - Open in browser via Bash (`open report.html`)
   - Privacy disclosure in pre-run prompt

### Verify:
- `/mosaic-buddy 10x` shows session count, asks for consent
- After consent, generates HTML file
- HTML opens in browser
- Report sections match spec

---

## Phase 12: Hooks + Cleanup

**Why last:** Safety layer that applies globally. Clean up old files.

### Steps:

1. **Update `hooks/hooks.json`**
   - Simplified to just the two hooks (PreToolUse Write/Edit, PostToolUse Bash)

2. **Update `README.md`**
   - New overview reflecting "technical co-pilot for non-engineering teams"
   - Installation instructions
   - Command list with task-based descriptions

3. **Delete remaining old files:**
   - Any old reference files not replaced in Phase 1

4. **Update marketplace.json** (if needed at repo root)

### Verify:
- Write a file with `sk-ant-` in it → hook blocks
- Run bash command that outputs a key → hook warns
- README is accurate and up to date

---

## Execution Summary

| Phase | What | Files Changed | Depends On |
|-------|------|---------------|------------|
| 1 | Foundation (skills, references, CLAUDE.md, AGENTS.md) | ~12 files | Nothing |
| 2 | Command router + entry point | 2 files | Phase 1 |
| 3 | Stack-reviewer agent | 1 new, 1 delete | Phase 1-2 |
| 4 | Doctor agent | 1 new, 2 delete | Phase 1-2 |
| 5 | Grillme agent | 1 new | Phase 1-2 |
| 6 | Review agent | 1 new | Phase 1-2 |
| 7 | UX-reviewer agent | 1 new | Phase 1-2 |
| 8 | Brainstorm agent | 1 new | Phase 1-2 |
| 9 | Document agent | 1 new | Phase 1-2, Phase 8 (handoff) |
| 10 | Debug agent (rewrite) | 1 rewrite | Phase 1-2 |
| 11 | Coach/10x agent | 1 new | Phase 1-2 |
| 12 | Hooks + cleanup + README | 3-5 files | All above |

**Total:** ~30 files across 12 phases. Each phase is independently testable.

---

## Notes for Implementer

- **SPEC.md** is the tone/personality reference. When writing agent prompts, pull example outputs and tone instructions from it.
- **REQUIREMENTS.md** is the acceptance criteria. When verifying, check against the numbered criteria.
- **Each agent .md file** is self-contained — it encodes both the behavioral requirements AND the personality/tone in a single prompt.
- **Skills auto-load** based on their description triggers. Make sure trigger keywords are specific enough to avoid loading unnecessary context.
- Phases 3-11 can be parallelized if multiple people are building — they only depend on Phases 1-2 being complete.
