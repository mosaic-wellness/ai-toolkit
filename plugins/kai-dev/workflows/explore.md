# Phase 3: Explore the Codebase

## Purpose

Before planning, deeply understand the existing code in the repository. This phase reads project conventions and spawns an Explore agent to investigate relevant code paths.

---

## Step 1: Read Project Conventions

Before spawning the explorer, read the project's own documentation:

1. **Read `CLAUDE.md`** at the repo root (if it exists) — primary convention source
2. **Read `AGENTS.md`** at the repo root (if it exists) — agent-specific guidance
3. **Read `.claude/rules/*.md`** files (if they exist) — granular rules
4. **Check `package.json`** — detect:
   - Package manager (yarn, npm, pnpm)
   - Test command (`test`, `test:unit`, etc.)
   - Lint command (`lint`, `lint:fix`)
   - Build command
   - Framework dependencies (next, react, express, etc.)
5. **Check config files** — `tsconfig.json`, `.eslintrc.*`, `jest.config.*`, `vitest.config.*`, etc.

Store the discovered conventions — they'll be passed to the Explore, Plan, Builder, and Guardian agents.

---

## Step 2: Spawn Explore Agent

```
Agent:
  subagent_type: Explore
  description: "Explore codebase for {ticket-id}"
  prompt: |
    You are exploring the repository for JIRA ticket {ticket-id}.

    ## Ticket Context
    **Summary:** {ticket summary}
    **Description:** {ticket description}
    **Affected areas:** {areas identified in Phase 2}

    ## Project Conventions (discovered)
    {paste the conventions discovered in Step 1}

    ## Investigation Checklist

    ### 1. Repo Conventions
    - Read CLAUDE.md if it exists
    - Read AGENTS.md if it exists
    - Read .claude/rules/ directory if it exists
    - Identify: test framework, file naming convention, export style, architecture pattern

    ### 2. Relevant Source Code
    Search for files related to: {relevant keywords from ticket}
    - Find existing controllers, helpers, components, routes, services that relate to this change
    - Read the key files to understand current implementation
    - Note the patterns used (naming, error handling, logging, validation)

    ### 3. API Surface (if this involves APIs)
    - Find route definitions
    - Find related request/response types or interfaces
    - Note existing API patterns for consistency

    ### 4. Test Patterns
    - Find existing test files for similar features
    - Note the test framework (Jest, Vitest, other)
    - Note mock patterns, test utilities, fixture data
    - Identify test file naming convention

    ### 5. Dependencies & Integration Points
    - Internal deps: which files/modules does this code depend on?
    - External deps: npm packages, APIs, databases
    - Shared code: utilities, types, constants

    ## Output Format

    **Repo Conventions:**
    - Test framework: {jest/vitest/other}
    - File naming: {kebab-case/camelCase/PascalCase}
    - Export style: {named/default}
    - Architecture: {pattern description}
    - Install command: {detected install command}
    - Test command: {detected test command}
    - Lint command: {detected lint command}

    **Key Files to Modify:**
    - `{path}:{line}` — {what needs to change and why}

    **Existing Patterns to Follow:**
    - {pattern 1 with example file reference}

    **New Files Needed:**
    - `{proposed path}` — {purpose}

    **Testing Requirements:**
    - {what tests to write, referencing existing test patterns}

    **Risks & Complications:**
    - {potential issue 1}
```

---

## Step 3: Synthesize Exploration Results

After the Explore agent completes:

1. **Collect** the exploration results
2. **Validate** against the ticket scope — did exploration reveal additional areas?
3. **Note risks** — any complications that could affect planning?
4. **Confirm conventions** — make sure we know the test framework, file naming, architecture pattern

---

## Step 4: Ask Follow-up Questions (if needed)

If exploration revealed design decisions that need user input, ask focused technical questions. Only ask if genuinely needed.

---

## Step 5: Output Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 3: Exploration Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conventions:
  Test framework: {jest/vitest/other}
  File naming: {convention}
  Architecture: {pattern}
  Install: {command}
  Test: {command}
  Lint: {command}

Key files: {count} files identified for modification
New files: {count} files to create
Tests: {test framework} with {mock pattern}
Risks: {brief risk summary or "none"}
```

Then proceed to Step 5 in the main command (Generate Implementation Plan).
