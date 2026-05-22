# Claude Plugins

Claude Code plugins for Mosaic Wellness teams.

## Available Plugins

| Plugin | What it does |
|--------|-------------|
| [mosaic-buddy](./plugins/mosaic-buddy/) | Technical co-pilot — health checks, reviews, brainstorming, docs, debugging, coaching |
| [mosaic-admin](./plugins/mosaic-admin/) | Admin MCP plugin for managing page configs (PDPs, widget pages, experiments) via Zeus |
| [mosaic-tech](./plugins/mosaic-tech/) | AI app development assistant — setup review, debugging, architecture, security |
| [kai](./plugins/kai/) | JIRA-driven development orchestrator — ticket to PR in any repository |

## Quick Start

```bash
# 1. Add the marketplace (one-time)
/plugin marketplace add mosaic-wellness/ai-toolkit

# 2. Install a plugin
/plugin install mosaic-buddy
/plugin install mosaic-admin

# 3. Use it
/mosaic-buddy              # interactive menu
/mosaic-buddy doctor       # health check your project
/mosaic-admin              # manage page configs
```

## Adding a New Plugin

1. Create a directory under `plugins/your-plugin-name/`
2. Add `.claude-plugin/plugin.json` with name, version, description
3. Add your commands, agents, skills, hooks
4. Register the plugin in `.claude-plugin/marketplace.json` at the repo root
5. Run `scripts/bump.sh <name> minor --commit` to version and publish
