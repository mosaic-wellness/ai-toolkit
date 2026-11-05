---
paths:
  - "plugins/*/hooks/**"
  - "plugins/*/scripts/**"
  - "plugins/kai/.mcp.json"
  - "plugins/*/.claude-plugin/plugin.json"
  - ".claude-plugin/marketplace.json"
  - "plugins/*/commands/*.md"
  - "plugins/*/agents/*.md"
  - "plugins/kai-dev/workflows/*.md"
  - "plugins/kai/skills/tools-init/**"
  - "plugins/kai/skills/migrate/**"
  - "plugins/kai/skills/mosaic-meta-ads/**"
  - "plugins/kai/skills/*-mcp/**"
  - "plugins/kai/skills/admin-essentials/**"
  - "plugins/kai/skills/bulk-operations/**"
  - "plugins/kai/skills/habit-essentials/**"
  - "plugins/kai/skills/habit-workflows/**"
  - "plugins/kai/skills/pdp-narrative-experiments/**"
  - "plugins/mosaic-admin/skills/**"
  - "scripts/bump.sh"
  - "services/beacon-telemetry/**"
---

# Security rules (write-time)

Canonical policy: `docs/agent-shared/security-policy.md`. Read it before scoping or changing these paths. Answer its Scoping checklist in every plan.
This repo ships hooks, MCP entries and agent prompts that run on every installing engineer's machine. Treat each change as code that runs with the engineer's permissions.

Never ship:

- **Fail-open guards.** A block hook decides what happens when its parser or `jq` fails, and denies for the action it guards. Today `plugins/kai/hooks/block-meta-writes.sh` and `plugins/kai-dev/scripts/block-destructive-git.sh` allow on parse failure; do not copy that into a new hook. Do not describe a regex or prompt hook as a complete control.
- **Weakened spend and live-write blocks.** Keep the Meta Ads write block (`plugins/kai/hooks/block-meta-writes.sh`, matcher in `plugins/kai/hooks/hooks.json`). Live writes (admin-mcp, git push, PR, Jira transition) need explicit user approval.
- **Credential values in tracked files.** Name the env key only (`KAI_HMAC_KEY`, `TELEMETRY_HMAC_KEY`, `TELEMETRY_ADMIN_TOKEN`). Do not write the telemetry signing default into new files. Compare secrets with `timingSafeEqual`.
- **Careless key storage.** `tools-init` and `mosaic-admin` setup write keys to `~/.claude.json`, `tokens.env` or a project `.mcp.json`. Create the file with mode 600 before filling it, remove or protect backups, never echo a key, and never put a key into a URL.
- **Copied or new OAuth state.** Firebase (`firebase-tools` configstore) and Mixpanel (`mcp-remote`) keep their own OAuth tokens. Do not copy those tokens elsewhere, add another OAuth client, or state that the repo enforces the Google account domain. Pin the CLI version when `.mcp.json` changes.
- **Helper scripts that read local data.** `plugins/kai/skills/mixpanel-mcp/scripts/lexicon-query.py` takes its file from an env var, a flag or a sibling-directory search. A new helper names a fixed source, does not scan unrelated directories, and prints only what the task needs.
- **Wider telemetry.** Hooks send email local part, repo name, session id, OS and plugin version only. Do not add prompt text, paths, file names or tool input. Keep `KAI_TELEMETRY_URL=off` working in every script that makes a request.
- **Unsigned decision fields.** In `services/beacon-telemetry`, treat `user_local`, `project`, `subcommand`, `session_id` and `metadata` as labels. A field that drives a decision goes inside the HMAC string.
- **Open admin routes.** New beacon routes use the `guard` preHandler; keep both `checkAuth` copies identical (`server.js`, `services/beacon-telemetry/src/routes/admin.js`). Do not add `?token=` links or log the token.
- **Structure from input.** Build JSON with `jq --arg` or `python3 json.dumps`, never string concatenation (see `plugins/kai/scripts/bulk-fetch.sh`). Quote shell expansions. Keep `$queryRaw` tagged templates (no `$queryRawUnsafe`) and `textContent` rendering.
- **Unpinned or unowned destinations.** Pin `npx` package versions in `.mcp.json`. Do not read a destination URL or key from a project file the user did not author without asking.
- **Wider agent tools.** Do not add `Bash`, `Write`, `Edit` or `WebFetch` to a `tools:` / `allowed-tools:` line without a stated reason. Review agents stay read-only in capability, not only in prose.
- **Brand drift.** A new brand, write-tool prefix or habit tool updates the allow-lists in `plugins/kai/hooks/hooks.json` and the reference docs in one commit.
- **Silent release changes.** Change versions only with `scripts/bump.sh` so `plugin.json` and `.claude-plugin/marketplace.json` stay in sync. A new marketplace entry or hook is a human-approved change.
- **Unbounded work.** Queries on `beacon_events` keep the `plugin = ANY(...)` filter; `beacon_feedback` has no `plugin` column and is exempt. All dashboard queries keep a clamped window or `LIMIT`. Hooks keep short curl timeouts.

Removing or weakening these rules, the policy, a block hook, or an auth check is P0 in review. A touched pattern needs its proposed negative test from the policy's recipes.
