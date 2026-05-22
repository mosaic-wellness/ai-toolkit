# kai — Claude Code Plugin

JIRA-driven development orchestrator. Takes a ticket and drives it end-to-end: understanding, exploring, planning, building, reviewing, and creating PRs. Works in any repository.

## Prerequisites

- Claude Code CLI installed
- JIRA MCP server configured (Atlassian Rovo recommended — see setup guide)
- GitHub CLI (`gh`) authenticated for PR creation

## Installation

### Via Marketplace (recommended)

```bash
# 1. Add the marketplace (one-time)
/plugin marketplace add mosaic-wellness/claude-plugins

# 2. Install the plugin
/plugin install kai
```

### Via Local Path (development)

```bash
claude plugins add /path/to/claude-plugins/plugins/kai
```

## First-Time Setup

Run `/kai:kai help` to verify the plugin is loaded. On first use with a ticket, Kai will check for JIRA MCP and guide you through setup if needed.

## Usage

```
/kai:kai <ticket-id>          Full workflow for a JIRA ticket
/kai:kai help                 Show usage guide
/kai:kai status               Show status of the current kai task
/kai:kai resume <ticket-id>   Resume a previously started workflow
```

## Workflow Phases

```
Phase 1: Setup           Connect to JIRA, fetch ticket, add "kai-agent" label
    |
Phase 2: Understand      Parse user story, identify affected areas, ask questions
    |
Phase 3: Explore         Investigate the codebase, discover conventions
    |
Phase 4: Plan            Create a detailed technical spec (no real code)
    |
Phase 5: Review Plan     You review and approve the plan (required)
    |
Phase 6: Execute         Builder agent implements with TDD, following project conventions
    |
Phase 7: Code Review     Guardian agent validates quality and acceptance criteria
    |
Phase 8: Finalize        Create PR, update JIRA, present summary
```

## Components

| Type | Name | Purpose |
|---|---|---|
| Command | `/kai:kai` | Entry point — JIRA-driven development orchestrator |
| Agent | `builder` | TDD builder — discovers and follows project conventions |
| Agent | `guardian` | Read-only code reviewer — validates quality and acceptance criteria |
| Agent | `architect` | Scope classifier and spec generator for ad-hoc requests |
| Hook | PreToolUse | Blocks destructive git operations (force push, reset --hard, etc.) |

## How It Adapts

Kai works in any repository by discovering conventions at runtime:
- `CLAUDE.md` / `AGENTS.md` — project conventions and architecture
- `.claude/rules/*.md` — granular rules
- `package.json` — package manager, test/lint/build commands
- Config files — tsconfig, eslint, jest/vitest, etc.
- Git log — commit message style

## Safety

- **Never commits to main/master** — always feature branches
- **Never force-pushes** — destructive git operations are blocked by hooks
- **Never proceeds without plan approval** — explicit user confirmation required
- **Guardian agents are read-only** — Write/Edit tools disabled
- **Plan documents track progress** — full resumability via `/kai:kai resume`

## Reference Docs

- `references/help.md` — Full usage guide with examples
- `references/jira-mcp-setup.md` — JIRA MCP server setup instructions
- `workflows/` — Phase-by-phase workflow instructions (7 files)
- `templates/` — Plan, PR body, and JIRA comment templates
