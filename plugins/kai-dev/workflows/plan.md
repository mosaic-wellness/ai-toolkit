# Phase 4: Generate Implementation Plan

## Purpose

Using exploration results, generate a detailed implementation plan that serves as both a roadmap and a progress tracker.

---

## CONTENT RULES — What Goes in a Plan

Plans are **technical specs**, NOT code. Follow these rules strictly:

### ALLOWED
- Plain language descriptions of what to build and how it should behave
- Pseudo-code for logic flows (WHEN/IF/THEN style, language-agnostic)
- Mermaid diagrams for architecture, data flow, sequence diagrams
- Data shape descriptions (field names, types, relationships — NOT TypeScript interfaces)
- API contract descriptions (endpoint, method, request/response shapes, error codes)
- File paths and module names (to identify WHAT changes, not HOW)
- Behavioral specs ("when X happens, the system should Y")

### NOT ALLOWED
- Real code in any language (TypeScript, JavaScript, Python, SQL, etc.)
- Database queries
- Import statements or dependency declarations
- Full function signatures with implementations
- Copy-pasted code snippets from the codebase
- Config file contents

The plan tells builder agents WHAT to build and WHY. The builders decide HOW (actual code).

---

## Step 1: Spawn Plan Agent

```
Agent:
  subagent_type: Plan
  description: "Plan implementation for {ticket-id}"
  prompt: |
    You are creating a technical spec for JIRA ticket {ticket-id} in the current repository.

    ## Ticket Context
    **Summary:** {ticket summary}
    **Description:** {ticket description}
    **Acceptance Criteria:**
    {list of acceptance criteria}

    ## Exploration Findings
    {paste the complete exploration results}

    ## Project Conventions
    {paste the discovered conventions — test framework, file naming, architecture, etc.}

    ## CONTENT RULES
    - Write a TECHNICAL SPEC, not code
    - Use pseudo-code (WHEN/IF/THEN) for logic, NOT real code
    - Use mermaid diagrams for architecture and flow visualization
    - Describe data shapes in plain text (field: type), NOT code interfaces
    - Describe behavior ("when user does X, system should Y"), NOT implementations

    ## Required Output Format

    Use the template structure from ${CLAUDE_PLUGIN_ROOT}/templates/plan-document.md
```

---

## Step 2: Detect Plan Directory

Check where plans should be stored:

1. If `plans/` directory exists at repo root -> use `plans/{TICKET-ID}/`
2. If `claude-plans/` directory exists at repo root -> use `claude-plans/{TICKET-ID}/`
3. Otherwise, create `plans/{TICKET-ID}/`

---

## Step 3: Save the Plan

Save the plan output to `{plan-dir}/{TICKET-ID}/plan.md`. Create the directory if it doesn't exist.

---

## Step 4: Present the Plan

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 4: Plan Generated
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total tasks: {count}

Plan saved to: {plan-dir}/{TICKET-ID}/plan.md

{Display the full plan content for the user to review}
```

Then proceed to Step 6 in the main command (User Review & Approval).
