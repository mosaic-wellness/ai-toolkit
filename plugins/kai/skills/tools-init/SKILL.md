---
name: tools-init
description: >
  Use this skill when the user wants to set up, validate, rotate, or
  remove API tokens for the kai-plugin MCPs (Mixpanel Service Account,
  Firebase login, New Relic User API key, admin-mcp API key). Triggers on:
  "set up mixpanel", "configure firebase", "wire up new relic", "set up
  admin-mcp", "configure admin api key", "my token isn't working", "set
  up tools", "rotate token", "tools-init", or any first-time install /
  token rotation / credentials-debugging question for kai-plugin MCPs.
  Saves tokens to `~/.config/kai/tokens.env` and survives plugin updates.
  Idempotent — safe to re-run.
---

# tools-init — Setup Wizard

This skill drives the persistent-credentials flow for kai's four
shipped MCP servers needing tokens (`mosaic-mixpanel`, `mosaic-firebase`,
`mosaic-newrelic`, `admin-mcp`). The plugin's own `.mcp.json` references
`${MIXPANEL_SERVICE_ACCOUNT_TOKEN}`, `${NEW_RELIC_API_KEY}`, and
`${ADMIN_MCP_API_KEY}` — this wizard's job is to make sure those env vars
are set in a durable place that survives plugin updates.

**Credentials live in `~/.config/kai/tokens.env`** (sourced from the
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
| `mixpanel` / `firebase` / `newrelic` / `admin-mcp` | Skip menu, go straight to that tool's flow |
| `rotate <tool>`             | Replace existing token (back up old value first). `<tool>` ∈ {mixpanel, firebase, newrelic, admin-mcp}. |
| `remove <tool>`             | Remove the tokens.env line + show user how to revoke at the vendor. `<tool>` ∈ {mixpanel, firebase, newrelic, admin-mcp}. |

---

## Step 1 — Scan state (with auto-migration)

Always run this first, regardless of subcommand.

```bash
# Canonical tokens file
TOKENS_FILE="$HOME/.config/kai/tokens.env"

# One-time migration from the legacy mosaic-buddy path
LEGACY_FILE="$HOME/.config/mosaic-buddy/tokens.env"
if [ -f "$LEGACY_FILE" ] && [ ! -f "$TOKENS_FILE" ]; then
  mkdir -p "$HOME/.config/kai"
  cp "$LEGACY_FILE" "$TOKENS_FILE"
  chmod 600 "$TOKENS_FILE"
  # Tell the user we migrated; do NOT delete the legacy file —
  # mosaic-buddy may still be installed alongside kai during the
  # deprecation window.
  echo "Migrated tokens from $LEGACY_FILE → $TOKENS_FILE (legacy file kept in place)."
fi

# Read or initialize
if [ -f "$TOKENS_FILE" ]; then
  # parse KEY=value lines
fi
```

**Migration rule:** copy, never move. The legacy file stays in place so
that an existing `mosaic-buddy` install keeps working until the user
uninstalls it. After both kai and the new tokens file are validated, the
user can manually remove `~/.config/mosaic-buddy/` if they want.

For each of the four tools, compute:

| Field | How |
|---|---|
| `token_present` | env var (in user's current shell OR `$TOKENS_FILE`) is non-empty and not a placeholder. For admin-mcp: `ADMIN_MCP_API_KEY` (must start with `amk_`). For firebase: shell_hook is n/a (CLI auth). |
| `reachable` | `validate` probe succeeds (see Step 3). For admin-mcp: live `tools/list` JSON-RPC against `https://stg-admin-mcp.mosaicwellness.in/mcp`. |
| `shell_hook_installed` | `~/.zshrc` or `~/.bashrc` contains the source line. Same hook for all token-based tools. |

Display the status table to the user:

```
Tool              Token       Reachable    Shell hook
────────────────  ──────────  ───────────  ───────────────
mosaic-mixpanel   ✓ present   ✓ 200        ✓
mosaic-firebase   ✓ logged-in ✓            n/a (CLI auth)
mosaic-newrelic   ✗ missing   —            ✓
admin-mcp         ✓ present   ✓ 200        ✓
```

If every tool is green AND the subcommand was `setup` (or empty), print:
`All four tools are set up and reachable. Nothing to do.` and exit.

---

## Step 2 — Pick what to do (interactive)

If subcommand is `setup` (or empty) AND there's anything to fix, call
`AskUserQuestion` with multi-select options for the tools needing action.
Each option's label is `Set up <tool>` or `Rotate <tool>` or
`Re-verify <tool>`. Include `admin-mcp` alongside the other three (e.g.
`Set up admin-mcp` / `Rotate admin-mcp` / `Re-verify admin-mcp`). Add a
final option: `Just show me how — don't change anything`.

If subcommand is a specific tool name (`mixpanel`, `firebase`, `newrelic`,
`admin-mcp`), skip the menu and run that tool's flow directly.

---

## Step 3 — Per-tool flows

### Telemetry — emit `tools_init_step` at start and end of every flow

Each per-tool flow (mixpanel, firebase, newrelic, validate, rotate, remove)
must emit a `tools_init_step` event at the start (entering the flow) and at
completion (exit outcome). This is how `/api/tools_init` builds the funnel.

Use this Bash helper to send the event. It is fire-and-forget — never block
on it, never surface its output:

```bash
beacon_step() {
  local step="$1"        # mixpanel | firebase | newrelic | admin-mcp | validate | rotate | remove
  local outcome="$2"     # started | success | cancelled | error  (use "started" at flow entry)
  local url="${KAI_TELEMETRY_URL:-https://beacon-telemetry-production.up.railway.app/v2/ingest}"
  [ "$url" = "off" ] && return 0

  # Normalize: accept either base URL or full /v2/ingest endpoint.
  url="${url%/}"
  case "$url" in
    */v2/ingest) ;;
    *) url="${url}/v2/ingest" ;;
  esac

  local key="${KAI_HMAC_KEY:-mb-telem-v1-2026}"
  local pj="${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json"
  local plugin="kai" pver=""
  if command -v jq >/dev/null 2>&1 && [ -f "$pj" ]; then
    plugin=$(jq -r '.name // "kai"' "$pj")
    pver=$(jq -r '.version // empty' "$pj")
  fi
  local user_local
  user_local=$(git config user.email 2>/dev/null | cut -d@ -f1)
  : "${user_local:=unknown}"
  local project
  project=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo unknown)
  local os; os=$(uname -s | tr '[:upper:]' '[:lower:]')
  local ts; ts=$(date +%s)
  local session_id="${CLAUDE_CODE_SESSION_ID:-}"
  local sig
  sig=$(printf '%s%s%s%s' "$plugin" "tools_init_step" "$user_local" "$ts" \
        | openssl dgst -sha256 -hmac "$key" 2>/dev/null | awk '{print $NF}')

  # JSON via python3 so quotes / backslashes in $plugin / $project / $user_local
  # can't produce invalid bodies.
  local body
  body=$(PLUGIN="$plugin" PVER="$pver" STEP="$step" USER_LOCAL="$user_local" \
         PROJECT="$project" OS="$os" SESSION_ID="$session_id" TS="$ts" \
         SIG="$sig" OUTCOME="$outcome" \
         python3 -c '
import os, json
print(json.dumps({
  "plugin":         os.environ["PLUGIN"],
  "plugin_version": os.environ["PVER"] or None,
  "event_type":     "tools_init_step",
  "command":        "kai",
  "subcommand":     "tools-init." + os.environ["STEP"],
  "user_local":     os.environ["USER_LOCAL"],
  "project":        os.environ["PROJECT"],
  "session_id":     os.environ["SESSION_ID"] or None,
  "os":             os.environ["OS"],
  "ts":             int(os.environ["TS"]),
  "sig":            os.environ["SIG"],
  "metadata":       {"outcome": os.environ["OUTCOME"]},
}))') || return 0

  curl -s -o /dev/null -X POST -H 'Content-Type: application/json' \
    --max-time 3 --connect-timeout 2 \
    -d "$body" \
    "$url" >/dev/null 2>&1 || true
}
```

**When to call it (every flow):**

1. **At flow entry** (before any user prompts):  `beacon_step <step> started`
2. **On success**:                                `beacon_step <step> success`
3. **On user cancel / abort / "skip"**:           `beacon_step <step> cancelled`
4. **On validation failure / exception**:        `beacon_step <step> error`

Exactly one terminal outcome per flow (success XOR cancelled XOR error).
The `started` event is always paired with one terminal event.

If the user picked "Just show me how — don't change anything" from the menu,
treat that flow as `cancelled` for the relevant step.

### Mixpanel

**Telemetry — at flow entry:** run `beacon_step mixpanel started`.

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
8. **Telemetry — at flow completion:**
   - on success (token written + probe green): `beacon_step mixpanel success`
   - on user cancel / paste-skipped: `beacon_step mixpanel cancelled`
   - on probe failure / write failure: `beacon_step mixpanel error`

### Firebase

**Telemetry — at flow entry:** run `beacon_step firebase started`.

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
8. **Telemetry — at flow completion:**
   - on success (`firebase login` OK + projects listed): `beacon_step firebase success`
   - on user cancel / aborted login: `beacon_step firebase cancelled`
   - on CLI error / no projects visible: `beacon_step firebase error`

### New Relic

**Telemetry — at flow entry:** run `beacon_step newrelic started`.

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
7. **Telemetry — at flow completion:**
   - on success (token written + probe green): `beacon_step newrelic success`
   - on user cancel: `beacon_step newrelic cancelled`
   - on probe failure / format check failure: `beacon_step newrelic error`

### Admin MCP

**Telemetry — at flow entry:** run `beacon_step admin-mcp started`.

1. Tell the user this provisions an admin-dashboard API key (Zeus). The key
   format is `amk_...` and is used by the admin-mcp HTTP server at
   `https://stg-admin-mcp.mosaicwellness.in/mcp` (via the `x-api-key`
   header) for all PDP / widget page / experiment / habit operations.
   admin-mcp is **staging-only** by design — production publishing goes
   through the admin dashboard UI.
2. Offer to open the browser: ask the user
   `Open https://stg-zeus.mosaicwellness.in/admin/api_keys for you? [Y/n]`
   — on `Y`, run `open https://stg-zeus.mosaicwellness.in/admin/api_keys`.
   Tell them to create a key labeled `claude-code-<your-name>` (e.g.
   `claude-code-hitesh`) so audit logs map back cleanly.
3. Call `AskUserQuestion` with a free-text "Other" option only:
   `"Paste your admin-mcp API key (amk_...):"`. Header: `Admin MCP key`.
4. **Format check** (cheap):
   - must start with `amk_`
   - length ≥ 20
   - no whitespace, no embedded newlines
   - not a placeholder pattern (`<PASTE`, `xxx`, `amk_xxx`, `amk_your-key`)
5. **Live probe.** Hit the MCP HTTP endpoint with a `tools/list` JSON-RPC
   call. A 200 + JSON containing a `tools` array → green. 401 → key
   rejected. Anything else → show the raw response.

   ```bash
   probe_admin_mcp() {
     local token="$1"
     local url="https://stg-admin-mcp.mosaicwellness.in/mcp"
     local body='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
     local resp http_code
     resp=$(curl -s -w '\n__HTTP__:%{http_code}' \
       -X POST \
       -H 'Content-Type: application/json' \
       -H 'Accept: application/json' \
       -H "x-api-key: $token" \
       --max-time 10 --connect-timeout 5 \
       -d "$body" \
       "$url" 2>/dev/null)
     http_code=$(printf '%s' "$resp" | awk -F: '/^__HTTP__:/ {print $2}')
     body=$(printf '%s' "$resp" | sed '/^__HTTP__:/d')
     case "$http_code" in
       200)
         if printf '%s' "$body" | grep -q '"tools"'; then
           echo "GREEN: admin-mcp reachable, tools array present"
           return 0
         fi
         echo "AMBER: 200 but no tools array — server may be misconfigured"
         echo "$body" | head -c 500
         return 2
         ;;
       401|403)
         echo "RED: key rejected ($http_code) — token invalid or revoked"
         return 1
         ;;
       *)
         echo "RED: unexpected HTTP $http_code"
         echo "$body" | head -c 500
         return 1
         ;;
     esac
   }
   ```

   Optional sanity-only check (no auth): `curl -s -o /dev/null -w '%{http_code}\n' https://stg-admin-mcp.mosaicwellness.in/health` should return `200`. If that fails the server is down — surface the outage instead of telling the user their key is bad.
6. **Write**: append-or-replace the `ADMIN_MCP_API_KEY=` line in
   `$TOKENS_FILE` (Step 5 — atomic write).
7. **Quickstart**: print

   ```
   Try it (after Claude Code restart):
     "List widget pages for mm"
     "Search habit trackers in bw"
     "Show me the summer-sale landing page on Bodywise staging"
   ```
8. **Telemetry — at flow completion:**
   - on success (token written + probe green): `beacon_step admin-mcp success`
   - on user cancel / paste-skipped: `beacon_step admin-mcp cancelled`
   - on probe failure / format check failure: `beacon_step admin-mcp error`

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
`kai/tokens.env`, ask the user:

> Add this line to `<RC>` so the tokens load in every new shell?
>
> ```
> # kai
> [ -f ~/.config/kai/tokens.env ] && set -a && . ~/.config/kai/tokens.env && set +a
> ```

On `Y`, append the block to `$RC`. Tell the user to either run
`source <RC>` or open a new terminal **before** restarting Claude Code, so
the env vars are loaded into the new Claude Code process.

Skip this step if the line is already present (idempotent re-run).

---

## Step 5 — Atomic token file writes

When writing to `$TOKENS_FILE`:

1. Ensure `~/.config/kai/` exists (`mkdir -p`).
2. If the file doesn't exist yet, create it with the header:

   ```
   # kai tokens — DO NOT COMMIT
   # Managed by /kai tools-init
   # Get tokens via: /kai tools-init <tool>
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

## Telemetry — `validate`, `rotate`, `remove` subcommands

These subcommands are also tracked as `tools_init_step` events. Use the
`beacon_step` helper from Step 3.

- **`validate`**: at entry `beacon_step validate started`. On all-green
  `beacon_step validate success`; on at least one probe failing
  `beacon_step validate error`; on user abort `beacon_step validate cancelled`.
- **`rotate <tool>`**: at entry `beacon_step rotate started`. On the new
  token validating green and the backup being cleaned up
  `beacon_step rotate success`; on probe failure (backup retained)
  `beacon_step rotate error`; on user abort `beacon_step rotate cancelled`.
- **`remove <tool>`**: at entry `beacon_step remove started`. On the
  `<KEY>=` line being removed `beacon_step remove success`; on user abort
  before write `beacon_step remove cancelled`; on a write failure
  `beacon_step remove error`.

One terminal outcome per invocation. Never emit two terminal events for the
same flow.

---

## Safety

- Never write tokens to anywhere except `$TOKENS_FILE`.
- Never commit `$TOKENS_FILE` to git (it lives outside any repo, in
  `~/.config/`).
- Never echo a token to stdout/stderr; redact in all logs.
- Don't suggest the user paste tokens into shell history. The
  `AskUserQuestion` "Other" free-text field is the only entry path.
