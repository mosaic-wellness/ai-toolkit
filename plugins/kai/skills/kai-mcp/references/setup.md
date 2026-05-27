# Kai — MCP Setup

Kai is Mosaic Wellness's internal orchestrator MCP. It fronts ~100 granular
tools across 8 categories (CX, engineering, analytics, PDP, knowledge,
voice calls, AS booking, math) behind a minimal 3-tool interface
(`list_tools`, `use_tool`, `kai_raise_request`).

The `kai-mcp` skill teaches Claude *how* to use it. This doc tells you
how to *wire* it.

---

## What you'll need

- A Mosaic Wellness Google account (`@mosaicwellness.in`).
- Claude Code installed and working.
- ~2 minutes.

There is **no token to paste** — Kai authenticates via Google OAuth on first
call. Each user signs in once per machine.

---

## Setup

The Kai MCP is wired at **project scope** so it's available everywhere you
work in the Mosaic stack. Two options:

### Option A — Project `.mcp.json` (recommended for the meta-repo)

Add the entry below to the `mcpServers` object in your
`mosaic-meta-repo/.mcp.json` (create the file if it doesn't exist):

```json
{
  "mcpServers": {
    "kai-mcp": {
      "type": "http",
      "url": "https://kai-orchestrator.api.mosaicwellness.in/mcp"
    }
  }
}
```

That's it — no headers, no api-key, no env var. Claude Code's OAuth handler
takes care of the rest.

### Option B — User-global in `~/.claude.json`

If you want Kai available in every Claude Code session anywhere on your
machine, put the same block under
`~/.claude.json` → top-level `mcpServers["kai-mcp"]`. Same shape, same behavior.

Don't put it in both places — user-global is loaded everywhere; project
scope only applies inside the meta-repo.

---

## First call — Google OAuth

After wiring, **restart Claude Code** (the `/reload-plugins` command does
not pick up new project-scope `.mcp.json` entries). On the first call to
any kai tool — e.g. you type "show me MM revenue this week" and Claude
calls `list_tools(category="analytics")` — Kai redirects through Google
OAuth:

1. A browser tab opens to `accounts.google.com`.
2. Sign in with your `@mosaicwellness.in` address. Wrong account → no
   access; sign out and retry.
3. Approve the OAuth consent.
4. The browser tab confirms success and you can close it.
5. The MCP call resumes automatically. Claude shows the tool result like
   any other call.

Tokens persist for the Claude Code session and refresh transparently. If
you sign out of Google globally, the next kai call re-prompts.

---

## Verify it's working

```
What categories does kai expose?
```

Claude will call `list_tools()` with no category, and Kai responds with the
8 categories + tool counts + summaries. If you see that, you're set.

Or more direct test:

```
What's the leave policy at Mosaic Wellness?
```

This routes to `list_tools("knowledge")` → `knowledge_base_search` and
returns the actual policy doc. **No brand needed** for knowledge queries
(it's HR/company-wide). For everything else, expect Claude to ask which
brand.

---

## Brand codes

Kai uses its own brand codes — they are NOT the same as the Mixpanel
nicknames the `mixpanel-mcp` skill uses:

| Kai code  | Brand              |
|-----------|--------------------|
| `MM`      | Man Matters        |
| `MW`      | Mosaic Wellness    |
| `BW`      | Bodywise (sometimes appears as `BB` in Slack channels — same brand) |
| `LJ`      | Little Joys        |
| `AS-IN`   | Absolute Science (India) |

Brands present in Mixpanel but NOT in Kai today: OWN, Get Fitter,
Affluence, DocHub, Rwdy Nutrition, Root Labs. For those, use Mixpanel /
Firebase / NR skills directly. If you need first-class Kai support for a
missing brand, the Kai team accepts requests via `kai_raise_request`.

---

## What if I'm not in the meta-repo?

The Kai MCP works the same way from any project, as long as the entry is
wired in **that project's** `.mcp.json` or in your user-global
`~/.claude.json`. Wire it once globally and you never have to think about
it again.

---

## Troubleshooting

| Symptom | Likely fix |
|---|---|
| "MCP server `kai-mcp` not found" | The `.mcp.json` change didn't take effect. Restart Claude Code (not `/reload-plugins`). |
| OAuth tab opens but never returns | Make sure popups aren't blocked. Try Chrome if you're on Safari. |
| "Permission denied" or RBAC errors on a specific tool | Some tools are scoped by team membership. Pass `userId` explicitly to `use_tool` or ask in the Kai support channel. |
| Tool name lookup says "not found" | Your skill version may reference a renamed tool. Always call `list_tools(category)` first — it's the authoritative source. |
| "needs_disambiguation" when looking up a person | Two people share the same first name. Kai's `git_developerActivity` / `jira_developerActivity` will return a candidate list — ask the user which one. |

---

## Don't ship tokens

Even though Kai uses OAuth (no token to paste), the principle still
applies: never commit `.mcp.json` files that contain plaintext credentials
for any MCP. If you mistakenly put a token in one, rotate it at the
vendor, then convert to `${VAR}` env-var form per the
`kai/.mcp.json` pattern.
