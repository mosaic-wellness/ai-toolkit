# New Relic — Token Setup

The `newrelic-mcp` MCP server uses a **User API key** (prefix `NRAK-`).
You mint one in the NR UI and paste it via
`/kai tools-init newrelic`.

The token lives in `~/.config/kai/tokens.env` as
`NEW_RELIC_API_KEY`.

---

## Get your token

1. Open <https://one.newrelic.com/api-keys>.
2. Sign in with your `@mosaicwellness.in` SSO if not already.
3. Top right: click **Create a key**.
4. Fill the form:
   - **Key type**: `User`. (NOT `Ingest - License` — those are for
     sending data IN; we want a key that can READ via NerdGraph/MCP.)
   - **Account**: pick the Mosaic Wellness account. (If you see multiple,
     the wizard will help you identify the right one after the token is
     pasted.)
   - **Name**: `claude-code-<your-first-name>` (e.g. `claude-code-hitesh`).
   - **Notes**: optional — e.g. "Used by kai Claude Code plugin".
5. Click **Create a key**. NR shows the secret. It starts with `NRAK-`
   followed by alphanumeric characters.
6. Copy it immediately.

---

## Paste it

```
/kai tools-init newrelic
```

…and paste at the prompt. The wizard:

- Validates the format (`NRAK-` prefix + length).
- Probes `https://api.newrelic.com/graphql` to confirm the key works and
  enumerate which NR accounts you can access.
- If multiple accounts come back, asks you which one is Mosaic Wellness so
  the skill knows where to default future queries.
- Writes `NEW_RELIC_API_KEY=` to `~/.config/kai/tokens.env`.

---

## Region note (EU vs US)

NR has separate API endpoints for the EU and US data regions:

- US (default): `https://api.newrelic.com/graphql`
- EU: `https://api.eu.newrelic.com/graphql`

Mosaic Wellness is on the **US** region as of writing. If a future probe
returns auth errors despite a valid-looking key, try the EU endpoint.

---

## What scopes does this give Claude?

A User API key inherits the role your user has in each NR account. For
read-only analytics work, the typical user role (Standard / Read-only)
is enough. For mutating things (creating alerts, modifying dashboards),
you need a higher role.

The `newrelic-mcp` skill defaults to read-only operations.

---

## Validate

```
/kai tools-init validate
```

A green probe means the GraphQL `actor { accounts { id name } }` query
returned ≥ 1 account.

---

## Rotate

NR keys do not auto-expire, but a quarterly rotation is good hygiene:

1. `/kai tools-init rotate newrelic` and paste a fresh key.
2. After the new key validates, delete the old key in the NR UI
   (<https://one.newrelic.com/api-keys> → find the old key → Delete).

---

## Revoke

If you suspect a leak:

1. NR UI → API keys → find your key → **Delete**.
2. `/kai tools-init remove newrelic` to clean up
   `tokens.env`.
3. Audit recent activity in NR for the key in case of misuse.
