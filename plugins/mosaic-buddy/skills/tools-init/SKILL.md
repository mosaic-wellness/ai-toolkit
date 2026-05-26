---
name: tools-init
description: >
  Use this skill when the user wants to set up, validate, rotate, or
  remove API tokens for the mosaic-buddy MCPs (Mixpanel Service Account,
  Firebase login, New Relic User API key). Triggers on: "set up
  mixpanel", "configure firebase", "wire up new relic", "my token isn't
  working", "set up tools", "rotate token", "tools-init", or any
  first-time install / token rotation / credentials-debugging question
  for mosaic-buddy MCPs. Saves tokens to
  `~/.config/mosaic-buddy/tokens.env` and survives plugin updates.
  Idempotent — safe to re-run.
---

# tools-init — Setup Wizard

This skill drives the persistent-credentials flow for mosaic-buddy's three
shipped MCP servers (`mosaic-mixpanel`, `mosaic-firebase`,
`mosaic-newrelic`). The plugin's own `.mcp.json` references
`${MIXPANEL_SERVICE_ACCOUNT_TOKEN}` and `${NEW_RELIC_API_KEY}` — this
wizard's job is to make sure those env vars are set in a durable place that
survives plugin updates.

**Credentials live in `~/.config/mosaic-buddy/tokens.env`** (sourced from the
user's shell rc via a single-line hook). The plugin never touches this file
during updates.

---

## Step 0 — Parse subcommand

Read `$ARGUMENTS` (the text after `tools-init`). Subcommand options:

| Subcommand                  | Behavior |
|-----------------------------|----------|
| `(empty)` or `setup`        | Auto-scan + interactive wizard for any tool needing setup |
| `status`                    | Read-only state table. No writes. |
| `validate`                  | Probe live endpoints with current tokens. No writes. |
| `mixpanel` / `firebase` / `newrelic` | Skip menu, go straight to that tool's flow |
| `rotate <tool>`             | Replace existing token (back up old value first) |
| `remove <tool>`             | Remove the tokens.env line + show user how to revoke at the vendor |

---

## Step 1 — Scan state

Always run this first, regardless of subcommand.

```bash
# Tokens file
TOKENS_FILE="$HOME/.config/mosaic-buddy/tokens.env"

# Read or initialize
if [ -f "$TOKENS_FILE" ]; then
  # parse KEY=value lines
fi
```

For each of the three tools, compute:

| Field | How |
|---|---|
| `token_present` | env var (in user's current shell OR `$TOKENS_FILE`) is non-empty and not a placeholder |
| `reachable` | `validate` probe succeeds (see Step 3) |
| `shell_hook_installed` | `~/.zshrc` or `~/.bashrc` contains the source line |

Display the status table to the user:

```
Tool              Token       Reachable    Shell hook
────────────────  ──────────  ───────────  ───────────────
mosaic-mixpanel   ✓ present   ✓ 200        ✓
mosaic-firebase   ✓ logged-in ✓            n/a (CLI auth)
mosaic-newrelic   ✗ missing   —            ✓
```

If every tool is green AND the subcommand was `setup` (or empty), print:
`All three tools are set up and reachable. Nothing to do.` and exit.

---

## Step 2 — Pick what to do (interactive)

If subcommand is `setup` (or empty) AND there's anything to fix, call
`AskUserQuestion` with multi-select options for the tools needing action.
Each option's label is `Set up <tool>` or `Rotate <tool>` or
`Re-verify <tool>`. Add a final option: `Just show me how — don't change
anything`.

If subcommand is a specific tool name (`mixpanel`, `firebase`, `newrelic`),
skip the menu and run that tool's flow directly.

---

## Step 3 — Per-tool flows

### Mixpanel

1. Print the click-by-click acquisition steps by reading
   `${CLAUDE_PLUGIN_ROOT}/skills/mosaic-mixpanel/references/setup.md` and showing
   the **"Get your token"** section verbatim. (The setup doc is co-located
   with the `mosaic-mixpanel` skill that owns the credential.)
2. Offer to open the browser: ask the user `Open https://mixpanel.com/settings/project for you? [Y/n]` — on `Y`, run
   `open https://mixpanel.com/settings/project` (Bash).
3. Call `AskUserQuestion` with a free-text "Other" option only:
   `"Paste your Mixpanel Service Account token:"`. Header: `Mixpanel token`.
4. **Format check** (cheap): must be ≥ 20 chars, no whitespace, no
   placeholder pattern (`<PASTE`, `xxx`, `your-token`, etc.).
5. **Live probe**: run a shell snippet that exports the token in-process and
   hits `https://mixpanel.com/api/app/me` with HTTP Basic auth. Mixpanel SA
   uses the token as username and an empty password, so the header value is
   `Authorization: Basic <base64(token:)>` (for example:
   `printf '%s:' "$TOKEN" | base64`). Decode:
   - `200` → green, parse response to confirm org membership of Mosaic
     Wellness (id `2242951`)
   - `401` → "token rejected — wrong project or revoked"
   - `403` → "token doesn't have the right scopes — needs Analyst on
     Mosaic Wellness org"
   - any other → show the raw response and let the user retry
6. **Write**: append-or-replace the `MIXPANEL_SERVICE_ACCOUNT_TOKEN=` line
   in `$TOKENS_FILE` (Step 5 — atomic write).
7. **Quickstart**: print

   ```
   Try it (after Claude Code restart):
     "Show MTU for Man Matters last 7 days"
     "What's the PDP → Cart conversion for Little Joys this month?"
   ```

### Firebase

For the full walkthrough (which Google account, expected project list),
read `${CLAUDE_PLUGIN_ROOT}/skills/mosaic-firebase/references/setup.md`.

1. The Firebase MCP uses the CLI's own auth — no token to paste.
2. Tell the user: this opens a browser-based OAuth flow.
3. Run `firebase login` via Bash. If the user is already logged in,
   `firebase login --reauth` to refresh.
4. **Live probe**: after login, the Firebase MCP's `firebase_get_environment`
   should return a non-empty `Authenticated User`.
5. **Verify org access**: call `firebase_list_projects` and confirm at
   least one Mosaic-known project ID appears (e.g.
   `man-matters-android`, `be-bodywise`, `our-little-joys`).
6. No `tokens.env` line is needed for Firebase — note in the status table
   "n/a (CLI auth)".
7. **Quickstart**: print

   ```
   Try it (after Claude Code restart):
     "Show me crash-free users for Bodywise"
     "Which Android apps exist in the Little Joys Firebase project?"
   ```

### New Relic

1. Print acquisition steps from
   `${CLAUDE_PLUGIN_ROOT}/skills/mosaic-newrelic/references/setup.md`. (Co-located
   with the `mosaic-newrelic` skill that owns the credential.)
2. Offer to open the browser: `open https://one.newrelic.com/api-keys`.
3. Ask for the User API key. Format check: must start with `NRAK-` and be
   ≥ 30 chars.
4. **Live probe**: POST to `https://api.newrelic.com/graphql` with header
   `API-Key: <token>` and body
   `{"query": "{ actor { user { name email } accounts { id name } } }"}`.
   - `200` + at least one account → green, show the account list to the
     user and ask which one is "Mosaic Wellness"
   - `200` but auth error in body → "token is valid format but rejected —
     check region (EU vs US data centre)"
   - other → show the raw response
5. **Write**: append-or-replace `NEW_RELIC_API_KEY=` in `$TOKENS_FILE`.
6. **Quickstart**: print

   ```
   Try it (after Claude Code restart):
     "What's the error rate on middleware in the last hour?"
     "Which Mosaic services have alerts firing right now?"
   ```

---

## Step 4 — One-time shell hook

If `$TOKENS_FILE` was just created (didn't exist before this session),
detect the user's shell:

```bash
case "$SHELL" in
  */zsh) RC="$HOME/.zshrc" ;;
  */bash) RC="$HOME/.bashrc" ;;
  *) RC="" ;;
esac
```

If `RC` is set AND it does NOT already contain the string
`mosaic-buddy/tokens.env`, ask the user:

> Add this line to `<RC>` so the tokens load in every new shell?
>
> ```
> # mosaic-buddy
> [ -f ~/.config/mosaic-buddy/tokens.env ] && set -a && . ~/.config/mosaic-buddy/tokens.env && set +a
> ```

On `Y`, append the block to `$RC`. Tell the user to either run
`source <RC>` or open a new terminal **before** restarting Claude Code, so
the env vars are loaded into the new Claude Code process.

Skip this step if the line is already present (idempotent re-run).

---

## Step 5 — Atomic token file writes

When writing to `$TOKENS_FILE`:

1. Ensure `~/.config/mosaic-buddy/` exists (`mkdir -p`).
2. If the file doesn't exist yet, create it with the header:

   ```
   # mosaic-buddy tokens — DO NOT COMMIT
   # Managed by /mosaic-buddy tools-init
   # Get tokens via: /mosaic-buddy tools-init <tool>
   ```

3. To upsert a line: read file, replace existing `KEY=...` line OR append
   if absent. Write to `$TOKENS_FILE.tmp`, then `mv` (atomic).
4. `chmod 600` the file every time (defense in depth).
5. Never log the token value back to the user — log only the line that was
   set and a redacted hint (e.g. `set MIXPANEL_SERVICE_ACCOUNT_TOKEN=mp_••••`).

---

## Step 6 — Final summary

Always end with the status table from Step 1, re-computed. Then:

```
Next step: restart Claude Code to load the new MCP servers.
(`/reload-plugins` is not enough for newly-set env vars — the Claude Code
process needs to spawn fresh so the shell hook runs.)
```

---

## Edge cases

- **User runs tools-init from a session that already has the env vars set**:
  detect this and tell them `Tokens already active in this session — but
  also writing to $TOKENS_FILE for persistence` before writing.
- **`status` subcommand finds a token in tokens.env but not in the live env**:
  show this as "✓ on disk, ✗ in current session" and tell the user to
  source their rc / open a new terminal.
- **`rotate` subcommand**: back up the old value as `<KEY>_OLD_<timestamp>=`
  inside `$TOKENS_FILE` so a recovery path exists if the new token fails.
  Remove the backup line after the new token validates green.
- **`remove` subcommand**: delete the `<KEY>=` line from `$TOKENS_FILE` and
  tell the user to also revoke the token at the vendor (link).

---

## Safety

- Never write tokens to anywhere except `$TOKENS_FILE`.
- Never commit `$TOKENS_FILE` to git (it lives outside any repo, in
  `~/.config/`).
- Never echo a token to stdout/stderr; redact in all logs.
- Don't suggest the user paste tokens into shell history. The
  `AskUserQuestion` "Other" free-text field is the only entry path.
