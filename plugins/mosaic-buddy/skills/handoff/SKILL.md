---
name: handoff
description: >
  One-command session save and resume. `/mosaic-buddy handoff <sessionName>`
  auto-detects intent from the work-log folder: missing → write a fresh handoff;
  exists & last written by this session → save another checkpoint; exists &
  written by a different session → resume (read latest, verify repo, brief).
  NOT context compaction — these are hand-authored, durable files.
---

# Handoff

One command, three behaviours — all dispatched automatically based on what's already on disk.

| Situation                                                                                       | Mode    |
|-------------------------------------------------------------------------------------------------|---------|
| `work-log/<sessionName>/` doesn't exist                                                         | Create  |
| `work-log/<sessionName>/` exists AND latest `session-N.md` was written by THIS Claude Code session | Create (writes `session-(N+1).md`) |
| `work-log/<sessionName>/` exists AND latest `session-N.md` was written by a DIFFERENT session   | Resume  |
| `/mosaic-buddy handoff` (no args)                                                               | Ask the user |

The router passes any text after `handoff` as `$ARGUMENTS`. Use that to dispatch (see Step 0).

This is **not** context compaction. CREATE writes a durable summary file; RESUME reads it back in a fresh session.

## Step 0: Dispatch

**Parse the input first.**

- If `$ARGUMENTS` is empty → follow Step 0a (interactive mode select).
- Else, strip a leading `new ` if present (backward-compat with 3.5.0 syntax — just treat it as the name). The remaining text is `sessionName`.
- **Normalise `sessionName`** against `^[a-z0-9][a-z0-9-]*$`: lowercase, replace spaces/underscores with `-`, strip other chars. Confirm with the user if normalisation materially changed the input.

**Then dispatch using the folder state:**

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SESSION_DIR="$PROJECT_ROOT/work-log/$SESSION_NAME"

if [ ! -d "$SESSION_DIR" ]; then
  MODE=create
else
  LATEST_N=$(ls "$SESSION_DIR" 2>/dev/null \
    | grep -E '^session-[0-9]+\.md$' \
    | sed -E 's/^session-([0-9]+)\.md$/\1/' \
    | sort -n | tail -1)

  if [ -z "$LATEST_N" ]; then
    MODE=create
  else
    LATEST_FILE="$SESSION_DIR/session-$LATEST_N.md"
    LATEST_SID=$(grep -m1 '^\*\*Claude Code session id:\*\*' "$LATEST_FILE" 2>/dev/null \
      | sed -E 's/^\*\*Claude Code session id:\*\* *//' | tr -d '[:space:]')

    if [ -n "$CLAUDE_CODE_SESSION_ID" ] && [ "$LATEST_SID" = "$CLAUDE_CODE_SESSION_ID" ]; then
      MODE=create   # same Claude Code session as last writer → user is adding another checkpoint
    else
      MODE=resume
    fi
  fi
fi
echo "Dispatched: MODE=$MODE  N_existing=${LATEST_N:-0}"
```

Tell the user which mode you picked, in one short line — e.g. "No prior handoff found, saving a fresh one." or "Found 2 prior handoffs by a different session — resuming the latest."

### Step 0a: No args — ask the user

Ask via a single `AskUserQuestion`:

- **Question:** "Save the current session, or resume a previous one?"
- **Header:** "Handoff"
- **Options:**
  - "Save current session" → continue to C1 to resolve the name
  - "Resume a previous session" → list existing sessions as a follow-up question. Run `ls "$PROJECT_ROOT/work-log/" 2>/dev/null | grep -v '^forks$'` for the option list. If `work-log/` doesn't exist or is empty, tell the user "No saved sessions in this project yet — I'll save the current one instead" and continue to C1.

After the user picks, re-enter Step 0 with the resolved arguments.

Forbid the literal name `new` for sessionName — it would be ambiguous with the backward-compat strip rule above.

---

# CREATE mode

Write a durable summary of the current Claude Code session to **`<projectRoot>/work-log/<sessionName>/session-N.md`** so the work can be resumed cleanly via `/mosaic-buddy handoff <sessionName>` in a fresh session.

## C1: Resolve `sessionName` (when not already given)

If Step 0 already resolved a name, skip to C2.

Otherwise (came in via Step 0a "Save current session" with no name provided):

**C1a. Detect the current Claude Code session title:**

```bash
SESSION_ID="$CLAUDE_CODE_SESSION_ID"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_SLUG="$(echo "$PROJECT_ROOT" | sed 's|/|-|g')"
SESSION_JSONL="$HOME/.claude/projects/$PROJECT_SLUG/$SESSION_ID.jsonl"

CURRENT_TITLE=$(grep -m1 '"type":"custom-title"' "$SESSION_JSONL" 2>/dev/null \
  | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()).get("customTitle",""))' 2>/dev/null)

echo "Detected session title: ${CURRENT_TITLE:-<unnamed>}"
```

- If `CURRENT_TITLE` is non-empty → use it as `sessionName`. Tell the user "Using existing session title: `<title>`" and skip to C2.
- If empty → continue to C1b.

**C1b. Session is unnamed. Ask the user (single `AskUserQuestion`):**

- **Question:** "This Claude Code session isn't named yet. What should we call it?"
- **Header:** "Session name"
- **Options (2–3):** sensible kebab-case suggestions derived from the *actual* work this session — not generic placeholders. Always include a "Skip naming" option that uses fallback `unnamed-YYYY-MM-DD` (current date).

**C1c. Tell the user to run `/rename` so the Claude Code title matches:**

> Run this now so the session title matches the handoff file:
> ```
> /rename <name>
> ```

Proceed regardless of whether they run it — the file uses the resolved `sessionName` either way.

## C2: Resolve target path, create folder, ensure gitignored

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SESSION_DIR="$PROJECT_ROOT/work-log/<sessionName>"
mkdir -p "$SESSION_DIR"

GITIGNORE="$PROJECT_ROOT/.gitignore"
if git -C "$PROJECT_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  if ! grep -Eq '^[[:space:]]*/?work-log/?[[:space:]]*$' "$GITIGNORE" 2>/dev/null; then
    [ -s "$GITIGNORE" ] && [ "$(tail -c1 "$GITIGNORE" 2>/dev/null)" != "" ] && printf '\n' >> "$GITIGNORE"
    printf '\n# Claude Code handoff/sidequest snapshots (local-only)\nwork-log/\n' >> "$GITIGNORE"
    echo "Added work-log/ to $GITIGNORE"
  fi
fi

# Find next session number (we already computed LATEST_N in Step 0 if the folder existed)
LAST=$(ls "$SESSION_DIR" 2>/dev/null \
  | grep -E '^session-[0-9]+\.md$' \
  | sed -E 's/^session-([0-9]+)\.md$/\1/' \
  | sort -n | tail -1)
NEXT=$(( ${LAST:-0} + 1 ))
TARGET="$SESSION_DIR/session-$NEXT.md"
echo "Will write: $TARGET"
```

**Work-log is always project-local.** Never write into `~/.claude/`, a global path, or a parent directory.

If the folder already has prior sessions (you'll be writing `session-(N+1).md`), **read the most recent one first** — your new file should reference what's changed since (closed threads, new decisions) rather than restating everything.

Mention any `.gitignore` edit in the C5 report so the user can review it.

## C3: Gather grounding facts (parallel)

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

## C4: Write the handoff file

Use this exact template. Be concrete — name files, line numbers, branch names, exact commands. A future agent should be able to act from this file alone without re-deriving anything.

**Critical:** the `**Claude Code session id:**` line must contain the literal value of `$CLAUDE_CODE_SESSION_ID` (no formatting) — Step 0's dispatcher reads it back to detect "same session re-save" vs "different session resume."

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

## C5: Confirm and report

After writing, report to the user in 2–3 lines:
- The path written: `work-log/<sessionName>/session-N.md` (mention N — first vs additional checkpoint)
- One-sentence summary of what was captured
- How to resume later: `/mosaic-buddy handoff <sessionName>` in a fresh session (no `new` keyword)
- If `.gitignore` was modified in C2, mention it: "Added `work-log/` to `.gitignore`."

If you instructed the user to run `/rename` in C1c and they haven't yet, remind them once.

Do **not** offer to commit the file — the user decides when to commit work-log entries.

---

# RESUME mode

Pick up a prior session that was checkpointed via `/mosaic-buddy handoff`. Read the structured handoff file(s) from `<projectRoot>/work-log/<sessionName>/`, verify the repo state is still consistent, and report the next concrete step.

## R1: Locate and list the handoff files

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
SESSION_DIR="$PROJECT_ROOT/work-log/<sessionName>"

ls "$SESSION_DIR" 2>/dev/null \
  | grep -E '^session-[0-9]+\.md$' \
  | sort -t- -k2 -n
```

Step 0's dispatcher already confirmed the folder exists with at least one matching file, so this should succeed. If it doesn't (folder went missing between dispatch and read), tell the user and stop.

## R2: Read the handoff files

- **Always read the latest `session-N.md` in full** — that's the active handoff.
- **Also read earlier `session-*.md` files** (oldest → newest) if there are more than one, but skim for: closed threads, decisions superseded, gotchas still relevant. The latest file is the source of truth for "what's next"; earlier ones are history.

Use the `Read` tool, not Bash `cat`.

## R3: Verify the repo state still matches

The handoff's "Git state at handoff" section was a snapshot. Check whether the world has moved since:

```bash
git status
git log --oneline -10
git branch --show-current
```

Compare to what the handoff recorded. Flag any of these to the user **before proposing next steps**:

- Branch has changed (now on a different branch than the handoff)
- Commits have been added or removed since the handoff
- Files the handoff said were "uncommitted WIP" are now committed (or gone)
- Files the handoff cited as key reading no longer exist

If anything diverged materially, ask the user to confirm the handoff is still the right starting point before continuing.

## R4: Optionally suggest renaming this session

If `$CLAUDE_CODE_SESSION_ID` is set and the current session has no `custom-title` record in its jsonl (same check as C1a), gently suggest:

> Run `/rename <sessionName>` to label this resumed session so the next `/mosaic-buddy handoff` call keeps everything under the same work-log folder.

Don't nag if the session is already named — the user may want a distinct label.

## R5: Brief the user

Short, structured briefing (NOT the full handoff file — the user can read it themselves):

```
Resuming session: <sessionName>  (session-<N>.md, written <date>)
Prior sessions:   <count> earlier handoff(s) on file

Refined agenda:
  <1–2 line summary from §2 of the latest handoff>

Done so far:
  - <bullet, max 3>

Open threads:
  - <bullet, max 4>

Next concrete step:
  <one line from §5 of the latest handoff>

Repo state check:
  <"matches handoff" OR a brief list of differences>

Open questions for you:
  <from §6 — only if non-empty>
```

End with: **"Ready to continue. Want me to start on the next step, or somewhere else?"**

If the user later wants to checkpoint *their own* progress in this session, the next `/mosaic-buddy handoff <sessionName>` call will still resume (the latest file belongs to the original author, not this session). In that case, suggest a slightly different name — e.g. `<sessionName>-pt2` — to start a fresh chain.

---

## Rules

1. **Never modify the handoff file during resume** — it's a historical record. Only CREATE mode writes.
2. **Always verify repo state on resume** before proposing action. Stale handoffs cause confusion.
3. **Don't dump the full handoff content into chat on resume** — summarise. The user can read the file if they want detail.
4. **Never fabricate work on create** — if you're unsure whether something was completed, mark it open.
5. **Quote the user's original ask** verbatim when possible on create — paraphrasing loses intent.
6. **Don't restate the codebase** — the future agent can read files; you can't read it for them. Capture only what isn't recoverable from the repo.
7. **One file per create call** — never overwrite an existing `session-N.md`. Always increment.
8. **Project-local only** — files live inside the current project's `work-log/`, never in `~/.claude/`.
9. **Don't run `/compact`** — handoff is independent of context compaction.
10. **Don't write the jsonl `custom-title` record directly** — only `/rename` (run by the user) should do that.
11. **Don't auto-execute the "next concrete step" on resume** — report it, wait for the user's go-ahead.
12. **Always tell the user which mode you dispatched into** — one short line so they know whether they just saved or just resumed.
