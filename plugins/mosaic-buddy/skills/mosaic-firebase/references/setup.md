# Firebase — Auth Setup

The `mosaic-firebase` MCP server uses the **Firebase CLI's own OAuth
session** — there is no token to paste. The setup is a one-time
`firebase login` flow.

This is different from Mixpanel/New Relic, which use long-lived API tokens.

---

## First-time setup

```bash
/mosaic-buddy tools-init firebase
```

The wizard runs `firebase login`, which:

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

If your `firebase login` succeeded but **none** of those appear, you're
logged into the wrong Google account. Run `firebase logout` and try again
with your `@mosaicwellness.in` address.

---

## Active project

The Firebase MCP works on **one active project at a time**. To switch:

```
firebase use <project-id>
```

…or inside Claude:

```
"Switch firebase to be-bodywise"
```

The `mosaic-firebase` skill handles the switch automatically when you
mention a brand.

---

## What scopes does this give Claude?

Everything your Google account can do in the Firebase console:
Crashlytics, Firestore, Cloud Functions config, Remote Config, App
Distribution, Auth user management.

**This is a lot of power.** The `mosaic-firebase` skill confirms before
any write operation, and the plugin's `PreToolUse` hook also flags
risky writes.

---

## Re-auth

If you see "auth expired" errors:

```
firebase login --reauth
```

…or run `/mosaic-buddy tools-init firebase` again.

---

## Sign out

Leaving the team, switching machines, or rotating Google account:

```
firebase logout
```

Then `/mosaic-buddy tools-init status` will show Firebase as not
authenticated.

---

## No `tokens.env` entry

Unlike Mixpanel and New Relic, Firebase has **no line** in
`~/.config/mosaic-buddy/tokens.env`. Auth lives in the Firebase CLI's own
configstore.
