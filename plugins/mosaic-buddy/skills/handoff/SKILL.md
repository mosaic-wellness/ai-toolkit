---
name: handoff
description: >
  Write a durable, structured session handoff to work-log/<sessionName>/session-N.md
  so a fresh Claude (or future you) can resume the work cleanly. Captures the initial
  agenda, the refined agenda, work completed, open threads, and concrete resume
  instructions. This is NOT context compaction — it's a hand-authored summary file.
---

# Handoff

Write a durable summary of the current Claude Code session to **`<projectRoot>/work-log/<sessionName>/session-N.md`** so the work can be resumed cleanly in a new session.

This is **not** context compaction. It's a hand-authored summary aimed at a future agent that has zero memory of this conversation.

The router passes any text after `handoff` as `$ARGUMENTS`. Treat that text (trimmed, lowercased, kebab-cased) as the proposed `sessionName`. If empty, follow Step 1 below.

## Step 1: Resolve `sessionName` (prefer the Claude Code session title)

The handoff filename should match the Claude Code session's own title (set by `/rename`), so the work-log folder and the session label stay aligned.

**1a. If the user passed an argument**, use it as `sessionName`. Skip to Step 2.

**1b. Otherwise, detect the current session title:**

```bash
SESSION_ID="$CLAUDE_CODE_SESSION_ID"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_SLUG="$(echo "$PROJECT_ROOT" | sed 's|/|-|g')"   # e.g. -Users-hiteshburla-...
SESSION_JSONL="$HOME/.claude/projects/$PROJECT_SLUG/$SESSION_ID.jsonl"

# Look for the custom-title record written by `/rename`
CURRENT_TITLE=$(grep -m1 '"type":"custom-title"' "$SESSION_JSONL" 2>/dev/null \
  | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()).get("customTitle",""))' 2>/dev/null)

echo "Detected session title: ${CURRENT_TITLE:-<unnamed>}"
```

- If `CURRENT_TITLE` is non-empty → use it as `sessionName`. Tell the user "Using existing session title: `<title>`" and skip to Step 2.
- If empty → continue to 1c.

**1c. Session is unnamed. Ask the user (single `AskUserQuestion`):**

- **Question:** "This Claude Code session isn't named yet. What should we call it? (Optional — skip and I'll use a date-based fallback.)"
- **Header:** "Session name"
- **Options (2–3):** sensible kebab-case suggestions derived from the *actual* work this session — not generic placeholders. Always include a "Skip naming" option that uses fallback `unnamed-YYYY-MM-DD` (current date).

**1d. Tell the user to run `/rename` so the Claude Code title matches.**

Slash commands cannot be invoked from inside a skill, so emit a clear instruction for the user to execute. After explaining what you'll write, output **one** of:

- If user supplied a name `<name>`:
  > Run this now so the session title matches the handoff file:
  > ```
  > /rename <name>
  > ```
- If user skipped naming:
  > Run this if you'd like to label the session interactively (optional):
  > ```
  > /rename
  > ```

Proceed regardless of whether the user runs it — the handoff file uses the resolved `sessionName` either way.

**1e. Normalise:** `sessionName` must match `^[a-z0-9][a-z0-9-]*$`. Lowercase, replace spaces/underscores with `-`, strip other chars. Confirm with user only if the normalisation changed the input materially.

## Step 2: Resolve target path, create folder, ensure gitignored

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SESSION_DIR="$PROJECT_ROOT/work-log/<sessionName>"
mkdir -p "$SESSION_DIR"

# Ensure work-log/ is gitignored at the project root.
# Idempotent: only appends if no existing rule matches.
GITIGNORE="$PROJECT_ROOT/.gitignore"
if [ -d "$PROJECT_ROOT/.git" ] || git -C "$PROJECT_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  if ! grep -Eq '^[[:space:]]*/?work-log/?[[:space:]]*$' "$GITIGNORE" 2>/dev/null; then
    # Add a trailing newline if the file doesn't end with one, then append.
    [ -s "$GITIGNORE" ] && [ "$(tail -c1 "$GITIGNORE" 2>/dev/null)" != "" ] && printf '\n' >> "$GITIGNORE"
    printf '\n# Claude Code handoff summaries (local-only)\nwork-log/\n' >> "$GITIGNORE"
    echo "Added work-log/ to $GITIGNORE"
  fi
fi

# Find next session number
LAST=$(ls "$SESSION_DIR" 2>/dev/null \
  | grep -E '^session-[0-9]+\.md$' \
  | sed -E 's/^session-([0-9]+)\.md$/\1/' \
  | sort -n | tail -1)
NEXT=$(( ${LAST:-0} + 1 ))
TARGET="$SESSION_DIR/session-$NEXT.md"
echo "Will write: $TARGET"
```

**Work-log is always project-local.** Never write into `~/.claude/`, a global path, or a parent directory.

**Gitignore handling:**
- Only touches `.gitignore` if the project is a git repo.
- Skips if any existing rule already matches `work-log/` (idempotent).
- Appends a single labelled section so the change is easy to spot in diffs.
- Mention the `.gitignore` edit explicitly in the Step 5 report so the user can review/revert it.

If `work-log/<sessionName>/` already has prior sessions, **read the most recent one first** — your new file should reference what's changed since (closed threads, new decisions) rather than restating everything.

## Step 3: Gather grounding facts (parallel)

Before drafting, collect concrete signals so the summary is faithful, not vibes:

```bash
git status
git diff --stat
git log --oneline -20
git branch --show-current
```

Also scan the conversation transcript yourself for:
- The user's **first substantive message** (initial agenda)
- Moments where the agenda was **renegotiated** (mid-session pivots, scope cuts)
- Decisions made and their reasoning
- TODOs / followups explicitly deferred
- Open questions the user never answered

## Step 4: Write the handoff file

Use this exact template. Be concrete — name files, line numbers, branch names, exact commands. A future agent should be able to act from this file alone without re-deriving anything.

```markdown
# Session <N> — <sessionName>

**Date:** <YYYY-MM-DD>
**Claude Code session id:** <CLAUDE_CODE_SESSION_ID>
**Branch:** <branch>
**Working directory:** <project root>
**Prior sessions:** <list session-1.md..session-(N-1).md, or "none">

---

## 1. Initial agenda (what the user asked for)

<1–4 sentences. Quote or paraphrase the user's first substantive ask. Include
any constraints they stated up front. Do NOT editorialise — this is what they
walked in wanting.>

## 2. Refined agenda (what we converged on)

<What the work actually became after discussion. Call out pivots explicitly:
"Originally X, narrowed to Y because Z." If the agenda didn't change, say so.>

## 3. Work completed

<Bullet list of concrete changes. For each:
- What changed (file paths, functions, commits)
- Why
- Verified how (tests run, manual checks, or "not verified yet")>

## 4. Open threads / not yet done

<Bullet list. For each item: what's left, where it lives, and any partial
work-in-progress (uncommitted diffs, stub code, branches).>

## 5. Resume instructions

> A fresh agent reads this section to pick up the work. Be specific.

**Next concrete step:** <one sentence — the literal next thing to do>

**Key files to read first:**
- `path/to/file.ts:42-110` — <why it matters>
- `path/to/spec.md` — <why it matters>

**Mental model / domain context the agent needs:**
- <non-obvious things only — don't re-explain what the code already shows>

**Gotchas discovered this session:**
- <traps the future agent should not re-hit>

**Commands likely to be useful:**
```bash
<actual commands, not placeholders>
```

## 6. Open questions for the user

<Anything the user owes an answer on before work can continue. Empty section
is fine — write "None." rather than deleting the heading.>

## 7. Git state at handoff

```
<paste output of `git status` and `git log --oneline -5`>
```
```

## Step 5: Confirm and report

After writing, report to the user in 2–3 lines:
- The path written: `work-log/<sessionName>/session-N.md`
- One-sentence summary of what was captured
- How to resume later: open a fresh Claude Code session in this project and say *"Read `work-log/<sessionName>/session-<N>.md` and pick up from the Resume instructions section."*
- If `.gitignore` was modified in Step 2, mention it: "Added `work-log/` to `.gitignore`."

If you instructed the user to run `/rename` in Step 1d and they haven't yet, remind them once.

Do **not** offer to commit the file — the user decides when to commit work-log entries.

## Rules

1. **Never fabricate work** — if you're unsure whether something was completed, mark it open.
2. **Quote the user's original ask** verbatim when possible — paraphrasing loses intent.
3. **Don't restate the codebase** — the future agent can read files; you can't read it for them. Capture only what isn't recoverable from the repo.
4. **One file per call** — never overwrite an existing `session-N.md`. Always increment.
5. **Project-local, not global** — the file lives inside the current project's `work-log/`, never in `~/.claude/`.
6. **Don't run `/compact`** — handoff is independent of context compaction. The user can compact separately if they want.
7. **Don't write the jsonl `custom-title` record directly** — only `/rename` should do that, run by the user.
