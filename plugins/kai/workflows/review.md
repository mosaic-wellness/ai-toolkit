# Phase 7: Code Review

## Purpose

After implementation, spawn a review agent to validate code quality, conventions, and correctness before creating a PR.

---

## Step 1: Spawn Review Agent

```
Agent:
  subagent_type: guardian
  description: "Review changes for {ticket-id}"
  prompt: |
    You are reviewing changes for JIRA ticket {ticket-id} in the current repository.
    No PR exists yet — review the branch diff directly.

    ## Setup
    1. Verify you're on the feature branch: `git branch --show-current`
    2. Read the project's CLAUDE.md and AGENTS.md for conventions
    3. Read any .claude/rules/*.md files

    ## Get the Changes
    ```bash
    git log --oneline {default-branch}..HEAD
    git diff {default-branch}...HEAD --stat
    git diff {default-branch}...HEAD
    ```

    ## Project Conventions (discovered during exploration)
    {paste the discovered conventions}

    ## Implementation Spec (acceptance criteria)
    {paste the task list and acceptance criteria from the plan}

    Review the diff against BOTH the acceptance criteria AND your standard
    review checklist (conventions, security, test coverage, code quality).

    ## Output Format

    **Verdict:** {PASS | PASS WITH NOTES | NEEDS CHANGES}

    **Test Results:** {pass count} passing, {fail count} failing

    **Findings:**
    - [BLOCKING] `{file}:{line}` — {description}
    - [SUGGESTION] `{file}:{line}` — {description}
    - [PRAISE] {what was done well}

    **Summary:** {1-2 sentence overall assessment}
```

---

## Step 2: Process Review Results

### PASS or PASS WITH NOTES:
1. Present the review summary
2. Proceed to finalization

### NEEDS CHANGES:
1. Present findings grouped by severity
2. Ask the user:
   ```
   Review found issues:

   BLOCKING: {count}
   SUGGESTIONS: {count}

   Options:
   1. Auto-fix — spawn a builder to address blocking issues
   2. Fix specific — tell me which to fix, which to skip
   3. Proceed anyway — create PR with known issues
   4. Abort
   ```
3. If auto-fix: spawn builder, re-review (max 2 cycles)

---

## Step 3: Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 7: Code Review Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Verdict:  {PASS | PASS WITH NOTES | NEEDS CHANGES}
Issues:   {blocking count} blocking, {suggestion count} suggestions
Tests:    {pass count} passing

Overall: {READY FOR PR | NEEDS FIXES}
```

Then proceed to Step 9 in the main command (Finalize).
