---
name: sidequest
description: >
  Fork the current Claude Code session at this moment so divergent work can be
  picked up later in a separate session, without disturbing the trunk. Writes a
  snapshot under work-log/<parent>/forks/<forkName>/ that a future Claude can
  resume via `/mosaic-buddy sidequest <forkName>`. Two modes: `new <forkName>`
  creates a fork; `<forkName>` resumes one.
---

# Sidequest

A **sidequest** is a checkpoint written at a fork point in the current Claude Code session. The current session (the **parent / trunk**) keeps going as if nothing happened. The sidequest file is a saved jumping-off point that a *different* future Claude Code session can pick up via `/mosaic-buddy sidequest <forkName>`.

The router passes any text after `sidequest` as `$ARGUMENTS`. Use that to dispatch (see Step 0).

## When users create sidequests

Two archetypal triggers — name them in §1 of the snapshot when they apply:

1. **Second-order effect surfaced mid-work.** The trunk is doing X; along the way the user noticed Y is worth doing but is tangential. They fork Y off so the trunk stays focused on X.
2. **New opportunity built on the trunk's output.** The trunk just produced something (a schema, an API, a doc) that enables a different direction the user wants to explore. They fork off the new direction without losing trunk momentum.

The user picks how to work the sidequest *after* it's created — same branch, fresh branch, or a separate worktree for physical isolation. The sidequest snapshot itself is just a saved jumping-off point. Don't presume an answer; record the starting state and let the resumer choose.

Two modes, dispatched by the first argument:

| Invocation                                       | Mode    |
|--------------------------------------------------|---------|
| `/mosaic-buddy sidequest new <forkName>`         | Create  |
| `/mosaic-buddy sidequest <forkName>`             | Resume  |
| `/mosaic-buddy sidequest` (no args)              | Ask the user which mode |

## Step 0: Dispatch

- If the first arg is the literal word `new`:
  - `MODE=create`, `forkName` = second arg. If missing, ask via `AskUserQuestion` for a kebab-case name (suggest 2–3 names derived from the *actual* exploration the user just described, not generic placeholders).
- Else if exactly one arg is present:
  - `MODE=resume`, `forkName` = that arg.
- Else (no args):
  - Ask via `AskUserQuestion`: create a new sidequest, or resume an existing one? Then proceed accordingly. For "resume", list existing forks in this project as the options (run `find "$PROJECT_ROOT/work-log" -mindepth 3 -maxdepth 3 -type d -path '*/forks/*'`).

**Normalise `forkName`** against `^[a-z0-9][a-z0-9-]*$`. Lowercase, replace spaces/underscores with `-`, strip other chars. Confirm with the user if normalisation materially changed the input. Forbid the literal name `new` (it would be ambiguous on resume).

---

# CREATE mode

## C1: Resolve the parent session name

The fork lives under the parent session's work-log folder, so we need the parent's name. This is the **current Claude Code session's title**.

```bash
SESSION_ID="$CLAUDE_CODE_SESSION_ID"
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_SLUG="$(echo "$PROJECT_ROOT" | sed 's|/|-|g')"
SESSION_JSONL="$HOME/.claude/projects/$PROJECT_SLUG/$SESSION_ID.jsonl"

CURRENT_TITLE=$(grep -m1 '"type":"custom-title"' "$SESSION_JSONL" 2>/dev/null \
  | python3 -c 'import sys,json; print(json.loads(sys.stdin.read()).get("customTitle",""))' 2>/dev/null)

echo "Parent session title: ${CURRENT_TITLE:-<unnamed>}"
```

- If non-empty → `PARENT = CURRENT_TITLE`. Continue to C2.
- If empty → trunk is unnamed. Ask the user via a single `AskUserQuestion`:
  - **Question:** "This Claude Code session isn't named yet. What should we call the trunk so the sidequest can live under `work-log/<trunk>/forks/<forkName>/`?"
  - **Header:** "Trunk name"
  - **Options (2–3):** sensible kebab-case suggestions derived from the *actual* work this session has been doing (scan the transcript) — not generic placeholders. Always include a "Skip naming" option that falls back to `unnamed-YYYY-MM-DD` (current date).
  - Normalise the chosen name against `^[a-z0-9][a-z0-9-]*$` (lowercase, replace spaces/underscores with `-`, strip other chars). Set `PARENT` to the result and continue.

After resolving `PARENT`, tell the user to run `/rename` so the Claude Code session title matches the work-log folder (slash commands can't be invoked from inside a skill):

> Run this now so the session title matches the sidequest's parent folder:
> ```
> /rename <PARENT>
> ```

Proceed regardless of whether the user runs it — the fork file uses the resolved `PARENT` either way.

## C2: Refuse collisions

```bash
FORK_DIR="$PROJECT_ROOT/work-log/$PARENT/forks/$FORK_NAME"
if [ -d "$FORK_DIR" ]; then
  echo "COLLISION"
  ls "$FORK_DIR"
fi
```

If `$FORK_DIR` already exists:

- **Do not overwrite.** Stop.
- List the parent's existing sidequests (`ls "$PROJECT_ROOT/work-log/$PARENT/forks/"`) so the user can pick a non-colliding name.
- Suggest a few alternative names derived from the user's described exploration.

Names only need to be unique **within the same parent**. The same `forkName` under a different parent is fine.

## C3: Ensure `work-log/` is gitignored

```bash
GITIGNORE="$PROJECT_ROOT/.gitignore"
if git -C "$PROJECT_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  if ! grep -Eq '^[[:space:]]*/?work-log/?[[:space:]]*$' "$GITIGNORE" 2>/dev/null; then
    [ -s "$GITIGNORE" ] && [ "$(tail -c1 "$GITIGNORE" 2>/dev/null)" != "" ] && printf '\n' >> "$GITIGNORE"
    printf '\n# Claude Code handoff/sidequest snapshots (local-only)\nwork-log/\n' >> "$GITIGNORE"
    echo "Added work-log/ to $GITIGNORE"
  fi
fi

mkdir -p "$FORK_DIR"
TARGET="$FORK_DIR/session-1.md"
```

If `.gitignore` was modified, mention it in the Step C6 report.

## C4: Gather grounding facts (parallel)

Same as `/mosaic-buddy handoff`:

```bash
git status
git diff --stat
git log --oneline -20
git branch --show-current
```

Then scan the transcript for the three things that matter most to a sidequest:

- **Divergence reason** — *why* is the user forking *here* and not just continuing? This is the soul of the file.
- **What the trunk is doing** — so the resumed fork knows what it should NOT duplicate.
- **What the fork is for** — the specific spike / experiment / alternate approach being explored.

## C5: Write the fork snapshot

Use this template. Be concrete — file paths, line numbers, exact commands. A future agent reading only this file should be able to act without re-deriving anything.

````markdown
# Sidequest — <forkName>

**Parent session:** <PARENT>
**Forked at:** <YYYY-MM-DD HH:MM>
**Claude Code session id at fork:** <CLAUDE_CODE_SESSION_ID>
**Branch:** <branch>
**Working directory:** <project root>

---

## 1. Why this fork exists

<1–3 sentences. The user's reason for branching off here. Quote them when
possible. Without this, the resumer has no idea why the trunk wasn't enough.>

## 2. Trunk context (what the parent was doing at fork time)

<1–3 sentences summarising the parent's refined agenda at the moment of fork.
Do not restate the parent's full handoff — the resumer can read it directly
under work-log/<parent>/session-N.md. Just enough so the fork knows where it
diverged.>

## 3. Fork agenda (what THIS sidequest should accomplish)

<Specific. Bounded. "Try X without committing to it." "Spike Y on a throwaway
branch." "Explore alternative Z and report back.">

## 4. Starting state

**Files & symbols the fork should start from:**
- `path/to/file.ts:42-110` — <why it matters>

**Uncommitted state at fork time:**
```
<git status -s output>
```

**Useful commands:**
```bash
<actual commands, not placeholders>
```

## 5. Constraints / non-goals

<What this sidequest should NOT do. Scope boundaries. Anything the user
explicitly said is out of bounds for this exploration. If none, write "None.">

## 6. Open questions for the user

<Anything the resumer needs answered before work can continue. "None." if
nothing.>

## 7. Git state at fork

```
<paste output of `git status` and `git log --oneline -5`>
```
````

## C6: Report

Tell the user in 2–3 lines:

- Path written: `work-log/<parent>/forks/<forkName>/session-1.md`
- One-sentence summary of the fork's purpose
- Resume command (run in a **new** Claude Code session): `/mosaic-buddy sidequest <forkName>`
- Reassurance: the trunk session (this one) continues unaffected.
- If `.gitignore` was modified in C3, mention it.

Do **not** offer to commit the file. The user decides when (and whether) to commit `work-log/` entries.

---

# RESUME mode

## R1: Locate the fork

Names are unique per parent, not globally. Search across all parents:

```bash
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
MATCHES=$(find "$PROJECT_ROOT/work-log" -mindepth 3 -maxdepth 3 -type d \
  -name "$FORK_NAME" -path '*/forks/*' 2>/dev/null)
echo "$MATCHES"
```

- **Zero matches** → tell the user "No sidequest named `<forkName>` in this project" and stop. If `work-log/` doesn't exist at all, say "No sidequests in this project yet."
- **One match** → use it. Extract `PARENT` from the path.
- **Multiple matches** (same `forkName` under different parents) → list the parents via `AskUserQuestion` and let the user pick which one to resume.

## R2: Read the fork snapshot

- **Always read the latest `session-N.md`** in the fork dir in full. That's the active snapshot.
- If earlier `session-*.md` files exist (the fork itself has been handed off before), skim oldest → newest for: closed threads, decisions superseded, gotchas still relevant. Latest is the source of truth.
- Also `Read` the parent's latest `session-N.md` if it exists, but only for trunk context — the fork's own §1–§5 are authoritative.

Use the `Read` tool, not `cat`.

## R3: Verify repo state

The fork was a snapshot in time. Confirm the world is still close:

```bash
git status
git log --oneline -10
git branch --show-current
```

Compare to the fork's "Git state at fork" section. Surface divergence **before** proposing next steps:

- Branch has changed
- Commits have been added or removed since the fork
- Files cited as key reading no longer exist or have moved
- Uncommitted state at fork is now committed (or gone)

If anything diverged materially, ask the user to confirm the sidequest is still the right starting point.

## R4: Optionally suggest renaming this session

If `$CLAUDE_CODE_SESSION_ID` is set and the current session has no `custom-title` record in its jsonl, gently suggest:

> Run `/rename <forkName>` to label this resumed session so further `/mosaic-buddy handoff` or `/mosaic-buddy sidequest new` calls keep this work under a consistent name.

Don't nag if the session is already named (the user may want a distinct label).

## R5: Brief the user

Short, structured briefing (not the full file — they can read it themselves):

```
Resuming sidequest: <forkName>  (forked from <parent>, <date>)

Why this fork exists:
  <§1, 1–2 lines>

Fork agenda:
  <§3>

Constraints / non-goals:
  - <§5 bullets>

Starting state:
  - <key file/line from §4>

Repo state check:
  <"matches fork point" OR brief list of differences>

Open questions for you:
  <from §6 — only if non-empty>
```

End with: **"Ready to take the sidequest. Want me to start, or somewhere else?"**

---

## Rules

1. **Forks are snapshots.** Resume mode never modifies the fork's `session-1.md`. If the resumed work later needs its own checkpoint, that's a regular `/mosaic-buddy handoff` (which writes `session-2.md` *into the fork dir* — fine, mirrors the handoff layout).
2. **If the trunk is unnamed, ask** (don't refuse). Use `AskUserQuestion` to resolve a parent name, then tell the user to run `/rename` so the session title matches.
3. **Never overwrite an existing fork.** Create mode aborts on collision and lists alternatives.
4. **The trunk session is unaffected** when creating a sidequest — no branches, no worktrees, no commits, no edits to the parent's work-log files. Just a new file under `forks/`.
5. **Project-local only.** Everything lives under `<projectRoot>/work-log/`. Never `~/.claude/` or sibling projects.
6. **Don't auto-execute the fork's agenda on resume** — report it, wait for the user's go-ahead.
7. **Don't quote `/compact`** — sidequest is independent of context compaction.
8. **Don't write `custom-title` jsonl records directly** — only the user, via `/rename`, should do that.
