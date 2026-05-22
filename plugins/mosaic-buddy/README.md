# Mosaic Buddy

**Your project's technical co-pilot.** Built for the people at Mosaic who build internal tools with Claude Code — PMs, ops, revenue, growth. You don't need to be an engineer. You just need to type `/mosaic-buddy`.

---

## Get Started

```bash
# Add the marketplace (one-time)
/plugin marketplace add mosaic-wellness/claude-plugins

# Install the plugin
/plugin install mosaic-buddy
```

Then run `/mosaic-buddy` in any project. That's it.

---

## What Can It Do?

| You say... | It does... | Command |
|---|---|---|
| "Is this ready to share?" | Full health audit — 80+ checks across reliability, safety, code quality, and UX | `/mosaic-buddy doctor` |
| "Are my tech choices solid?" | Quick scan for red flags — wrong DB, missing auth, deprecated models | `/mosaic-buddy review-stack` |
| "How does this hold up?" | Architecture review that asks about your intent before flagging anything | `/mosaic-buddy review` |
| "Would a user actually like this?" | UX audit with time estimates, not jargon | `/mosaic-buddy ux` |
| "I have an idea" | Turns a rough idea into a 1-page spec through conversation | `/mosaic-buddy brainstorm` |
| "Give it to me straight" | Honest product + code review — good stuff first, then what your VP would notice | `/mosaic-buddy grillme` |
| "Write it down" | Creates PRDs, tech specs, and decision records | `/mosaic-buddy document` |
| "Something's broken" | Structured debugging — classify, investigate, fix, document | `/mosaic-buddy debug` |
| "Save or resume a session" | One command, smart dispatch — saves a structured handoff if it doesn't exist, resumes it if it does | `/mosaic-buddy handoff <name>` |
| "Fork or resume a sidequest" | Same pattern — creates a fork snapshot if the name is new, resumes the saved one if it exists | `/mosaic-buddy sidequest <name>` |
| "Tell the team how it's going" | Quick rating + title + details, lands in the mosaic-buddy dashboard | `/mosaic-buddy feedback` |
| "How am I doing with Claude?" | Coaching report that finds your superpowers and time sinks | `/mosaic-buddy 5x` or `10x` |

Or just run **`/mosaic-buddy`** with no arguments to see an interactive menu.

---

## Auto-Activating Skills

Some capabilities don't need a command — just describe what you want and Buddy picks the right skill.

### Design Audit (Mosaic brands)

Structured 1–5 scorecard across 8 domains (usability, visual design, brand compliance, content, accessibility, trust, conversion, emotional design) with a PDF report and spider chart for **Little Joys**, **Man Matters**, and **Be Bodywise**.

**How to trigger it** — just share a screenshot, URL, or Figma link and ask for feedback. No command needed. Examples:

- "Audit this PDP screenshot for Man Matters"
- "Score this Little Joys shop page"
- "What do you think of this Bodywise checkout flow?"
- "Brand compliance check on this landing page"

**What you get:**
1. Brand detection (or a prompt if Buddy can't tell)
2. Mobile-first review with the correct brand design system, tokens, and personas loaded
3. 8-domain scorecard (1–5 per domain, weighted by brand)
4. Findings with severity + fix recommendations
5. Printable PDF report with a spider chart

**Tip:** mobile screenshots give the most accurate audit. URLs work, but you'll lose some visual precision (exact colors, spacing, contrast).

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

If you use `/mosaic-buddy feedback`, the rating, title, and description you type are sent too — that one is explicit.

**Opt out:** `export MOSAIC_BUDDY_TELEMETRY_URL=off` in your shell. Both auto-telemetry and explicit feedback submission will stop.

---

## License

MIT — see [LICENSE](LICENSE)
