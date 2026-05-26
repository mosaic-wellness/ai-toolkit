# Token Optimization Guidelines

How to keep Claude Code spend in check without sacrificing quality.

---

## Action Points

### User habits (do these every session)

- Start a new chat per task, or run `/clear` before switching tasks.
- For long sessions, if using the `kai` plugin (recommended)→ use `handoff` / `sidequest`, or use Claude's `/compact` command.
- Edit prior prompts instead of replying with corrections.
- Convert PDFs/screenshots to text/Markdown before upload.

### Model routing

- **Opus** → only complex planning / ambiguous debugging.
- **Sonnet 4.6** → default for execution (better cost/quality than Opus for actual code).
- **Haiku 4.5** → grunt work: reads, summaries, mechanical edits.
- Plan with Opus → execute with Sonnet → delegate grunt to Haiku subagents.

---

## One-time optimized setup for your project

**If using the `kai` plugin:** run the `token-usage-guardrails` skill once in your project.

```
/kai token-usage-guardrails
```

**Otherwise:** paste the prompt below into Claude Code at the root of any repo.

```
Set up token-optimization guardrails for this project.

1. Check if CLAUDE.md exists at the repo root.
   - If YES: append a new section "## Token Efficiency & Model Routing" (do not duplicate if already present). Preserve all existing content.
   - If NO: create CLAUDE.md. Read the repo structure (package.json, primary framework, top-level folders) and add a brief "Project Overview" + "Ownership Map" section tailored to this repo, THEN append the token-efficiency section below.

2. The "## Token Efficiency & Model Routing" section MUST contain:

   - I want optimal quality but in a token efficient way.
   - Do not use Opus for low-effort grunt work.
   - Spin subagents which use Haiku for grunt work/edits or quick reads and summaries.
   - Offload tasks to subagents which use Sonnet to handle tasks needing mild thinking but still some level of thinking effort.
   - Delegate file searches, greps, and summaries to the Explore subagent. Run independent subagent calls in parallel (single message, multiple tool uses).
   - Do NOT re-read files already in context unless they may have changed.
   - Prefer Edit over Write. Never rewrite a file to change a few lines.
   - Use Glob/Grep for known targets; reserve agent searches for open-ended exploration.
   - Be concise in user-facing text. No preambles, no trailing summaries, no restating the question. Respond in caveman style: terse, no filler, no preambles, no trailing summaries. Short sentences. Skip pleasantries.
   - One focused implementation pass — avoid write/delete/rewrite churn.
   - No emojis or em-dashes.
   - Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.
   - For PDFs/screenshots, ask the user to provide text/Markdown when possible.

3. Check if .claude/ directory exists.
   - If NO: create .claude/agents/ and .claude/rules/ folders.
   - If YES: leave existing agents/rules untouched.

4. Create .claude/rules/token-efficiency.md with the same routing + context rules (so it loads on demand).

Do not modify unrelated content.
```
