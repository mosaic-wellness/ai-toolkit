---
name: token-usage-guardrails
description: >
  Set up token-optimization guardrails for the current project. Creates or
  updates the root CLAUDE.md with a "Token Efficiency & Model Routing" section,
  scaffolds .claude/agents/ and .claude/rules/ if missing, writes
  .claude/rules/token-efficiency.md, and for monorepos adds per-package
  CLAUDE.md stubs. Idempotent — preserves existing content.
---

# Token Usage Guardrails

One-shot setup that installs token-efficiency rules into the current project so future Claude Code sessions in this repo route work cheaply by default.

The router invokes this skill when the user runs `/mosaic-buddy token-usage-guardrails`. Execute the steps in order. Do **not** touch unrelated files.

---

## Step 0 — Locate the repo root

1. Run `git rev-parse --show-toplevel` to find the repo root. If it fails (not a git repo), use the current working directory.
2. All paths below are relative to that root.

---

## Step 1 — Update or create the root CLAUDE.md

Check if `CLAUDE.md` exists at the repo root.

**If YES:**
- Read the current file.
- If it already contains a heading `## Token Efficiency & Model Routing`, stop — do nothing. Tell the user it's already installed.
- Otherwise, **append** the section from the "Section block" below to the end of the file. Preserve every byte of existing content.

**If NO:**
- Inspect the repo to build a small tailored header:
  - Read `package.json` if present (name, main framework from dependencies — React, Next, Vite, Fastify, Express, etc.).
  - List top-level folders with `ls -1` (skip dotfiles, `node_modules`, `dist`).
  - If a monorepo signal exists (`packages/`, `apps/`, `libs/`, `pnpm-workspace.yaml`, `nx.json`, `turbo.json`, root workspaces field), note it.
- Write a new `CLAUDE.md` with this structure:

  ```markdown
  # CLAUDE.md

  ## Project Overview

  <one or two sentences: what this repo is, primary framework, runtime>

  ## Ownership Map

  <bulleted list of top-level folders and a one-line purpose for each>

  <SECTION BLOCK FROM BELOW>
  ```

Do not fabricate ownership details you cannot read from the repo. If a folder's purpose isn't obvious from its name or contents, write `- <folder>/ — purpose unclear, ask the team`.

### Section block (copy verbatim)

```markdown
## Token Efficiency & Model Routing

- I want optimal quality but in a token efficient way.
- Do not use Opus for low-effort grunt work.
- Spin subagents which use Haiku for grunt work, edits, or quick reads and summaries.
- Offload tasks to subagents which use Sonnet for tasks that need mild thinking but still some level of effort.
- Delegate file searches, greps, and summaries to the Explore subagent. Run independent subagent calls in parallel (single message, multiple tool uses).
- Do NOT re-read files already in context unless they may have changed.
- Prefer Edit over Write. Never rewrite a file to change a few lines.
- Use Glob/Grep for known targets; reserve agent searches for open-ended exploration.
- Be concise in user-facing text. No preambles, no trailing summaries, no restating the question. Respond in caveman style: terse, no filler, no preambles, no trailing summaries. Short sentences. Skip pleasantries.
- One focused implementation pass — avoid write/delete/rewrite churn.
- No emojis or em-dashes.
- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.
- For PDFs/screenshots, ask the user to provide text/Markdown when possible.
```

---

## Step 2 — Scaffold .claude/ if missing

Check if `.claude/` exists at the repo root.

- **If NO:** create `.claude/agents/` and `.claude/rules/` (both folders).
- **If YES:** leave existing `agents/` and `rules/` contents untouched. Create either subfolder only if it is missing.

Do not delete or rename any existing file under `.claude/`.

---

## Step 3 — Write .claude/rules/token-efficiency.md

If the file already exists, leave it alone (the user may have customised it). Otherwise create it with this exact content:

```markdown
# Token Efficiency & Model Routing

Load this rule when planning multi-step work, spawning subagents, or before large edits.

## Model routing

- Optimal quality, token-efficient. Match the model to the work.
- Opus: reserved for hard reasoning, architecture, ambiguous design calls.
- Sonnet: default for tasks that need mild thinking but real judgment.
- Haiku: grunt work, quick reads, summaries, edits with clear instructions.

## Subagent delegation

- Delegate file searches, greps, and summaries to the Explore subagent.
- Run independent subagent calls in parallel — single message, multiple tool uses.
- Spawn Haiku subagents for grunt work and Sonnet subagents for mild thinking.

## Context hygiene

- Do not re-read files already in context unless they may have changed.
- Prefer Edit over Write. Never rewrite a file to change a few lines.
- Use Glob/Grep for known targets; reserve agent searches for open-ended exploration.
- One focused implementation pass — avoid write/delete/rewrite churn.

## Output discipline

- Be concise. No preambles, no trailing summaries, no restating the question.
- Caveman style: terse, no filler, short sentences. Skip pleasantries.
- No emojis or em-dashes.

## Verification

- Do not guess APIs, versions, flags, commit SHAs, or package names. Verify by reading code or docs before asserting.
- For PDFs/screenshots, ask the user to provide text/Markdown when possible.
```

---

## Step 4 — Report back

After writing files, print a short summary to the user:

- Which files were created vs updated vs skipped (already present).
- The monorepo packages touched (if any).
- One-line next step: "Restart your Claude Code session to pick up the new rules."

Keep the summary terse — bulleted list, no narrative.

---

## Safety footer

- Never overwrite an existing `CLAUDE.md`, `.claude/rules/token-efficiency.md`, or per-package `CLAUDE.md`. Only append or skip.
- Never touch files outside the repo root.
- Do not modify `.gitignore`, lockfiles, or source code.
- If any write fails (permissions, read-only mount), stop and report — do not retry destructively.
- Do not modify unrelated content.
