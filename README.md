# Claude Plugins

Claude Code plugins for Mosaic Wellness teams.

## Available Plugins

| Plugin | What it does |
|--------|-------------|
| [kai](./plugins/kai/) | Technical co-pilot + Mosaic MCP wiring (Mixpanel, Firebase, New Relic, Kai orchestrator). Successor to the retired `mosaic-buddy` plugin — run `/kai migrate` after install if you're switching over. |
| [kai-dev](./plugins/kai-dev/) | JIRA-driven development orchestrator — ticket to PR in any repository |
| [mosaic-admin](./plugins/mosaic-admin/) | Admin MCP plugin for managing page configs (PDPs, widget pages, experiments) via Zeus |

## Quick Start

```bash
# 1. Add the marketplace (one-time)
/plugin marketplace add mosaic-wellness/ai-toolkit

# 2. Install a plugin
/plugin install kai
/plugin install mosaic-admin

# 3. Use it
/kai                       # interactive menu
/kai doctor                # health check your project
/kai tools-init            # wire Mixpanel / Firebase / New Relic
/mosaic-admin              # manage page configs
```

## Adding a New Plugin

1. Create a directory under `plugins/your-plugin-name/`
2. Add `.claude-plugin/plugin.json` with name, version, description
3. Add your commands, agents, skills, hooks
4. Register the plugin in `.claude-plugin/marketplace.json` at the repo root
5. Run `scripts/bump.sh <name> minor --commit` to version and publish
