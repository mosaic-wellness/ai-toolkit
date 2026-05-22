# mosaic-buddy Plugin — Redesign Specification

**Status:** Draft — Awaiting Review  
**Owner:** Hitesh Burla  
**Last updated:** 2026-04-20

---

## Mission

Make `mosaic-buddy` the **single-stop technical co-pilot for non-engineering teams** at Mosaic Wellness. Product managers, ops people, revenue analysts, and growth folks build internal tools using Claude Code. They're smart and capable — but they're not infra-savvy. This plugin bridges that gap.

The plugin should feel like having a senior technical advisor on the team who:
- Speaks their language (no jargon without explanation)
- Makes them feel MORE confident, not less
- Catches real problems, not nitpicks
- Offers to do the work, not just report findings
- Makes every interaction feel valuable — the user should walk away thinking "that was worth it"

**The bar:** S-tier. Not mid. Every interaction should make the user think "this is actually useful" — not "this is another tool telling me I'm doing it wrong."

---

## Target Audience

- Product managers who build dashboards and internal tools
- Ops people who create automation scripts and CRUD apps
- Revenue analysts who build reporting tools
- Growth team members who build landing pages and experiments

**What they have in common:**
- They use Claude Code to build
- They are NOT software engineers
- They want confidence, not education
- They deploy on EC2 (managed by infra team)
- They don't want to learn infrastructure

---

## Approved Stack (Non-negotiable)

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | **Fastify** (Node.js 20 LTS) | Fast, typed, infra team knows it |
| Frontend | **React** (Vite) | Team knows it, fast dev loop. No Next.js unless SSR justified. |
| Database | **MySQL** | Infra-managed, backups, monitoring already set up |
| Auth | **Google Auth** | Company-wide SSO, no custom auth |
| Deployment | **EC2** | Infra team handles it |
| AI SDK | **@anthropic-ai/sdk** (TS) / **anthropic** (Python) | Standard, supported |

**Hard no's:** SQLite, Express, Postgres, custom JWT auth, frontend Claude API calls, deprecated models.

---

## Design Principles — The 10 Golden Rules

Every agent in this plugin follows these:

1. **Lead with impact, not jargon.** "Anyone with the URL can see all expenses" not "Missing auth middleware."
2. **Respect the builder.** They built something real. Acknowledge it. Always.
3. **Keep findings focused.** Default to 5 or fewer per response. Commands that are explicitly audits (doctor, grillme) may show more — see Output Rules for per-command limits.
4. **Every finding needs a "because."** No "you should." Always "because if you don't, X happens."
5. **Match their scale.** 15 users is not Netflix. Don't prescribe Netflix solutions.
6. **Give the fix, not just the finding.** "Move the key to .env" not "hardcoded credentials detected."
7. **Never grade. Always guide.** "Almost there" not "Score: 72/100."
8. **Celebrate what's working.** Even a rough project has something right.
9. **One question at a time.** Never present a form. Be a conversation.
10. **Offer to help at the end.** Close the *final* response of an interaction with a single clear offer to act. Does NOT apply to mid-conversation turns (brainstorm questions, document prd/adr questions, first-run menu). Applies only to responses that deliver findings, reports, or completed artifacts. Format varies by command — see Output Rules.

---

## Commands

### `/mosaic-buddy` (no args) — First Run / Menu

**First-time experience:**
```
Hey! I'm your project's technical co-pilot.

I can check if your app is healthy, help you brainstorm features,
review your UX, or write documentation.

What sounds useful right now?

  1. Check my project — I'll scan your project and tell you how it's looking
  2. Help me build something — brainstorm a feature or improvement
  3. Just show me everything you can do
```

**Option 1 behavior:** Runs a **capped first-pass** — not the full doctor audit. The agent scans the project and returns the top 3 most impactful findings (following the first-run cap), plus a summary of what it detected. This is fast and focused.

At the end of the first-pass, it offers: "Want me to run a full health check? That'll cover [N] more areas." Choosing yes is explicit consent for the full `doctor` flow. This means picking Option 1 from the first-run menu does NOT trigger a full audit — it triggers a lightweight scan that can escalate.

**Option 2 behavior:** Routes directly to `brainstorm`. The agent begins its conversational flow (reads project if code exists, then asks first thoughtful question).

**Option 3 behavior:** Displays the full command menu with all available subcommands and one-line descriptions (same output as `/mosaic-buddy help`).

**Returning users:** Full command menu.

---

### `/mosaic-buddy doctor` — Thorough Health Audit

**Model:** Sonnet  
**Purpose:** Comprehensive project audit across 4 human-readable groups  
**Not fast:** Reads entire project, runs ~80 checks, produces narrative report

**Early value contract:** Within 5 seconds of invocation, the agent outputs a context-recognition line (e.g., "Looking at your React + Fastify + MySQL project...") so the user knows it's working and understands their setup. The full audit follows after scanning completes.

**Output architecture:**
- **Billboard** (top): One-sentence verdict + visual status bar
- **Status options:** "Ready to share" / "Almost there" / "Needs attention"
- **4 groups** (not 9 technical categories):
  - **Reliability** — "Will this keep working?" (deployment, EC2, stack compliance)
  - **Safety** — "Is this safe?" (security, AI guardrails)
  - **Code Health** — "Is this well-built?" (structure, DB patterns, code quality)
  - **User Experience** — "Will people like using it?" (frontend patterns)
- **5 finding tiers:**
  - `✗` Must fix before sharing
  - `!` Fix soon
  - `~` Worth knowing
  - `✓` Nice work (always present)
  - `→` Pro tips
- **Closing:** Count summary + 3 options (fix critical / show detail / save report)

**What it checks (80+ items):**
- Deployment readiness (start scripts, port config, health endpoint, graceful shutdown)
- Stack compliance (MySQL not SQLite, Fastify not Express, React not unjustified Next.js)
- Security (no hardcoded keys, .env configured, .gitignore correct, Google Auth setup)
- Project structure (README, folder organization, package.json scripts, TypeScript config)
- Frontend anti-patterns (excessive client-side processing, no pagination, no error states)
- Database patterns (migrations, parameterized queries, connection pooling, indexes)
- AI app conventions (if applicable: backend-only calls, max_tokens, usage tracking, model currency)
- Code quality / AI slop detection (over-engineered abstractions, dead code, unused deps)
- EC2-specific (binds 0.0.0.0, env-configurable port, no dev deps in production, PM2-ready)

**Example output:**
```
╭─────────────────────────────────────────────────────────────────╮
│                                                                 │
│   mosaic doctor                                                 │
│                                                                 │
│   Your project is almost ready to share.                        │
│   One issue needs fixing first, and a few things will help      │
│   as more people start using it.                                │
│                                                                 │
│   ██████████████████░░░░  Almost there                          │
│                                                                 │
╰─────────────────────────────────────────────────────────────────╯

─── Summary ───────────────────────────────────────────────────────

  Safety         1 issue needs immediate attention
  Reliability    2 things to address before deploying
  Code Health    Looking solid — a few improvements available
  User Experience  Works well, one thing to watch as data grows
```

---

### `/mosaic-buddy review` — Deep Architecture Review

**Model:** Sonnet  
**Purpose:** Checks architecture choices and intent. Asks "was this deliberate?" before flagging.

**Key difference from doctor:** Doctor checks health. Review checks **intent**.

**What it examines:**
- Frontend-backend separation (is client-side processing deliberate or accidental?)
- Progressive disclosure (is showing everything in one view intentional?)
- Data flow security implications
- Architecture choices with justification ("Why Next.js here — do you need SSR, or would plain React suffice?")
- Pattern consistency across the app

**Behavior:** Asks the user about their intent before flagging. Not everything is wrong — some choices are deliberate trade-offs for internal tools.

---

### `/mosaic-buddy debug` — Structured Debugging Workflow

**Model:** Sonnet  
**Purpose:** Gives AI agents a systematic debugging process so debugging becomes organized

**Workflow:**
1. **Classify** — What type of error? (runtime, build, API, network, auth, data)
2. **Gather** — Collect error messages, stack traces, recent changes
3. **Hypothesize** — List 2-3 most likely causes based on classification
4. **Investigate** — Check each hypothesis systematically
5. **Document** — Write down what was found (becomes a knowledge artifact)
6. **Fix** — Apply the solution, verify it works

**Value:** The process itself becomes a document. Next time someone hits a similar issue, the debugging trail exists.

---

### `/mosaic-buddy review-stack` — Stack Red Flag Detection

**Model:** Sonnet  
**Purpose:** Quick, decisive. Checks for **dependency and configuration red flags** against a defined blocklist/warnlist. This is NOT a full stack compliance audit (that's doctor's job) — it's a fast scan for known bad choices.

**Scope boundary:** review-stack checks what can be detected from `package.json`, import statements, config files, and source code patterns. It does NOT check runtime behavior, deployment config, Node.js version on the server, or EC2-specific settings. Those belong to `doctor`.

**Hard no's (block) — exhaustive list:**
- `sqlite3`, `better-sqlite3` in dependencies
- `express` in dependencies (check both dependencies and devDependencies)
- `pg`, `postgres`, `@vercel/postgres` in dependencies
- `passport-local` or `jsonwebtoken` in dependencies WITHOUT `passport-google-oauth20` or `google-auth-library` also present. (Test: if either local-auth package exists AND neither Google-auth package exists in the same package.json → block.)
- Deprecated Claude model IDs in source: `claude-3-opus-*`, `claude-3-sonnet-*`, `claude-3-haiku-*`, `claude-3-5-sonnet-*`
- `@anthropic-ai/sdk` or `anthropic` imported in `.tsx`/`.jsx` files (frontend API calls)
- `messages.create` or `messages.stream` calls missing `max_tokens` parameter

**Soft flags (warn) — exhaustive list:**
- `next` in dependencies without SSR justification in README or comments
- `claude-opus-4-6` used in files containing classification/extraction/tagging logic
- No `.env.example` file in project root
- No `/health` route detected in server code
- Port hardcoded as a literal number (not read from `process.env.PORT`)

**Intentionally NOT checked (belongs to doctor):**
- Node.js version, Fastify version, React version
- EC2 deployment readiness
- Google Auth implementation correctness
- AI SDK version currency
- Security patterns beyond dependency choices

**Output:** Violations list with severity + recommended alternative. Quick scan, clear answer.

---

### `/mosaic-buddy ux` — UX Audit for Internal Tools

**Model:** Sonnet  
**Purpose:** Traces user journey through the app. Finds usability issues non-tech users care about.

**Opens with:** "I'm going to look at this from your users' perspective. Let me trace the path someone takes through your tool."

**Discovery questions (3-4, asked conversationally):**
1. Who uses this? (power users vs casual)
2. What's the main job? (dashboard, CRUD, workflow, data entry)
3. What devices? (desktop only, or mobile too)
4. Any current complaints?

**6 audit categories:**
1. **Clarity & Navigation** — Progressive disclosure, information hierarchy, visual wayfinding
2. **Error Recovery** — Error messages, loading states, destructive action confirmation
3. **Data Tables** — Pagination, search/filter, sorting, inline actions
4. **Responsive Design** — Layout flow, touch targets, form inputs
5. **Consistency** — Button styles, data display, spacing
6. **Accessibility Basics** — Contrast, keyboard nav, form labels

**Finding format:** Time estimates, not priority labels. "15 min fix" not "P1."

**Tone:** Helpful coach. Business language. "Users need to scroll 500px to find a record" not "Missing pagination UX pattern."

---

### `/mosaic-buddy brainstorm` — Idea Companion

**Model:** Sonnet  
**Purpose:** Turn a vague "I want to build X" into a structured 1-page spec. No tech jargon.

**Personality:** Senior product advisor. Curious, encouraging. One question at a time.

**Flow:**
1. **Opening:** Reads project (if exists), offers 3 specific directions based on observations. OR asks one thoughtful opening question if starting from scratch.
2. **Middle (~8-10 turns):** Progressive narrowing. Challenges assumptions. Surfaces hidden requirements. Mirrors their language.
3. **Closing:** "I think I have enough. Here's what I'm thinking..." → produces 1-page spec.

**Spec output:**
```
# [Tool Name]

## What it does
One paragraph.

## The problem it solves
What's painful today.

## Who uses it
Bullet list with context.

## V1 — Build This First
- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3

## Later — Not V1
- Deferred item 1
- Deferred item 2

## How we'll know it works
1-3 measurable outcomes.

## Technical direction
One paragraph. Stack, data sources, rough shape.
```

**Handoff:** "Want me to create a proper PRD from this?" → routes to documenter with brainstorm context.

**Handoff contract:** When documenter is invoked from brainstorm (same conversation), the brainstorm conversation is treated as authoritative input. The documenter skips its normal 3-5 question gathering phase and instead drafts directly from the brainstorm spec, only asking follow-up questions for fields that are still missing or ambiguous. This prevents re-asking what was already discussed.

**Key rules:**
- Never ask more than one question at a time
- Never present a list of questions
- Always respond to what they said before asking next question
- Challenge weak assumptions gently
- Start structuring only after enough context (~8 turns)

---

### `/mosaic-buddy grillme` — Witty Holistic Reviewer

**Model:** Sonnet  
**Purpose:** Reviews project from BOTH product and implementation perspectives. Finds gaps a skeptical teammate would find.

**Personality:** Ted Lasso meets sharp product coach.
- Short punchy sentences
- Rhetorical questions to land points
- Everyday metaphors, NOT engineering metaphors
- "Real talk:" before the most important finding
- Always starts with THE GOOD STUFF
- Always ends with offer to help

**Structure:**
```
[Opening one-liner acknowledging what they built]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE GOOD STUFF (always first, always genuine)
  * What they got right (3-4 items)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚨 FIX THIS TODAY (max 3)
  1. [Finding with human-readable impact + fix]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👀 FIX THIS SOON (max 3)
  [Findings framed as "when X happens, Y will break"]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 WHEN YOU GET A CHANCE (max 4, can be one-liners)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCT QUESTIONS (non-code gaps)
  * Who's using this today?
  * How do people know it exists?
  * What's your "it's broken" plan?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

THE BOTTOM LINE
  [Reassurance + specific offer to help]
  "Want me to roll up my sleeves?"
```

**Audit categories:**

Product side (their language):
- Problem clarity, user definition, success metrics, scope discipline, discovery

Implementation side (translated):
- "Can someone break this?" (security)
- "What happens when things go wrong?" (error handling)
- "Will this slow to a crawl?" (performance)
- "How much will this cost to run?" (infra/API costs)
- "Can someone else take this over?" (docs/maintainability)

---

### `/mosaic-buddy document` — Documentation Generator

**Model:** Sonnet  
**Purpose:** Creates/updates PRDs, tech specs, ADRs. Combines codebase reading with user conversation. Never fabricates business context.

**Subcommands:**
- `document prd` — Create/update Product Requirements Document (future-state: what we're building and why)
- `document spec` — Create/update Technical Specification (as-built: how the current system works)
- `document adr` or `document decision` — Create new Architecture Decision Record
- `document update` — Incremental update to existing docs based on a stated change
- `document refresh` — Full reconciliation of existing docs against current codebase
- `document` (empty) — Ask what they want

**`document update` acceptance criteria:**
- **Input:** User states what changed (e.g., "I switched from Express to Fastify" or "I added a notifications feature").
- **Behavior by doc type:**
  - **PRD updates:** Agent trusts the user's stated change directly. PRDs are future-state/intent documents — the user is the authority. Updates affected sections immediately.
  - **Tech Spec updates:** Agent verifies the stated change against the codebase before editing. If code confirms the change (e.g., Fastify is now in package.json), updates the spec. If code does NOT yet reflect the change, the agent says: "I don't see that change in the code yet. Want me to update the spec to reflect your plan, or wait until the code is updated?" This preserves the as-built contract while allowing intentional pre-documentation.
  - **ADR updates:** Not applicable — ADRs are immutable point-in-time records. If the decision changed, suggest creating a new ADR that supersedes the old one.
- **Scope:** Touches only sections relevant to the stated change. Does not rewrite entire documents.
- **Output:** Diff summary ("Updated TECH-SPEC.md: changed framework references in Components table. Updated PRD.md: added notifications to must-haves.") + updated `Last updated` date on affected docs.
- **Guard:** If no docs exist in `docs/`, tells the user and offers to create them instead.

**`document refresh` acceptance criteria:**
- **Input:** No arguments required. Triggered when user suspects docs are stale.
- **Behavior:** Agent reads all docs in `docs/` AND reads the current codebase. Compares them and lists discrepancies (e.g., "Spec says Express, code uses Fastify" or "Spec lists 5 components, code has 7").
- **Output:** Numbered list of discrepancies, each with: what the doc says, what the code shows, and a proposed fix. Then asks: "Want me to update all of these, or go through them one by one?"
- **Scope:** Only touches PRD and TECH-SPEC docs that have discrepancies. Preserves user-written narrative sections. Only updates factual/structural claims that contradict current code. **ADRs are never modified by refresh** — if an ADR contradicts current code, the agent notes the divergence and suggests creating a new superseding ADR rather than editing the original.
- **Guard:** If no docs exist: checks whether code exists. If code exists → offers `document spec`. If no code exists (greenfield) → offers `document prd` or suggests running `brainstorm` first.

**Scope distinction:**
- **PRD** = future-state document. Describes what to build, for whom, and why. Primarily sourced from user conversation (+ brainstorm output if available). Code is read only to understand current state as context.
- **Tech Spec** = as-built document. Describes how the current system works. Primarily sourced from codebase. User is asked only to clarify ambiguous architecture.
- **ADR** = point-in-time decision record. Captures why a choice was made. Always conversational.

For greenfield projects (no code yet): `document spec` is not available — use `brainstorm` → `document prd` instead. Tech specs are only generated once there's code to document.

**Source of truth rules:**

The agent derives information from two sources:
1. **Codebase** — file structure, dependencies, routes, data models, README, comments, existing docs
2. **User conversation** — the agent asks for business context it cannot infer

**Missing information handling (critical requirement):**
- If a PRD field (e.g., problem statement, target users, success metrics) cannot be inferred from the codebase OR prior conversation, the agent MUST ask the user. It does NOT guess or generate placeholder business context.
- For tech specs: derived entirely from code. If architecture is unclear, the agent states what it sees and asks "Is this right?"
- For ADRs: always conversational — the agent asks "What did you decide and why?" then structures the answer.
- Fields that remain unknown after asking are marked `[TBD — needs input from: owner/stakeholder]` with a specific follow-up question noted.

**Document formats:**

**PRD (1-2 pages max):**
- Problem statement, target users, user journey (mermaid), must-haves (checkboxes), should-haves, won't-haves, success metrics, constraints, open questions
- NO implementation details
- Mermaid: journey diagrams for user flows
- Sections the user hasn't answered are marked TBD with a follow-up question

**Tech Spec (1-2 pages max):**
- Overview, architecture (mermaid flowchart), data flow (mermaid sequence diagram), component table, core logic (pseudocode ONLY — no code snippets), data model, cost estimate, risks
- Mermaid: graph TD for architecture, sequenceDiagram for data flow, erDiagram for data model
- Explains technical concepts in plain English
- Derived primarily from codebase; asks clarifying questions only where code is ambiguous

**ADR (1 page max):**
- Context, decision (1-2 sentences), why (reasoning), alternatives table (option/pros/cons), consequences (positive + negative)
- Stored in `docs/decisions/NNN-title.md`

**Folder structure created:**
```
project/
└── docs/
    ├── PRD.md
    ├── TECH-SPEC.md
    └── decisions/
        ├── 001-database-choice.md
        └── 002-auth-strategy.md
```

**Key behavior:** For tech specs, drafts from code first then asks "What's wrong?" For PRDs, asks 3-5 conversational questions first, THEN drafts. Never presents a PRD draft without having asked for business context.

---

### `/mosaic-buddy recommendations` — Plugin Recommendations

**Model:** None (inline, reads reference doc)  
**Purpose:** Recommends Claude Code plugins that would help their workflow.

**Currently identified:**
- `code-review-graph` — Visual code review
- `agent-browser` — Browser automation for testing

**Format:** Brief description of each + why it's relevant to their project type.

---

### `/mosaic-buddy 10x` — Weekly Coaching Report

**Model:** Opus (only command that uses Opus)  
**Token weight:** Heavy  
**Recommended frequency:** Once per week  
**Output:** Self-contained HTML file, opened in browser

**Data source:** Claude Code stores session transcripts as JSONL files in `~/.claude/projects/<project-path>/` (one file per session). The agent reads these files directly using the Read and Glob tools. Each JSONL file contains the full message history (user messages, assistant responses, tool calls, tool results).

**Session definition:** One JSONL file = one session. The agent counts files with `mtime` within the last 7 days.

**Scope:**
- **Default (`/mosaic-buddy 10x`):** Only reads sessions from `~/.claude/projects/<current-project-path>/` — scoped to current working directory.
- **All (`/mosaic-buddy 10x all`):** Reads sessions from ALL project directories under `~/.claude/projects/`. This is opt-in (user explicitly types `all`). The pre-run confirmation shows the number of projects and sessions that will be analyzed.

**Privacy model:** Session transcript content is sent to the Claude API for analysis — the same way any file you read in Claude Code is sent. No additional data sharing occurs beyond your normal Claude Code usage. If your sessions contain sensitive information, the same privacy guarantees that apply to all Claude Code interactions apply here.

**Two-phase flow (consent boundary):**

1. **Phase 1 — Counting (before consent):** The agent uses Glob to count JSONL files matching the time window. This reads filenames and mtimes only — no transcript content is read. The count is shown in the confirmation prompt.

2. **User confirms [y/n].**

3. **Phase 2 — Analysis (after consent):** Only after confirmation does the agent read transcript content and send it to the model for analysis.

**Pre-run UX (Phase 1 output → consent prompt):**
```
This command analyzes your Claude Code sessions to find where you can
get better results. It uses our most capable model and processes a lot
of data — best run once a week.

  Scope: [current project] (use '/mosaic-buddy 10x all' for everything)
  Sessions found: 23 in this project (last 7 days)

  Continue? [y/n]
```

**Time window:** Last 7 days only (keeps insights fresh and actionable, not historical)

**Variants:**
- `/mosaic-buddy 10x` — Current project sessions from last 7 days
- `/mosaic-buddy 10x all` — All Claude Code sessions across all projects from last 7 days

**Early value contract (Phase 2, after consent):** Once the user confirms, the agent outputs "Analyzing 23 sessions (~1,200 messages)..." as a progress signal before the heavy processing begins.

**Report sections (HTML):**
1. **Your Superpower** — What they're naturally good at with Claude
2. **The Biggest Time Sink** — #1 pattern costing most rework, with before/after example
3. **3 Quick Wins** — Concrete things to try tomorrow, with copyable prompt examples
4. **Features You're Missing** — 1-2 Claude Code features relevant to THEIR workflow
5. **Your Prompt Style** — How they communicate with Claude, what works, what doesn't
6. **Next Level** — One ambitious workflow to try

**Design principles for the HTML:**
- Warmer than current `/insights` — gradients, cards, less corporate
- Shorter — max one full scroll
- Each section = one card with ONE key takeaway
- Copyable prompt examples with one-click buttons
- No technical jargon ("49 instances of wrong_approach friction" → "About half the time, Claude took a wrong turn. Here's why and how to prevent it.")
- Opportunity framing, not failure framing
- **Stats at the END, not the top** — open with coaching (the value), close with stats (the celebration). Stats become the "look what you accomplished" reward after the actionable stuff. Fun, visual, feel-good — like a highlight reel at the end of a game.

---

### `/mosaic-buddy help` — Command Reference

**Model:** None (inline)  
**Output:** Clean list of all commands with one-line descriptions.

---

## Plugin Architecture

### Directory Structure

```
plugins/mosaic-buddy/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── mosaic-buddy.md                # Main router (all subcommands)
├── agents/
│   ├── doctor.md                          # Thorough health audit
│   ├── reviewer.md                        # Deep architecture review
│   ├── debugger.md                        # Structured debugging
│   ├── stack-reviewer.md                  # Stack red flags
│   ├── ux-reviewer.md                     # UX audit
│   ├── brainstormer.md                    # Idea → spec companion
│   ├── grillme.md                         # Witty holistic reviewer
│   ├── documenter.md                      # PRD / spec / ADR generator
│   └── coach.md                           # 10x coaching report (Opus)
├── skills/
│   ├── conventions/SKILL.md               # Foundation: stack, structure, security, tone
│   ├── ai-app-conventions/SKILL.md        # AI apps: models, cost, safety, MCP
│   ├── ux-heuristics/SKILL.md             # UX patterns for internal tools
│   └── doc-templates/SKILL.md             # PRD, tech-spec, ADR templates
├── hooks/
│   └── hooks.json                         # API key leak prevention
├── references/
│   ├── guidance-quality-framework.md      # Purposeful vs nitpicky rules
│   ├── approved-stack.md                  # Deep stack documentation
│   ├── deployment-checklist.md            # EC2 readiness
│   ├── ai-security-guardrails.md          # LLM security patterns
│   ├── cost-optimization.md               # AI cost management
│   ├── anti-patterns.md                   # AI slop + frontend anti-patterns
│   ├── recommended-plugins.md             # Plugin recommendations
│   └── mcp-conventions.md                 # MCP server standards
├── CLAUDE.md                              # Plugin-level rules + tone
├── AGENTS.md                              # Agent roles + handoffs
├── README.md
└── LICENSE
```

### Skills (Auto-loaded Knowledge)

| Skill | Triggers | Content |
|-------|----------|---------|
| `conventions` | Every agent, every time | Approved stack (with WHY), project structure, package.json scripts, env vars, security baseline, deployment readiness, **the 10 golden rules** |
| `ai-app-conventions` | AI SDK detected or LLM code | 5 golden rules (no frontend calls, max_tokens always, usage tracking, separate prompts, error handling), model selection, cost formulas, prompt injection, MCP conventions |
| `ux-heuristics` | UX review or frontend discussion | Nielsen's 10 simplified, internal tool patterns, data table rules, progressive disclosure |
| `doc-templates` | Document command | PRD/tech-spec/ADR templates, mermaid types, folder structure, update patterns |

### Hooks

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "prompt",
        "prompt": "Block if file contains hardcoded API keys (sk-ant-*, sk-*, amk_*). Warn: 'Use environment variables instead.'"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "prompt",
        "prompt": "Warn if command output contains leaked API keys."
      }]
    }]
  }
}
```

### Handoff Patterns

```
brainstorm → document    ("Want me to create a proper PRD?")
grillme → doctor         ("Want a deeper technical audit?")
doctor → review-stack    ("Want to focus on the stack violations?")
ux → document            ("Want to document these UX decisions?")
review → debug           ("Found an issue — want to investigate?")
10x → [any command]      (Report recommends specific commands to try)
```

---

## Files to Create vs Rewrite

### Rewrite (existing files, complete overhaul):
- `commands/mosaic-buddy.md` — New routing, first-run detection, all subcommands
- `hooks/hooks.json` — Simplified
- `.claude-plugin/plugin.json` — Updated description
- `README.md` — New overview

### Delete (replaced by new structure):
- `agents/setup-reviewer.md` → replaced by `doctor.md`
- `agents/security-auditor.md` → folded into `doctor.md`
- `agents/stack-advisor.md` → replaced by `stack-reviewer.md`
- `skills/ai-app-essentials/SKILL.md` → replaced by `ai-app-conventions/SKILL.md`
- `skills/security-checklist/SKILL.md` → folded into conventions
- `references/claude-api-reference.md` → folded into ai-app-conventions
- `references/agent-sdk-reference.md` → folded into ai-app-conventions
- `references/mcp-dev-reference.md` → replaced by mcp-conventions.md
- `references/prompt-engineering.md` → folded into ai-app-conventions
- `references/testing-ai-apps.md` → folded into conventions

### Create (new files):
- `agents/doctor.md`
- `agents/reviewer.md`
- `agents/stack-reviewer.md`
- `agents/ux-reviewer.md`
- `agents/brainstormer.md`
- `agents/grillme.md`
- `agents/documenter.md`
- `agents/coach.md`
- `skills/ux-heuristics/SKILL.md`
- `skills/doc-templates/SKILL.md`
- `references/guidance-quality-framework.md`
- `references/approved-stack.md`
- `references/deployment-checklist.md`
- `references/ai-security-guardrails.md`
- `references/anti-patterns.md`
- `references/recommended-plugins.md`
- `references/mcp-conventions.md`
- `CLAUDE.md`
- `AGENTS.md`

### Keep & update:
- `skills/conventions/SKILL.md` — Already written, needs review
- `skills/ai-app-conventions/SKILL.md` — Already written, needs review
- `references/cost-optimization.md` — Update for new context
- `agents/debugger.md` — Restructure workflow

---

## What "S-Tier" Means for This Plugin

### Early Value Contract (replaces "10-second rule")

Every command must provide **evidence of understanding** within 5 seconds of invocation. This is NOT the full output — it's a signal that the agent recognized the project and is working. Acceptance criteria per command:

| Command | Early value (within 5 seconds) |
|---------|-------------------------------|
| `/mosaic-buddy` (no args) | First-run: greeting + 3-option menu. Returning: full command menu. Both are immediate (no scanning needed). |
| `doctor` | "Looking at your [detected stack] project..." |
| `review` | "I can see [X routes/pages/components]..." |
| `debug` | "Classifying: this looks like a [error type]..." |
| `review-stack` | "Checking against approved stack..." |
| `ux` | "Tracing the user path through [detected pages]..." |
| `brainstorm` | First thoughtful question (not a preamble) |
| `grillme` | Opening one-liner acknowledging what they built |
| `document spec/refresh` | "Reading your project structure..." |
| `document prd/adr` | First conversational question (same as brainstorm) |
| `document update` | "Checking which docs are affected..." (reads `docs/` directory) |
| `document` (bare) | "What would you like to document?" (immediate menu/question) |
| `10x` | Phase 1 (pre-consent): "Found [N] sessions (last 7 days). Continue?" Phase 2 (post-consent): "Analyzing [N] sessions..." |

For conversational commands (brainstorm, grillme): early value = the first substantive response, not a loading message.

### Output Rules (defaults vs overrides)

The following are **default rules** that apply unless a command explicitly overrides them in its spec:

**Never grade, always guide:** Replace all grading language. "Almost there" not "72/100."

**Finding cap:** Default maximum is **5 findings per response.** Commands may override this:
- `grillme` overrides to: max 3 per severity tier (up to ~10 total + product questions) — justified because grillme is explicitly a comprehensive review the user opted into.
- `doctor` overrides to: all findings shown, grouped by tier — justified because doctor is a thorough audit.
- First-run/menu interactions: capped at 3 (lower threshold for unsolicited findings).

**Fix-it offer:** Default is one clear offer at the END of the response (not per-finding). Format:
- `doctor`: 3-option menu (fix critical / detail / save)
- `grillme`: "Want me to roll up my sleeves?" (single offer)
- `review-stack`: "Want me to fix the violations?" (single offer)
- Other commands: "Want me to help with this?" at response end

**Progressive disclosure:** First run = 3 findings max. Full audit only when explicitly requested.

### Vocabulary Rules

- **Never use:** comprehensive, robust, leverage, utilize, best practices, architecture, refactor, lint, scaffold, pipeline, middleware, lifecycle
- **Use instead:** works well, solid, use, good patterns, how it's built, clean up, check, starter code, flow, layer, steps
- Vocabulary bans apply to **user-facing output only** — not to internal labels, command names, or document headings.

### The "So What?" Test

Every finding must answer "so what?" If it doesn't affect users, cost money, break something, or embarrass the builder — don't report it.

---

## Summary

| Metric | Value |
|--------|-------|
| Total subcommands | 11 (excludes the no-args entrypoint, which is the router/first-run menu) |
| Agents | 9 (8 sonnet + 1 opus) |
| Skills | 4 |
| Reference docs | 8 |
| Files to create | ~30 |
| Target audience | Non-engineering teams |
| Deployment target | EC2 |
| Primary model | Sonnet (Opus for 10x only) |
