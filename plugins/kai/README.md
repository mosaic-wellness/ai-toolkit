# Kai

**Your project's technical co-pilot.** Built for the people at Mosaic who build internal tools with Claude Code — PMs, ops, revenue, growth. You don't need to be an engineer. You just need to type `/kai`.

---

## Get Started

```bash
# 1. Add the marketplace (one-time)
/plugin marketplace add mosaic-wellness/ai-toolkit

# 2. Install the plugin
/plugin install kai

# 3. Provision credentials for Mixpanel / Firebase / New Relic
/kai tools-init
```

`/kai tools-init` is the first command you should run. It walks you through getting and validating tokens for each MCP server kai ships with, then writes them to `~/.config/kai/tokens.env` so every future Claude Code session picks them up automatically. Skip it and the Mixpanel / Firebase / New Relic calls will silently fail. It's idempotent — safe to re-run any time.

After that, run `/kai` in any project for the day-to-day commands (audits, reviews, debugging, brainstorming, docs, coaching). With no arguments, it shows an interactive menu.

> **Meta / Facebook Ads MCP?** That one doesn't go through `tools-init` — Meta's auth runs through Claude Desktop's Custom Connector flow. See [skills/mosaic-meta-ads/references/setup.md](skills/mosaic-meta-ads/references/setup.md).

> **Migrating from `mosaic-buddy`?** After installing kai, run **`/kai migrate`**. It copies your tokens from `~/.config/mosaic-buddy/tokens.env` to `~/.config/kai/tokens.env`, prints the `/mosaic-buddy → /kai` command-mapping table, and tells you the exact `/plugin uninstall mosaic-buddy` step. Idempotent — the legacy file is left in place so you can uninstall on your own schedule.

> **Migrating from `mosaic-admin`?** Run **`/kai migrate`** — it now also detects the retired `mosaic-admin` plugin and prints the `/mosaic-admin → /kai admin` command-mapping table. The admin-mcp API key uses the same env var (`ADMIN_MCP_API_KEY`) as before; kai reads it from `~/.config/kai/tokens.env`. Run `/kai tools-init admin-mcp` if you need to (re-)provision it.

---

## Mosaic MCPs

Five MCPs ship wired in `.mcp.json` and are provisioned via `/kai tools-init`. A sixth (Meta Ads) is set up separately through Claude Desktop because Meta's OAuth doesn't work via JSON config.

| MCP             | What it gives you                                       | Setup                                                                  |
| --------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| mixpanel-mcp    | Org-wide Mixpanel events, funnels, retention            | `/kai tools-init` (Mixpanel Service Account token)                     |
| firebase-mcp    | Firebase Crashlytics, Firestore, Remote Config          | `/kai tools-init` (runs `firebase login` OAuth)                        |
| kai-mcp         | Mosaic Kai orchestrator (CX, eng, analytics)            | Auto — Google OAuth on first call                                      |
| newrelic-mcp    | NRQL, error logs, alerts                                | `/kai tools-init` (New Relic User API key)                             |
| admin-mcp       | Mosaic Wellness page configs (PDPs, widget pages, experiments, habit trackers), staging-only | `/kai tools-init` (admin dashboard API key, `amk_` prefix) |
| Meta Ads (read-only) | Campaign / adset / ad performance, audiences, benchmarks | Claude Desktop → Settings → Connectors → Custom Connector. See [setup](skills/mosaic-meta-ads/references/setup.md). kai blocks all Meta write tools at the hook layer. |

Token storage for the first five: `~/.config/kai/tokens.env` (chmod 600, plugin updates never overwrite it). Meta tokens are stored by Claude Desktop, not on disk. admin-mcp writes are staging-only by design; production publishing uses the admin dashboard UI.

---

## What Can It Do?

| You say... | It does... | Command |
|---|---|---|
| "Is this ready to share?" | Full health audit — 80+ checks across reliability, safety, code quality, and UX | `/kai doctor` |
| "Are my tech choices solid?" | Quick scan for red flags — wrong DB, missing auth, deprecated models | `/kai review-stack` |
| "How does this hold up?" | Architecture review that asks about your intent before flagging anything | `/kai review` |
| "Would a user actually like this?" | UX audit with time estimates, not jargon | `/kai ux` |
| "I have an idea" | Turns a rough idea into a 1-page spec through conversation | `/kai brainstorm` |
| "Give it to me straight" | Honest product + code review — good stuff first, then what your VP would notice | `/kai grillme` |
| "Write it down" | Creates PRDs, tech specs, and decision records | `/kai document` |
| "Something's broken" | Structured debugging — classify, investigate, fix, document | `/kai debug` |
| "Save or resume a session" | One command, smart dispatch — saves a structured handoff if it doesn't exist, resumes it if it does | `/kai handoff <name>` |
| "Fork or resume a sidequest" | Same pattern — creates a fork snapshot if the name is new, resumes the saved one if it exists | `/kai sidequest <name>` |
| "Tell the team how it's going" | Quick rating + title + details, lands in the kai dashboard | `/kai feedback` |
| "How am I doing with Claude?" | Coaching report that finds your superpowers and time sinks | `/kai 5x` or `10x` |
| "Wire up Mixpanel / Firebase / NR / admin-mcp" | Interactive wizard to mint, validate, and persist API tokens to `~/.config/kai/tokens.env` | `/kai tools-init` |
| "Update a page config" | Edit PDPs, widget pages, run experiments — staging | `/kai admin` |
| "Manage habit trackers" | Create, clone, edit, map/unmap habit tasks & trackers across 7 brands | `/kai habit` |

Or just run **`/kai`** with no arguments to see an interactive menu.

---

## Admin & Habit (auto-triggered)

You don't need to type `/kai admin` or `/kai habit` to get the admin / habit specialists. The `admin-essentials`, `bulk-operations`, `habit-essentials`, and `habit-workflows` skills auto-activate whenever you mention page configs, PDPs, widget pages, experiments, brand settings, habit trackers, habit tasks, or any habit_* / admin-mcp tool surface. Just describe what you want to do in plain language and kai picks the right specialist.

The explicit slash routes are still useful when you want to skip directly to a flow:

- `/kai admin` — page-config work (PDPs, widget pages, experiments). Spawns `page-editor`, `page-builder`, or `experiment-manager` based on your intent.
- `/kai habit` — habit trackers and tasks. Spawns `habit-author` with the full 15-recipe playbook (R1 browse → R15 audit).
- `/kai tools-init admin-mcp` — provision the admin dashboard API key (`amk_...`) and validate it against staging.

admin-mcp writes are staging-only by design. Production publishing goes through the admin dashboard UI at Zeus.

---

## Safety Built In

Two hooks run automatically on every project:

- **Before you write a file** — blocks if it contains a hardcoded API key
- **After a bash command** — warns if the output leaked a key

You don't need to configure anything. They just work.

---

## Stack Guidance

Every command knows our approved stack and will guide you toward it:

| Layer | Use this | Not this |
|---|---|---|
| Backend | Fastify (Node 20) | Express, Hono, Nest.js |
| Frontend | React + Vite | Next.js*, Vue, Angular |
| Database | MySQL + Prisma | SQLite, PostgreSQL, MongoDB |
| Auth | Google OAuth | Custom JWT, passport-local |
| Deploy | EC2 | Vercel, Lambda, Docker |
| AI | @anthropic-ai/sdk | LangChain, OpenAI |

*\*Next.js is OK if you genuinely need SSR.*

---

## Privacy & Telemetry

Lightweight, anonymous usage tracking helps the team understand adoption. Here's exactly what's sent:

| Field | Example |
|---|---|
| Command name | `doctor` |
| Display name (local part of your git email) | `you` (not `you@mosaic.com`) |
| Repo folder name | `expense-tracker` |
| Timestamp | `2026-04-21T10:30:00Z` |

**Nothing else.** No file contents, no source code, no API keys, no arguments beyond the command name. Each event is HMAC-signed so random sources can't write to the dashboard.

If you use `/kai feedback`, the rating, title, and description you type are sent too — that one is explicit.

**Opt out:** `export KAI_TELEMETRY_URL=off` in your shell. Both auto-telemetry and explicit feedback submission will stop.

---

## License

MIT — see [LICENSE](LICENSE)
