# Kai

**Your project's technical co-pilot.** Built for the people at Mosaic who build internal tools with Claude Code — PMs, ops, revenue, growth. You don't need to be an engineer. You just need to type `/kai`.

---

## Get Started

```bash
# Add the marketplace (one-time)
/plugin marketplace add mosaic-wellness/ai-toolkit

# Install the plugin
/plugin install kai
```

Then run `/kai` in any project. That's it.

> **Migrating from `mosaic-buddy`?** After installing kai, run **`/kai migrate`**. It copies your tokens from `~/.config/mosaic-buddy/tokens.env` to `~/.config/kai/tokens.env`, prints the `/mosaic-buddy → /kai` command-mapping table, and tells you the exact `/plugin uninstall mosaic-buddy` step. Idempotent — the legacy file is left in place so you can uninstall on your own schedule.

---

## Mosaic MCPs (ships built-in)

Kai wires four MCPs the moment you install it. Run `/kai tools-init` to provision credentials.

| MCP             | What it gives you                              | Auth                               |
| --------------- | ---------------------------------------------- | ---------------------------------- |
| mosaic-mixpanel | Org-wide Mixpanel events, funnels, retention   | Mixpanel Service Account token     |
| mosaic-firebase | Firebase Crashlytics, Firestore, Remote Config | `firebase login` OAuth             |
| kai-mcp         | Mosaic Kai orchestrator (CX, eng, analytics)   | Google OAuth on first call         |
| mosaic-newrelic | NRQL, error logs, alerts                       | New Relic User API key             |

Token storage: `~/.config/kai/tokens.env` (chmod 600, plugin updates never overwrite it).

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
| "Wire up Mixpanel / Firebase / NR" | Interactive wizard to mint, validate, and persist API tokens to `~/.config/kai/tokens.env` | `/kai tools-init` |

Or just run **`/kai`** with no arguments to see an interactive menu.

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
