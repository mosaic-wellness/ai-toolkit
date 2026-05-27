# Meta Ads MCP — Setup (Claude Desktop Custom Connector)

> **TL;DR — don't put Meta in `.mcp.json`.** Meta's MCP authenticates
> through Meta's OAuth screen, which requires a browser flow that's
> bound to a Claude account. The connector lives inside **Claude
> Desktop's** settings, not in a project-level JSON file. Wiring it
> through `.mcp.json` will either fail silently or land in a half-auth
> state that can't be recovered.

---

## Why not `.mcp.json`?

The other Mosaic MCPs in `plugins/kai/.mcp.json` (Mixpanel, Firebase,
New Relic, Kai orchestrator) all authenticate with a token kai can
pass via an env var or header. Meta is different:

- **Meta's MCP uses OAuth, not a long-lived API token.** There is no
  `META_API_KEY` to drop into an env var.
- **The OAuth screen opens in your browser.** It needs a real Claude
  session to bind the resulting token to your Claude account.
- **The token is stored by Claude Desktop**, not on disk where
  `.mcp.json` could read it.

The visible symptom of trying anyway: Claude Code reports the server
is connecting, but every tool call returns "not authorized" or
"connection closed". There is no way to fix this from the JSON side —
the connector has to be created through the Desktop UI.

---

## The supported path: Claude Desktop → Custom Connector

You need:
- **Claude Desktop** (Mac or Windows) — not the web app, not Claude
  Code on its own.
- An active Mosaic Wellness Facebook Business Manager login (your
  work FB account; the one you use to log into Ads Manager).

### Steps

1. Open **Claude Desktop** → top-right menu → **Settings**.
2. Go to **Connectors** in the left sidebar.
3. Click **Add custom connector** (or **+ Add** depending on Desktop
   version).
4. Fill in the connector details:
   - **Name:** `Meta` (or whatever label you want — this is just for
     you)
   - **Server URL:** `https://mcp.meta.com/mcp` *(or the current Meta
     MCP endpoint — confirm with the Meta docs page if this 404s:
     <https://developers.facebook.com/docs/marketing-apis/ads-mcp/>)*
   - Type: HTTP / SSE (whichever the dialog defaults to for remote
     MCPs)
5. Click **Connect**. A browser tab opens to Meta's OAuth screen.
6. **Log in with your Mosaic FB Business Manager account.** Not your
   personal Facebook account.
7. On the permissions screen, grant access to the business managers
   you need (typically **Mosaic Wellness** and **MWL UAE** if you work
   on Middle East brands).
8. The browser will redirect back to Claude Desktop. The connector
   should show a green "Connected" indicator.
9. Restart Claude Desktop. The tools (`ads_get_ad_accounts`,
   `ads_get_ad_entities`, etc.) should now be available.

### Verify it worked

Ask kai or Claude directly:

> "List my Meta ad accounts."

If you see Mosaic accounts come back, you're set. If you get an empty
list, your FB account doesn't have access to any business manager —
ask whoever owns Mosaic Wellness BM to add you with at least the "Ads
Manager" role.

---

## Common setup failures

| Symptom | Cause | Fix |
|---|---|---|
| OAuth screen rejects login | Used personal FB account, not work | Log out of personal FB first, then retry with work account |
| Connector says "Connected" but tools are missing | Forgot to restart Claude Desktop | Quit and reopen Claude Desktop |
| Empty `ads_get_ad_accounts` result | Account has no BM role | Ask BM admin to add you (Mosaic Wellness BM = `204205877656971`) |
| "is_ads_mcp_enabled=false" on the account you want | Meta is still rolling out MCP for that account | Wait (Meta says "gradually being rolled out"). Use Ads Manager meanwhile. |
| Tools work in Desktop but not in Claude Code CLI | Claude Code uses its own MCP config; the Desktop connector doesn't carry over | This is expected — the Meta MCP is Desktop-only today. Use Claude Desktop for Meta ads work. |

---

## Re-auth / disconnect

If Meta invalidates the token (happens every few months, or when you
change FB password):

1. Claude Desktop → Settings → Connectors → Meta
2. Click **Disconnect**
3. Click **Connect** again, walk through the OAuth flow as above

There are no local files to clean up — Claude Desktop manages the
token store.

---

## Why kai still needs this skill if the connector is Desktop-only

Two reasons:

1. **The skill teaches the connector setup.** When someone in the
   #help channel asks "how do I get Meta ads working", the answer is
   "use the custom connector" — this skill makes kai the authoritative
   source for that answer instead of relying on tribal knowledge.
2. **When the connector IS set up**, kai inherits the tools and the
   skill gives kai the Mosaic-specific context (business IDs, account
   map, brand routing, read-only guardrails) it needs to use them well.

The PreToolUse write-block hook (`hooks/block-meta-writes.sh`) fires
regardless of where the Meta tools were registered — Desktop connector
or otherwise — so the read-only guardrail holds in any setup.
