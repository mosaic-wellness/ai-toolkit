# Mixpanel — Token Setup

The `mosaic-mixpanel` MCP server uses a **Mixpanel Service Account token**.
You'll mint one on the Mixpanel org and paste it via
`/kai tools-init mixpanel`.

The token lives in `~/.config/kai/tokens.env` as
`MIXPANEL_SERVICE_ACCOUNT_TOKEN`. Plugin updates never overwrite this file.

---

## Get your token

1. Open <https://mixpanel.com/settings/project>.
2. From the project picker (top-left), select any project under the
   **Mosaic Wellness** org. The token is **org-scoped**, not
   project-scoped — picking any Mosaic project works.
3. Navigate to **Service Accounts** in the left nav (under "Access
   Security").
4. Click **+ Add Service Account**.
5. Fill the form:
   - **Name**: `claude-code-<your-first-name>` (e.g. `claude-code-hitesh`)
   - **Role**: `Analyst` — read-only is enough for analytics queries.
     Pick `Admin` only if you specifically need to create dashboards or
     write business context.
   - **Expiration**: `1 year` is the sane default. Set a calendar reminder
     to rotate before expiry.
6. Click **Create**. Mixpanel shows the secret **once**. Copy it
   immediately — there is no way to retrieve it again.

The secret looks like a long hex string (no prefix). Paste it into the
`tools-init` prompt.

---

## What scopes does this give Claude?

- `Get-Business-Context` (the org's encoded vocabulary)
- `Get-Projects`, `Get-Events`, `Get-Properties`
- `Run-Query` (Insights API — funnels, retention, breakdowns)
- Read access to dashboards, metrics, feature flags, experiments
- `Update-Business-Context` requires `Admin` role — `Analyst` won't have it.

---

## Validate

```
/kai tools-init validate
```

A green probe means the token returned ≥ 1 accessible project under org
`2242951` (Mosaic Wellness).

---

## Rotate

Annually or whenever a teammate with the token leaves:

1. `/kai tools-init rotate mixpanel`
2. Mint a new SA at <https://mixpanel.com/settings/project> →
   Service Accounts, paste it.
3. Wizard validates the new token, then deletes the old SA from Mixpanel
   (after asking).

---

## Revoke

If you suspect a leak:

1. Mixpanel UI → Service Accounts → find your SA → **Revoke**.
2. `/kai tools-init remove mixpanel` to clean up
   `tokens.env`.
