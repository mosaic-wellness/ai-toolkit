# Kai — JIRA-Driven Development Agent

Kai takes a JIRA ticket and drives it end-to-end: from understanding the story through implementation, code review, and PR creation. It works in any repository by discovering the project's conventions at runtime.

---

## Usage

```
/kai:kai <ticket-id>          Full workflow for a JIRA ticket
/kai:kai help                 Show this help message
/kai:kai status               Show status of the current kai task
/kai:kai resume <ticket-id>   Resume a previously started workflow
```

---

## Workflow Phases

When you run `/kai:kai ENG-1234`, Kai executes these phases:

```
Phase 1: Setup           Connect to JIRA, fetch ticket, add "kai-agent" label
    |
Phase 2: Understand      Parse user story, identify affected areas, ask questions
    |
Phase 3: Explore         Investigate the codebase, discover conventions, map code paths
    |
Phase 4: Plan            Create a detailed technical spec (no real code)
    |
Phase 5: Review Plan     You review and approve the plan (required before execution)
    |
Phase 6: Execute         Builder agent implements with TDD, following project conventions
    |
Phase 7: Code Review     Guardian agent validates quality, conventions, and acceptance criteria
    |
Phase 8: Finalize        Create PR, update JIRA, present summary
```

**Key safety point:** Kai NEVER proceeds to execution without your explicit approval of the plan.

---

## Requirements

### JIRA MCP Server
Kai needs a JIRA MCP server to fetch tickets and update them. If not configured, Kai will guide you through setup. See `references/jira-mcp-setup.md` for details.

### GitHub CLI
`gh` must be authenticated for PR creation. Run `gh auth status` to check.

---

## How It Adapts to Your Project

Kai works in any repository. On startup, it reads:
- `CLAUDE.md` — project conventions and architecture
- `AGENTS.md` — agent-specific guidance
- `.claude/rules/*.md` — granular rules
- `package.json` — detect package manager, test/lint/build commands
- Config files — tsconfig, eslint, jest/vitest, etc.
- Recent git log — commit message style

This means Kai automatically follows your project's:
- Test framework (Jest, Vitest, etc.)
- File naming conventions
- Architecture patterns
- Lint and build commands
- Commit message format

---

## Plan Documents

Each ticket gets a plan at `plans/{TICKET-ID}/plan.md` tracking:

- Task list with statuses: NOT STARTED -> IN PROGRESS -> COMPLETED
- Approach and design decisions
- Data shapes and behavioral specs
- Results (PR link, test counts) after completion

Use `/kai:kai status` to see the current state, or `/kai:kai resume ENG-1234` to pick up where you left off.

---

## Safety Guarantees

- NEVER commits to main/master branches
- NEVER force-pushes or runs destructive git operations
- NEVER proceeds without plan approval
- Builder agents have git safety hooks that prevent destructive operations
- Guardian agents are enforced read-only (Write/Edit tools disabled)
- Plan document tracks all progress for resumability

---

## Examples

```
/kai:kai ENG-1234               Work on ticket ENG-1234
/kai:kai MOSAIC-567             Work on ticket MOSAIC-567
/kai:kai resume ENG-1234        Resume where you left off
/kai:kai status                 Check progress of current task
/kai:kai help                   Show this message
```
