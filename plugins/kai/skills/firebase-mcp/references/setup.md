# Firebase — Auth Setup

The `firebase-mcp` MCP server uses the **Firebase CLI's own OAuth
session** — there is no token to paste. The setup is a one-time login
flow.

**No global firebase CLI install required.** The plugin ships
`npx -y firebase-tools@latest mcp` in `.mcp.json`, so the MCP server
runs via npx on demand. Login can be done the same way:
`npx -y firebase-tools@latest login` writes the same auth tokens to
`~/.config/configstore/firebase-tools.json` that a globally-installed
CLI would.

This is different from Mixpanel/New Relic, which use long-lived API tokens.

---

## First-time setup

The plugin's `.mcp.json` ships the `firebase-mcp` entry, so the MCP is
already wired the moment kai is installed. No paste, no global install.

`/kai tools-init firebase` confirms the entry is present and tells you
what to expect — it does **not** run login itself. OAuth happens
on-demand: the first time you ask Firebase a question in Claude (or run
`npx -y firebase-tools@latest login` yourself), firebase-tools opens a
browser to:

1. A Google OAuth consent screen.
2. Sign in with your **`@mosaicwellness.in`** Google account (the only
   account with access to the Mosaic Firebase projects).
3. Grant permission to access Firebase data on your behalf.
4. Redirect back to a local listener; CLI prints a success banner.

Auth tokens are stored under `~/.config/configstore/firebase-tools.json`
(macOS/Linux). They refresh automatically; you typically log in once per
machine.

---

## Verify

After your first Firebase MCP call, ask Claude:

> "List Firebase projects I can see."

You should get back at least one known Mosaic project ID:

- `man-matters-android`
- `be-bodywise`
- `our-little-joys`
- `absolutescience-43002`
- `only-whats-needed-8136f`
- `doctor-mediconnect-ef115`
- `middle-east-a7a72`
- `app-uninstall-tracking-aa55f`

If your login succeeded but **none** of those appear, you're logged into
the wrong Google account. Run `npx -y firebase-tools@latest logout` (or
`firebase logout` if you have it globally) and try again with your
`@mosaicwellness.in` address.

---

## Active project

The Firebase MCP works on **one active project at a time**. To switch:

```
npx -y firebase-tools@latest use <project-id>
```
(or `firebase use <project-id>` if you have the CLI globally installed)

…or inside Claude:

```
"Switch firebase to be-bodywise"
```

The `firebase-mcp` skill handles the switch automatically when you
mention a brand.

---

## What scopes does this give Claude?

Everything your Google account can do in the Firebase console:
Crashlytics, Firestore, Cloud Functions config, Remote Config, App
Distribution, Auth user management.

**This is a lot of power.** The `firebase-mcp` skill confirms before
any write operation, and the plugin's `PreToolUse` hook also flags
risky writes.

---

## Re-auth

If you see "auth expired" errors:

```
npx -y firebase-tools@latest login --reauth
```
(or `firebase login --reauth` if you have the CLI globally installed)

…or run `/kai tools-init firebase` again.

---

## Sign out

Leaving the team, switching machines, or rotating Google account:

```
npx -y firebase-tools@latest logout
```
(or `firebase logout` if you have the CLI globally installed)

Then `/kai tools-init status` will show Firebase as not
authenticated.

---

## No `tokens.env` entry

Unlike Mixpanel and New Relic, Firebase has **no line** in
`~/.config/kai/tokens.env`. Auth lives in the Firebase CLI's own
configstore.
