# Phase 2: Understand the User Story

## Step 1: Parse the Ticket

Extract structured information from the ticket details fetched in setup:

1. **What** is being requested? (feature, bug fix, refactor, improvement)
2. **Why** is it needed? (user problem, business need, tech debt)
3. **Who** is affected? (which users, which areas)
4. **Where** in the system? (which parts of the codebase)
5. **Acceptance criteria** — explicit criteria from the ticket, or infer from description

---

## Step 2: Identify Affected Areas

Analyze the ticket to determine which parts of the current repository are affected.

**Process:**
1. Extract keywords and domain concepts from the ticket
2. Map them to likely areas of the codebase (e.g., routes, controllers, components, services, utils)
3. Determine the scope: is this a small change (1-2 files) or a broad change (multiple modules)?

**Heuristics:**
- Ticket mentions "API" or "endpoint" -> look for routes, controllers, handlers
- Ticket mentions "UI", "page", "component" -> look for frontend components, pages
- Ticket mentions "database", "model", "migration" -> look for models, schemas, migrations
- Ticket mentions "test" or "coverage" -> look for test directories
- Bug reports -> trace the described user flow through the code

**Base branch detection:**

Check the user's original prompt AND the ticket for any indication that work should branch from something other than the default branch. Defaults to `main` (or `master` if that's what the repo uses) if not mentioned.

Look for phrases like:
- "branch from {branch-name}" / "branch off {branch-name}"
- "based on {branch-name}" / "on top of {branch-name}"
- "hotfix for {release}" / "patch for {version}"

Store the detected base branch — it will be used when creating the feature branch in the execute phase.

---

## Step 3: Ask Clarifying Questions

If ANY of the following are unclear after reading the ticket, ask the user:

- Are there existing similar features to reference or extend?
- Are there specific UI designs, mockups, or Figma links?
- What's the expected data shape for new APIs?
- Are there database schema changes needed?
- Are there any hard constraints (performance, compatibility, timeline)?
- Which specific directory or module should this change live in?

Use `AskUserQuestion` for structured questions. Group related questions together — don't ask one at a time.

**Only ask questions that are genuinely needed.** If the ticket is well-specified, you may have zero questions.

---

## Step 4: Confirm Understanding

Present a brief summary to the user:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 2: Understanding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Ticket:** {ticketId} — {summary}

**What:** {one-sentence description of what needs to be built/fixed}

**Type:** {feature | bug fix | refactor | improvement}

**Affected Areas:**
  1. {area-1} — {why this area is involved}
  2. {area-2} — {why this area is involved}
  ...

**Acceptance Criteria:**
  1. {criterion 1}
  2. {criterion 2}
  ...

**Base Branch:** {base-branch} {if default, show "(default)"; if non-default, show "-- non-default"}

Does this look right? Any corrections before I start exploring the codebase?
```

Wait for user confirmation before proceeding to the exploration phase.

---

## Output

After confirmation, proceed to Step 4 in the main command (Explore the Codebase).
