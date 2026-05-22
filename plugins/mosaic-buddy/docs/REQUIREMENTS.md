# mosaic-buddy Plugin — Requirements

**Status:** Implementation-Ready  
**Owner:** Hitesh Burla  
**Last updated:** 2026-04-20  
**Source:** Synthesized from SPEC.md + Codex user-perspective review

---

## Audience

All requirements assume the user is a **non-engineer** (PM, ops, revenue analyst, growth team member) who builds internal tools with Claude Code. They want confidence, not education. They deploy on EC2 managed by the infra team.

---

## Core Principle: Task-Based Mental Model

The plugin must lead with **jobs the user wants done**, not technical command names.

- The primary interface (menus, help output, first-run experience) frames options as tasks: "Check before sharing," "Help me plan a feature," "Review the user journey."
- Technical command names (`doctor`, `review-stack`, etc.) exist as aliases underneath and are available for returning power users.
- Returning users see the same task-based menu as first-run users, not a raw slash-command list.

---

## Global Requirements

These apply to every command unless explicitly overridden.

### GR-1: Early Value Signal
Every command must produce evidence of understanding within 5 seconds of invocation (e.g., "Looking at your React + Fastify project..."). Conversational commands satisfy this with their first substantive question.

### GR-2: TLDR-First Output
Every finding, recommendation, or section of output must lead with a plain-English summary (the "TLDR") — what's the impact, in one line. Technical details, reasoning, and fix instructions follow below for users who want depth. Never lead with jargon; always lead with consequence.

Example:
```
✗  Anyone with the URL can see all your data
   Your app has no login. Adding Google Auth takes ~30 min
   and locks it to company accounts only.
```

Not:
```
✗  Missing authentication middleware
   Add passport-google-oauth20 to your Fastify instance...
```

### GR-3: Vocabulary & Tone
Sound like a helpful colleague, not a linter. Avoid consultant-speak and words that signal "this isn't for you" (comprehensive, robust, leverage, utilize, best practices, architecture, refactor, lint, scaffold, pipeline, middleware, lifecycle). Technical terms are fine in the detail layer beneath the TLDR — they're not banned outright, just never the headline.

### GR-4: No Grading
Use status language (Ready to share / Almost there / Needs attention) instead of scores, percentages, or letter grades.

### GR-5: Finding Cap
Default maximum: 5 findings per response. Overrides are noted per-command.

### GR-6: Fix Offer + Checklist Follow-up
The final response of any interaction that delivers findings or a completed artifact must close with a single clear offer to act. Mid-conversation turns (questions, menus) do not include this. Additionally, after any review command (`doctor`, `grillme`, `ux`, `review`), the user can say "Turn this into a task list" and receive a prioritized checklist of action items suitable for pasting into Jira/Linear/Notion.

### GR-7: The "So What?" Test
Every reported finding must answer: will this affect users, cost money, break something, or embarrass the builder? If not, omit it.

### GR-8: Respect the Builder
Always acknowledge what the user built well before reporting problems. Every command that produces findings must include at least one positive observation.

### GR-9: Match Their Scale
Recommendations must be proportional. 15 internal users is not Netflix. Do not prescribe Netflix-grade solutions.

### GR-10: Approved Stack Enforcement
All stack-related guidance must align with: Fastify, React (Vite), MySQL, Google Auth, EC2, @anthropic-ai/sdk. Hard no's: SQLite, Express, Postgres, frontend Claude API calls, deprecated models. For auth: Google Auth must be the primary auth mechanism. `jsonwebtoken` alongside Google Auth is acceptable (e.g., for session tokens after Google login), but `passport-local` or `jsonwebtoken` as the sole/primary auth without Google Auth is blocked.

---

## Command Requirements

### CMD-1: Entry Point (no args) — "What can I help with?"

**Task framing:** The menu presents jobs, not command names.

**First-run behavior:**

| # | Acceptance Criteria |
|---|---------------------|
| 1.1 | Displays a greeting and 3 task-based options: (1) "Check before sharing" (2) "Help me build something" (3) "Show me everything you can do" |
| 1.2 | Option 1 runs a **capped first-pass scan** (max 3 findings), not a full audit |
| 1.3 | After the first-pass scan, offers to escalate: "Want me to run a full health check? That'll cover [N] more areas." Full audit requires explicit consent. |
| 1.4 | Option 2 routes to the brainstorm flow |
| 1.5 | Option 3 displays the full task-based menu with all available commands and one-line descriptions |

**Returning-user behavior:**

| # | Acceptance Criteria |
|---|---------------------|
| 1.6 | Shows the same task-based menu (not a raw slash-command list). Tasks like "Check before sharing," "Help me plan a feature," "Review the user journey" with technical command names shown as secondary labels. |

---

### CMD-2: Health Check (`doctor`) — "Check before sharing"

**Purpose:** Thorough project audit. Answers: "Is this ready for other people to use?"

| # | Acceptance Criteria |
|---|---------------------|
| 2.1 | Early value: outputs a context-recognition line within 5 seconds (e.g., "Looking at your React + Fastify + MySQL project...") |
| 2.2 | Runs 80+ checks across 4 human-readable groups: Reliability ("Will this keep working?"), Safety ("Is this safe?"), Code Health ("Is this well-built?"), User Experience ("Will people like using it?") |
| 2.3 | Top-level verdict is one of: "Ready to share" / "Almost there" / "Needs attention" — displayed with a visual status bar |
| 2.4 | Findings use 5 tiers: must-fix, fix-soon, worth-knowing, nice-work (always present), pro-tips |
| 2.5 | Finding cap override: all findings shown, grouped by tier |
| 2.6 | Every finding includes a "because" (impact statement) and a concrete fix |
| 2.7 | Technical checks (parameterized queries, connection pooling, PM2 readiness, etc.) are reported using outcome language. Example: "Your database queries could be manipulated by a user" not "Missing parameterized queries" |
| 2.8 | Closes with count summary + 3 options: fix critical issues / show detail on a finding / save report |
| 2.9 | Checks include: deployment readiness, stack compliance, security, project structure, frontend anti-patterns, database patterns, AI conventions (if applicable), code quality, EC2-specific settings |

---

### CMD-3: Architecture Review (`review`) — "Review how this is built"

**Purpose:** Checks whether architecture choices were intentional vs accidental. Asks before flagging.

| # | Acceptance Criteria |
|---|---------------------|
| 3.1 | Early value: "I can see [X routes/pages/components]..." |
| 3.2 | Asks the user about intent before flagging anything as wrong (e.g., "Is showing everything in one view intentional?") |
| 3.3 | Examines: frontend-backend separation, progressive disclosure, data flow security, pattern consistency, framework choice justification |
| 3.4 | Findings are framed as questions or trade-offs, not violations |
| 3.5 | Default finding cap (5) applies |

---

### CMD-4: Stack Check (`review-stack`) — "Check my tech choices"

**Task framing:** Name should feel approachable. The menu presents this as "Check my tech choices" — `review-stack` is the alias.

**Purpose:** Fast scan for dependency and configuration red flags against a defined blocklist/warnlist.

| # | Acceptance Criteria |
|---|---------------------|
| 4.1 | Early value: "Checking against approved stack..." |
| 4.2 | Checks ONLY what can be detected from package.json, import statements, config files, and source code patterns. Does NOT check runtime behavior, deployment config, or EC2 settings. |
| 4.3 | **Blockers (must report):** SQLite deps, Express, Postgres deps, custom JWT auth without Google Auth, deprecated Claude model IDs, frontend Anthropic SDK imports, messages.create/stream calls missing max_tokens |
| 4.4 | **Warnings (should report):** Next.js without SSR justification, claude-opus-4-6 for classification tasks, missing .env.example, missing /health route, hardcoded port |
| 4.5 | Output: violations list with severity + recommended alternative |
| 4.6 | Closes with: "Want me to fix the violations?" |

---

### CMD-5: UX Audit (`ux`) — "Review the user journey"

**Purpose:** Traces how a real user moves through the app. Finds usability issues in business language.

| # | Acceptance Criteria |
|---|---------------------|
| 5.1 | Early value: "Tracing the user path through [detected pages]..." |
| 5.2 | Opens with: "I'm going to look at this from your users' perspective." |
| 5.3 | Asks 3-4 discovery questions conversationally (one at a time): who uses it, main job, devices, current complaints |
| 5.4 | Audits 6 categories: Clarity & Navigation, Error Recovery, Data Tables, Responsive Design, Consistency, Accessibility Basics |
| 5.5 | Findings include time estimates ("15 min fix"), not priority labels |
| 5.6 | All findings use business language. "Users need to scroll 500px to find a record" not "Missing pagination UX pattern." |
| 5.7 | Default finding cap (5) applies |

---

### CMD-6: Brainstorm (`brainstorm`) — "Help me plan a feature"

**Purpose:** Turns a vague idea into a structured 1-page spec through conversation.

| # | Acceptance Criteria |
|---|---------------------|
| 6.1 | If code exists: reads project, offers 3 specific directions based on observations. If no code: asks one thoughtful opening question. |
| 6.2 | Middle phase: ~8-10 turns of progressive narrowing. Challenges assumptions. Mirrors user language. |
| 6.3 | Never asks more than one question at a time. Never presents a list of questions. |
| 6.4 | Always responds to what the user said before asking the next question. |
| 6.5 | After sufficient context (~8 turns), produces a 1-page spec with: what it does, problem it solves, who uses it, V1 features (checklist), deferred items, success metrics, technical direction |
| 6.6 | Closes with handoff offer: "Want me to create a proper PRD from this?" — routes to document command with brainstorm context preserved |
| 6.7 | **Handoff contract:** When document is invoked from brainstorm, the brainstorm conversation is authoritative input. Document skips its normal question-gathering phase and drafts directly, only asking follow-ups for missing/ambiguous fields. |

---

### CMD-7: Holistic Review (`grillme`) — "Give me the real feedback"

**Task framing:** The menu presents this as "Give me the real feedback" or similar confidence-building language. The `grillme` alias is available but the primary framing must not feel threatening.

**Purpose:** Reviews project from both product and implementation perspectives. Finds gaps a skeptical teammate would find.

| # | Acceptance Criteria |
|---|---------------------|
| 7.1 | Personality: encouraging but honest. Short punchy sentences. Everyday metaphors. "Real talk:" before the most important finding. |
| 7.2 | Always starts with THE GOOD STUFF (genuine positive observations, 3-4 items) |
| 7.3 | Finding cap override: max 3 per severity tier (FIX TODAY, FIX SOON, WHEN YOU GET A CHANCE) — up to ~10 total |
| 7.4 | Includes PRODUCT QUESTIONS section: non-code gaps like "Who's using this today?", "How do people know it exists?", "What's your 'it's broken' plan?" |
| 7.5 | Closes with THE BOTTOM LINE: reassurance + specific offer ("Want me to roll up my sleeves?") |
| 7.6 | Product-side audit: problem clarity, user definition, success metrics, scope discipline |
| 7.7 | Implementation-side audit, framed as outcomes: "Can someone break this?", "What happens when things go wrong?", "Will this slow to a crawl?", "How much will this cost to run?", "Can someone else take this over?" |

---

### CMD-8: Debug (`debug`) — "Help me fix a bug"

**Purpose:** Gives a structured debugging process so debugging is organized and documented.

| # | Acceptance Criteria |
|---|---------------------|
| 8.1 | Early value: "Classifying: this looks like a [error type]..." |
| 8.2 | Follows 6-step workflow: Classify, Gather, Hypothesize (2-3 causes), Investigate, Document, Fix |
| 8.3 | The debugging trail is preserved as a knowledge artifact for future reference |
| 8.4 | Error types classified: runtime, build, API, network, auth, data |

---

### CMD-9: Documentation (`document`) — "Write it down for me"

**Purpose:** Creates/updates PRDs, tech specs, ADRs. Combines codebase reading with user conversation.

**Subcommands and task framings:**

| Subcommand | Task framing | Purpose |
|------------|-------------|---------|
| `document prd` | "Help me write a product plan" | Future-state: what we're building and why |
| `document spec` | "Document how this works" | As-built: how the current system works |
| `document adr` / `document decision` | "Record a decision" | Point-in-time decision record |
| `document update` | "Update my docs" | Incremental update based on a stated change |
| `document refresh` | "Are my docs up to date?" | Full reconciliation against codebase |
| `document` (bare) | — | Asks what they want |

| # | Acceptance Criteria |
|---|---------------------|
| 9.1 | **PRD:** Asks 3-5 conversational questions before drafting. Never fabricates business context. Unknown fields marked `[TBD — needs input from: owner/stakeholder]`. |
| 9.2 | **Tech Spec:** Drafts from code first, then asks "What's wrong?" Only available when code exists (not greenfield). |
| 9.3 | **ADR:** Always conversational — asks "What did you decide and why?" then structures the answer. Stored in `docs/decisions/NNN-title.md`. ADRs are immutable; changes create new superseding ADRs. |
| 9.4 | **Update (PRD):** Trusts user's stated change directly, updates affected sections only. |
| 9.5 | **Update (Tech Spec):** Verifies stated change against codebase before editing. If code doesn't reflect the change, asks whether to update speculatively or wait. |
| 9.6 | **Refresh:** Reads all docs + codebase, lists discrepancies with proposed fixes, asks "Update all or go one by one?" ADRs are never modified by refresh. |
| 9.7 | If no docs exist: offers to create them. If no code exists (greenfield): offers brainstorm or PRD, not spec. |
| 9.8 | All documents are 1-2 pages max. Use mermaid diagrams where appropriate. |
| 9.9 | Users should NOT need to know documentation taxonomy upfront. Bare `document` command must ask a task-oriented question ("What do you need?") and route to the correct subcommand based on the answer. |
| 9.10 | **"Explain this to my team":** If the user asks to explain the project in business language, produce a 1-paragraph business summary + key facts (what it does, who uses it, what it costs). No code references. |
| 9.11 | **Stakeholder summary on update/refresh:** When docs are updated via `update` or `refresh`, include a plain-English change summary suitable for sharing with non-technical stakeholders ("Here's what changed and why it matters"). |

---

### CMD-10: Weekly Coaching Report (`10x`) — "How am I doing with Claude?"

**Task framing:** The menu presents this as "See how I'm using Claude" or "Get coaching on my workflow" — `10x` is the alias. The name alone must convey what the command does.

**Purpose:** Analyzes Claude Code session transcripts and produces an HTML coaching report.

| # | Acceptance Criteria |
|---|---------------------|
| 10.1 | Uses Opus model. Recommended frequency: once per week. |
| 10.2 | **Two-phase consent flow:** Phase 1 counts sessions (filenames/mtimes only, no content read). Shows count + asks for confirmation. Phase 2 (after consent) reads and analyzes transcript content. |
| 10.3 | Default scope: current project sessions from last 7 days. `10x all` variant: all projects. |
| 10.4 | Early value (Phase 2): "Analyzing [N] sessions (~[M] messages)..." |
| 10.5 | Output: self-contained HTML file opened in browser |
| 10.6 | Report sections: Your Superpower, Biggest Time Sink (with before/after example), 3 Quick Wins (with copyable prompt examples), Features You're Missing, Your Prompt Style, Next Level |
| 10.7 | Stats appear at the END (celebration), not the top. Opens with coaching (the value). |
| 10.8 | No jargon in report. Opportunity framing, not failure framing. |
| 10.9 | Privacy: no data sharing beyond normal Claude Code API usage. Pre-run prompt makes this clear. |

---

### CMD-11: Plugin Recommendations (`recommendations`)

**Purpose:** Recommends Claude Code plugins relevant to the user's workflow.

| # | Acceptance Criteria |
|---|---------------------|
| 11.1 | Reads project context and recommends relevant plugins with brief descriptions |
| 11.2 | Explains why each plugin is relevant to their specific project type |

---

### CMD-12: Help (`help`) — "Show me everything"

**Purpose:** Displays all available commands.

| # | Acceptance Criteria |
|---|---------------------|
| 12.1 | Lists all commands with task-based descriptions (not technical names as primary labels) |
| 12.2 | Technical command names shown as secondary labels/aliases |
| 12.3 | No model or API needed (inline output) |

---

---

## Handoff Patterns

Commands must support these transitions:

| From | To | Trigger |
|------|----|---------|
| brainstorm | document | "Want me to create a proper PRD?" |
| grillme | doctor | "Want a deeper technical audit?" |
| doctor | review-stack | "Want to focus on the stack issues?" |
| ux | document | "Want to document these UX decisions?" |
| review | debug | "Found an issue — want to investigate?" |
| 10x | any command | Report recommends specific commands to try |
| any review command | checklist | "Turn this into a task list" (UC-3) |

---

## Hooks

| Hook | Trigger | Behavior |
|------|---------|----------|
| PreToolUse (Write/Edit) | Any file write | Block if file contains hardcoded API keys (sk-ant-*, sk-*, amk_*). Warn: "Use environment variables instead." |
| PostToolUse (Bash) | Any bash command | Warn if command output contains leaked API keys |

---

## Constraints

- **Models:** Sonnet for all commands except `10x` (Opus). No model choice exposed to users.
- **No interactive forms:** One question at a time. Be a conversation.
- **Stack enforcement:** All guidance aligns with approved stack. Deviations are flagged, not silently accepted.
- **Document integrity:** PRDs are future-state (user is authority). Tech specs are as-built (code is authority). ADRs are immutable point-in-time records.
- **Progressive disclosure:** First-run experience shows max 3 findings. Full audits require explicit opt-in.
