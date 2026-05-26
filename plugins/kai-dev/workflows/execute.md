# Phase 6: Execute Implementation

## Prerequisites

- User has **explicitly approved** the plan
- Plan document exists at `{plan-dir}/{TICKET-ID}/plan.md`

---

## Step 1: Create Feature Branch

1. **Check current branch:** `git branch --show-current`
2. **Detect default branch:**
   ```bash
   git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main"
   ```
3. **Fetch latest:** `git fetch origin`
4. **Determine base branch:** Use the base branch detected in the understanding phase (defaults to the default branch)
5. **Create the feature branch:**
   ```bash
   git checkout -b feat/{ticket-id-lowercase} origin/{base-branch}
   ```
6. **Verify:** `git branch --show-current` — must show `feat/{ticket-id-lowercase}`

If the branch already exists, ask the user:
```
Branch feat/{ticket-id-lowercase} already exists.
1. Switch to it and continue
2. Delete it and start fresh
3. Use a different branch name
```

---

## Step 2: Install Dependencies

Check if dependencies need to be installed:

1. Look at `package.json` to determine the package manager:
   - `yarn.lock` exists -> yarn
   - `pnpm-lock.yaml` exists -> pnpm
   - `package-lock.json` exists -> npm
2. Check if `node_modules/` exists — if not, install
3. Check for custom install scripts in `package.json` (e.g., `install:token`)
4. Fall back to: `yarn` / `pnpm install` / `npm install`

If install fails, report the error and stop.

---

## Step 3: Update JIRA

Using the JIRA MCP tools discovered in setup:

1. **Transition ticket status** to "In Progress" (or the equivalent)
2. **Add a comment** with the approved plan summary. Read the template at `${CLAUDE_PLUGIN_ROOT}/templates/jira-comment-plan.md`, fill in the details, and post.

If status transition fails, warn but continue.

---

## Step 4: Spawn Builder Agent

Read the plan document at `{plan-dir}/{TICKET-ID}/plan.md` and pass its full content to the builder agent.

```
Agent:
  subagent_type: builder
  description: "Build {ticket-id}"
  prompt: |
    You are implementing changes in the current repository for JIRA ticket {ticket-id}.

    ## CRITICAL SETUP
    1. Verify you're on the correct branch: `git branch --show-current` — must be `feat/{ticket-id-lowercase}`
       If on main/master, STOP and report the error.
    2. Read the project's CLAUDE.md and AGENTS.md before making changes.
    3. Read any .claude/rules/*.md files for repo-specific rules.

    ## Project Conventions (discovered during exploration)
    {paste the discovered conventions — test framework, file naming, architecture, commands}

    ## Implementation Plan
    {paste the FULL CONTENTS of {plan-dir}/{TICKET-ID}/plan.md}

    ## Ticket Context
    - Ticket ID: {ticket-id-lowercase}
    - Commit type prefix: {commit-type} (e.g., feat, fix, refactor)
    - Branch: `feat/{ticket-id-lowercase}` (already exists — do NOT create a new one)
    - Commit message format: `{commit-type}: {ticket-id-lowercase} {description}`

    ## Deliverables
    When done, provide:
    1. List of files created/modified (with paths)
    2. Test results: command run, pass/fail counts
    3. Lint results: clean or issues found
    4. Commit hash(es) and messages
    5. Any issues encountered or decisions made
```

---

## Step 5: Track Progress

After the builder agent completes:

1. Read `{plan-dir}/{TICKET-ID}/plan.md`
2. Update task statuses from `"NOT STARTED"` to `"COMPLETED"` (or `"BLOCKED"`)
3. Write the updated plan file

Report progress:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 6: Implementation Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files changed:  {count}
Tests:          {pass count} passing
Lint:           {clean or issues}
Commits:        {count}
```

---

## Step 6: Handle Failures

If the builder fails:

1. Present the error clearly to the user
2. Ask: Retry / Skip / Abort
3. Update plan document with the status and reason

Then proceed to Step 8 in the main command (Code Review).
