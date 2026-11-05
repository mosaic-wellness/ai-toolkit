# ai-toolkit

## Security

This repo distributes hooks, MCP entries and agent prompts that run on every installing engineer's machine, plus the `services/beacon-telemetry` service. Treat changes to them as security-sensitive.

- Claude Code loads `.claude/rules/security-policy.md` automatically when you work on the paths it lists (plugin hooks, scripts, `.mcp.json`, commands, agents, MCP and credential setup skills (`*-mcp`, `tools-init`, `migrate`, admin, habit and PDP-experiment skills), `services/beacon-telemetry`, `scripts/bump.sh`, marketplace files).
- Codex agents do not load it automatically. Read `.claude/rules/security-policy.md` explicitly before editing those paths.
- Canonical policy and scoping checklist: `docs/agent-shared/security-policy.md`. Answer the checklist in every plan.
- Per-change review: `preventive-security-review` skill. Full audit, explicit only: `/security-audit` (Claude) or `$security-audit` (Codex). Both live in `.claude/skills/` and `.agents/skills/`.
- Removing or weakening a rule, the policy, a block hook or an auth check is P0 in review.
