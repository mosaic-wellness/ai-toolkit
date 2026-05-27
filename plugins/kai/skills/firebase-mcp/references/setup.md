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

```bash
/kai tools-init firebase
```

The wizard runs `npx -y firebase-tools@latest login` (or `firebase login`
if you already have the CLI globally installed), which:

1. Opens your default browser to a Google OAuth consent screen.
2. Asks you to sign in with your **`@mosaicwellness.in`** Google account
   (this is the only account that has access to the Mosaic Firebase
   projects).
3. Asks for permission to access Firebase data on your behalf.
4. Redirects back to a local listener; CLI prints a success banner.

The auth tokens are stored under `~/.config/configstore/firebase-tools.json`
(macOS/Linux). They refresh automatically; you typically log in once per
machine.

---

## Verify

After login, the wizard calls `firebase_list_projects` and checks for at
least one known Mosaic project ID. Expected projects include:

- `man-matters-android`
- `be-bodywise`
- `our-little-joys`
- `absolutescience-43002`
- `only-whats-needed-8136f`
- `doctor-mediconnect-ef115`
- `middle-east-a7a72`
- `app-uninstall-tracking-aa55f`

If your login succeeded but **none** of those appear, you're
logged into the wrong Google account. Run
`npx -y firebase-tools@latest logout` (or `firebase logout` if you have
it globally) and try again with your `@mosaicwellness.in` address.

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
