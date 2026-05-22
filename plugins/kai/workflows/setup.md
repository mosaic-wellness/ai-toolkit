# Phase 1: Setup — JIRA MCP Check & Ticket Fetch

## Step 1: Check JIRA MCP Availability

Use `ToolSearch` to search for JIRA/Atlassian MCP tools:

```
ToolSearch: query="atlassian jira issue", max_results=10
```

**Look for tools that can:**
- Get/read an issue (fetch ticket details)
- Update an issue (change fields, labels)
- Add comments to an issue
- Transition an issue (change workflow status)

**Expected tool name patterns:**
- Tools containing `jira`, `atlassian`, `issue`, `ticket`
- From servers named `atlassian`, `jira`, or similar

### If JIRA tools ARE found:

1. Note the available tool names — you'll need them for:
   - Fetching ticket details (used this phase)
   - Adding labels (used this phase)
   - Adding comments (used in execute phase)
   - Transitioning status (used in execute phase)
2. Proceed to Step 2

### If JIRA tools are NOT found:

1. Read `${CLAUDE_PLUGIN_ROOT}/references/jira-mcp-setup.md`
2. Display the setup guide to the user
3. Use AskUserQuestion:
   ```
   JIRA MCP server is not configured. Kai needs JIRA integration to:
   - Fetch ticket details
   - Update ticket status and labels
   - Add comments with plans and PR links

   Would you like to set it up now? (See the guide above)
   After setup, restart Claude Code and run /kai:kai again.
   ```
4. **STOP** — the workflow cannot proceed without JIRA MCP

---

## Step 2: Fetch Ticket Details

Using the discovered JIRA MCP tools, fetch the full ticket. Extract and store:

| Field | What to extract | Used in |
|-------|-----------------|---------|
| `ticketId` | The JIRA key (e.g., ENG-1234) | All phases |
| `summary` | Ticket title/summary | Plan title, branch names |
| `description` | Full description body | Understanding phase |
| `acceptanceCriteria` | AC section if present | Plan acceptance criteria |
| `currentStatus` | Workflow status | Status tracking |
| `assignee` | Who it's assigned to | PR descriptions |
| `labels` | Existing labels | Check for kai-agent |
| `issueType` | Story, Bug, Task, etc. | Commit type prefix |
| `linkedIssues` | Related tickets | Cross-references |

**Derive the commit type from issue type:**
- Story / Feature -> `feat`
- Bug -> `fix`
- Task / Chore -> `chore`
- Improvement -> `refactor`

---

## Step 3: Add "kai-agent" Label

Using JIRA MCP tools, add the label `kai-agent` to the ticket.

- If the label already exists, skip silently
- If adding labels fails (permissions), warn but continue — it's not blocking

---

## Step 4: Output Summary

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Phase 1: Setup Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ticket:  {ticketId} — {summary}
Type:    {issueType} -> commit prefix: {commitType}
Status:  {currentStatus}
Labels:  {existing labels} + kai-agent
```

Then proceed to Step 3 in the main command (Understand the User Story).
