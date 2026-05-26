# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A Claude Code plugin marketplace for Mosaic Wellness. Contains multiple plugins that team members install into their own projects. This repo is NOT a Node.js app — it's a collection of markdown-based plugin definitions (commands, agents, skills, hooks, references).

## Repository Structure

```
.claude-plugin/marketplace.json   # Plugin registry — lists all installable plugins with versions
plugins/<name>/                    # Each plugin is self-contained
  .claude-plugin/plugin.json      # Plugin metadata (name, version)
  commands/                        # Slash commands (entry points)
  agents/                          # Specialized agent prompts (.md)
  skills/                          # Auto-loaded knowledge (.md)
  hooks/                           # Pre/PostToolUse hooks
  references/                      # Reference docs agents can read
scripts/bump.sh                    # Version bump automation
services/                          # Supporting backend services
CHANGELOG.md                      # Version history
```

## Plugins

- **kai** — Successor to mosaic-buddy. Technical co-pilot for non-engineering teams + Mosaic-wide MCP wiring (Mixpanel, Firebase, New Relic, Kai orchestrator) + `tools-init` setup wizard + `migrate` command for users coming from mosaic-buddy. Has 10 agents, 14 skills, safety hooks. Command: `/kai`.
- **kai-dev** — JIRA-driven development orchestrator for engineering. Command: `/kai-dev`.
- **mosaic-admin** — Admin MCP plugin for page config management via Zeus. Command: `/mosaic-admin`.
- **mosaic-buddy** — *Retired and removed from the marketplace.* Folder remains under `plugins/mosaic-buddy/` for archival reference. New installs use `kai`; existing installs migrate via `/kai migrate` then `/plugin uninstall mosaic-buddy`.

## Version Management

Versions must stay in sync between `plugins/<name>/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Use the bump script:

```bash
scripts/bump.sh kai patch           # bump + update changelog
scripts/bump.sh kai minor --commit  # bump + commit
```

Never edit version numbers in JSON files manually.

## Plugin Anatomy

A plugin's behavior is defined entirely in markdown files:

- **Commands** (`commands/<name>.md`) — YAML frontmatter defines the slash command (name, allowed-tools, argument-hint). Body is the prompt that executes when the user invokes it.
- **Agents** (`agents/<name>.md`) — Spawned by the command router. Frontmatter sets model (sonnet/opus), allowed tools. Body is the full agent prompt.
- **Skills** (`skills/<name>/SKILL.md`) — Knowledge loaded into agents via `${SKILL:name}`. Frontmatter `description` controls when auto-loading triggers.
- **Hooks** (`hooks/hooks.json`) — Pre/PostToolUse hooks. Can be `"type": "command"` (shell) or `"type": "prompt"` (LLM check).
- **References** (`references/`) — Static docs that agents read via `${CLAUDE_PLUGIN_ROOT}/references/<file>`.

## Key Patterns

- kai's command router (`commands/kai.md`) dispatches to agents based on subcommand. When no args are passed, it must call `AskUserQuestion` immediately — no file scanning.
- kai has a telemetry hook (`hooks/telemetry.sh`) that fires on `SubagentStart` and `UserPromptSubmit`. The telemetry backend lives in `services/beacon-telemetry/` (separate Fastify+Prisma app deployed on Railway). Opt-out env var is `KAI_TELEMETRY_URL=off`.
- Plugin-level `CLAUDE.md` files contain rules all agents in that plugin must follow (tone, vocabulary, approved stack, etc.).

## Adding a New Plugin

1. Create `plugins/<name>/` with `.claude-plugin/plugin.json`
2. Add command, agents, skills as needed
3. Register in `.claude-plugin/marketplace.json`
4. Run `scripts/bump.sh <name> minor --commit`
