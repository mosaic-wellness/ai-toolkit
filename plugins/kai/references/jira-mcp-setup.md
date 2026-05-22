# JIRA MCP Setup Guide

Kai requires a JIRA MCP server to fetch tickets, update statuses, add labels, and post comments.

---

## Option 1: Atlassian Rovo MCP Server (Recommended)

The official Atlassian MCP server — cloud-hosted, secure, OAuth 2.1 authentication (no manual tokens needed).

### Setup Steps

1. Add to your project's `.mcp.json` (or `~/.claude/.mcp.json` for global access):

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "http",
      "url": "https://mcp.atlassian.com/v1/mcp"
    }
  }
}
```

2. Restart Claude Code (or start a new session)
3. When you first use a JIRA tool, the **MCP trust dialog** will appear — approve it
4. A **browser window** will open for Atlassian OAuth authorization
5. Log in with your Atlassian Cloud account and grant access
6. Return to Claude Code — you're now connected

**No API tokens, no manual credentials.** OAuth 2.1 handles everything via browser.

### Prerequisites
- Atlassian Cloud site with Jira access
- Node.js v18+ (for the mcp-remote proxy)
- Modern browser for OAuth authorization

### What You Get
- Read/search Jira issues (JQL support)
- Create and update issues
- Add/remove labels
- Add comments
- Transition issue status (To Do -> In Progress -> Done)
- View assignees, linked issues, and more

All actions respect your existing Atlassian Cloud permissions — you can only access projects and issues you already have permission to view.

---

## Option 2: Community mcp-atlassian (Self-hosted)

For Jira Server/Data Center (on-premise) or if you need more control.

### Setup Steps

1. Install: `pip install mcp-atlassian`
2. Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "mcp-atlassian",
      "args": [
        "--jira-url", "https://your-instance.atlassian.net",
        "--jira-token", "YOUR_API_TOKEN"
      ]
    }
  }
}
```

3. For API token: https://id.atlassian.com/manage-profile/security/api-tokens

---

## Global vs Project Configuration

**Global (all projects):** Add the server to `~/.claude/.mcp.json`
**Per-project:** Add the server to `.mcp.json` in the project root

For Kai plugin usage across multiple projects, global configuration is recommended.

---

## Verification

After setup, run `/kai:kai` — it will automatically check for JIRA MCP availability using ToolSearch.

You can also verify manually:
1. Start a new Claude Code session
2. The MCP trust dialog should appear for the Atlassian server
3. Approve it and complete the OAuth flow in your browser
4. Run `/kai:kai help` to confirm everything works

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MCP trust dialog doesn't appear | Restart Claude Code after changing `.mcp.json` |
| OAuth browser window doesn't open | Ensure Node.js v18+ is installed |
| "JIRA MCP not found" in kai | Check `.mcp.json` has `"type": "http"` for the server |
| Cannot transition status | Your Jira workflow may not allow that transition from the current status |
| Permission denied on an issue | You don't have access to that project in Atlassian Cloud |
| Server not responding | Check https://status.atlassian.com for outages |

---

## Important Notes

- **No tokens in `.mcp.json`** with the Rovo option — OAuth 2.1 handles auth via browser, so it's safe to commit the config.
- Each team member completes their own OAuth flow on first use.
- The legacy SSE endpoint (`https://mcp.atlassian.com/v1/sse`) is deprecated after June 30, 2026. Use `/v1/mcp` instead.
