---
name: migrate
description: >
  Migrate a teammate from the retired `mosaic-buddy` plugin to `kai`.
  Detects legacy state on disk, copies tokens to the new path, shows the
  command-mapping table, and gives the exact `/plugin uninstall` command
  to drop mosaic-buddy. Idempotent — safe to re-run; harmless if no
  legacy state is found.
---

# Migrate — mosaic-buddy → kai

The `mosaic-buddy` plugin is retired. Everything it did now lives in `kai`,
plus the new MCP wiring and `tools-init` wizard. This skill walks a user
through the switch in one pass.

The migration is **not destructive**:

- The legacy tokens file (`~/.config/mosaic-buddy/tokens.env`) is **copied**,
  not moved.
- The `mosaic-buddy` plugin folder is **not** uninstalled by this skill —
  Claude Code's `/plugin uninstall` is the only safe way to remove a
  plugin, and only the user can run that.

---

## Step 1 — Detect legacy state

Run these checks (all silent on failure — missing things are not errors):

```bash
# 1. Legacy tokens file
LEGACY_TOKENS="$HOME/.config/mosaic-buddy/tokens.env"
LEGACY_TOKENS_EXISTS="no"
[ -f "$LEGACY_TOKENS" ] && LEGACY_TOKENS_EXISTS="yes"

# 2. New tokens file
KAI_TOKENS="$HOME/.config/kai/tokens.env"
KAI_TOKENS_EXISTS="no"
[ -f "$KAI_TOKENS" ] && KAI_TOKENS_EXISTS="yes"

# 3. Legacy shell-rc source line (best-effort grep)
LEGACY_SHELL_HOOK="no"
for rc in "$HOME/.zshrc" "$HOME/.bashrc"; do
  if [ -f "$rc" ] && grep -q "mosaic-buddy/tokens.env" "$rc"; then
    LEGACY_SHELL_HOOK="yes"
    break
  fi
done

# 4. Is mosaic-buddy still installed?
# Claude Code records installs in ~/.claude.json. Grep is best-effort —
# treat "unknown" as "maybe installed" so we still tell the user how to
# uninstall it.
MB_INSTALLED="unknown"
if [ -f "$HOME/.claude.json" ]; then
  if grep -q '"mosaic-buddy"' "$HOME/.claude.json" 2>/dev/null; then
    MB_INSTALLED="yes"
  else
    MB_INSTALLED="no"
  fi
fi
```

Print the detected state to the user as a compact table — same shape as
`tools-init status`:

```
mosaic-buddy state
──────────────────────────────────────────
Legacy tokens file      ✓ found / ✗ none
Kai tokens file         ✓ found / ✗ none
Legacy shell-rc hook    ✓ present / ✗ none
mosaic-buddy installed  ✓ yes / ✗ no / ? unknown
```

If **everything** is "none / no", say so and stop:
`Nothing to migrate — you're already on kai.`

---

## Step 2 — Copy tokens (if needed)

If `LEGACY_TOKENS_EXISTS=yes` AND `KAI_TOKENS_EXISTS=no`:

```bash
mkdir -p "$HOME/.config/kai"
cp "$LEGACY_TOKENS" "$KAI_TOKENS"
chmod 600 "$KAI_TOKENS"
echo "Copied $LEGACY_TOKENS → $KAI_TOKENS (legacy file kept in place)."
```

If both exist, **don't overwrite** — tell the user:
`Both ~/.config/kai/tokens.env and ~/.config/mosaic-buddy/tokens.env exist. Keeping the kai file as-is. Compare them yourself if you want to merge.`

If only `KAI_TOKENS_EXISTS=yes` and no legacy file, skip this step silently.

The migration is **copy, never move**. Rationale: if the user keeps
mosaic-buddy installed during a transition window, it still needs the
legacy file. The user removes the legacy file manually once they're sure
kai is working.

---

## Step 3 — Show the command mapping

Print this table verbatim so muscle memory transfers:

```
Command mapping — mosaic-buddy → kai
──────────────────────────────────────────────────────
/mosaic-buddy                       → /kai
/mosaic-buddy doctor                → /kai doctor
/mosaic-buddy review                → /kai review
/mosaic-buddy review-stack          → /kai review-stack
/mosaic-buddy ux                    → /kai ux
/mosaic-buddy brainstorm            → /kai brainstorm
/mosaic-buddy grillme               → /kai grillme
/mosaic-buddy document              → /kai document
/mosaic-buddy debug                 → /kai debug
/mosaic-buddy handoff <name>        → /kai handoff <name>
/mosaic-buddy sidequest <name>      → /kai sidequest <name>
/mosaic-buddy feedback              → /kai feedback
/mosaic-buddy token-usage-guardrails → /kai token-usage-guardrails
/mosaic-buddy 5x                    → /kai 5x
/mosaic-buddy 10x                   → /kai 10x
/mosaic-buddy recommendations       → /kai recommendations
/mosaic-buddy help                  → /kai help

NEW in kai (was not in mosaic-buddy):
/kai tools-init      Wire Mixpanel / Firebase / New Relic MCPs
/kai migrate         This command
```

---

## Step 4 — Uninstall mosaic-buddy

Tell the user (only if `MB_INSTALLED` is `yes` or `unknown`):

> To remove the retired plugin and stop the duplicate `/mosaic-buddy`
> command, run:
>
> ```
> /plugin uninstall mosaic-buddy
> ```
>
> This skill can't do it for you — only Claude Code's `/plugin` command
> can. After uninstalling, you can also delete the legacy tokens file
> if you don't need it anymore:
>
> ```
> rm ~/.config/mosaic-buddy/tokens.env
> rmdir ~/.config/mosaic-buddy 2>/dev/null || true
> ```
>
> And remove the legacy shell-rc source line (if `LEGACY_SHELL_HOOK=yes`):
> open `~/.zshrc` (or `~/.bashrc`) and delete the line that sources
> `~/.config/mosaic-buddy/tokens.env`.

If `MB_INSTALLED=no`, say:
`mosaic-buddy is already uninstalled — nothing to do here.`

---

## Step 5 — Final status

Print a closing summary:

```
✓ Migration complete

Next:
  • Run /kai tools-init to wire (or re-validate) Mosaic MCPs
  • Run /kai to see the menu
  • Tell the team — anyone else on mosaic-buddy should run /kai migrate
```

If anything was skipped (e.g. both token files exist, user must merge
manually), call it out in the summary so the user knows the manual
follow-up.

---

## Rules

- **Idempotent.** Running this twice does nothing the second time.
- **Never delete anything.** No `rm`, no overwrites of existing kai state.
- **Never echo token values.** Just paths and counts.
- **Never run `/plugin uninstall` for the user** — Claude Code's plugin
  system requires the human to confirm that, and bypassing it is wrong.
- **Three sentences max per step.** Keep the migration feel like a quick
  swap, not a survey.
