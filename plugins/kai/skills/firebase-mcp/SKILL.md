---
name: firebase-mcp
description: >
  Use this skill for any Firebase-platform question on Mosaic Wellness
  mobile/web apps — Crashlytics crashes, Firestore queries, Cloud
  Functions, Remote Config, push notifications, App Distribution,
  Android/iOS bundle lookup, or `firebase` CLI usage. Triggers on:
  Firebase, Crashlytics, Firestore, Cloud Functions, Remote Config, push
  notifications, FCM, Android/iOS bundle, `firebase` CLI. Covers Man
  Matters, Bodywise, Little Joys, Absolute Sciences, Only Whats Needed,
  MediConnect/DocHub. For non-Firebase mobile concerns route to
  mixpanel-mcp or kai-mcp.
---

# Mosaic × Firebase

Firebase auth uses the Firebase CLI's own OAuth — there is no API token
to manage. The plugin ships `npx -y firebase-tools@latest mcp` in
`.mcp.json`, so the first time you ask Firebase a question, a browser
tab opens for Google OAuth. Subsequent sessions refresh silently.

If `firebase_get_environment` returns `Authenticated User: <NONE>`, run
`npx -y firebase-tools@latest login` directly (or any Firebase question
in Claude will re-trigger the browser flow). `/kai tools-init firebase`
confirms the plugin entry is wired but does not run login itself.

For the Mosaic-specific Firebase setup (which Google account to use, which
projects you should see after login, and the re-auth/logout flow), see
[references/setup.md](references/setup.md).

---

## Brand → Firebase project (PROD apps only)

The Firebase MCP works on one **active project at a time**. Always call
`firebase_update_environment(active_project=<id>)` first when switching
brands, then proceed.

| Brand                | Firebase project ID         | Android bundle                                         | iOS bundle                                                 |
|----------------------|-----------------------------|--------------------------------------------------------|------------------------------------------------------------|
| Man Matters          | `man-matters-android`       | `com.mosaicwellness.manmatters`                        | `com.mosaicwellness.manmatters`                            |
| Bodywise             | `be-bodywise`               | `com.mosaicwellness.bebodywise`                        | `com.mosaicwellness.bebodywise`                            |
| Little Joys          | `our-little-joys`           | `com.mosaicwellness.ourlittlejoys`                     | `com.mosaicwellness.ourlittlejoys`                         |
| Absolute Sciences    | `absolutescience-43002`     | `com.mosaicwellness.absolutescience`                   | `com.mosaicwellness.absolutescience`                       |
| Only Whats Needed    | `only-whats-needed-8136f`   | `com.foodpharmerthinkerss.onlywhatsneeded`             | `com.foodpharmerthinkerss.onlywhatsneeded`                 |
| DocHub / MediConnect | `doctor-mediconnect-ef115`  | `com.mosaicwellness.mediconnect`                       | `com.mosaicwellness.mediconnect` AND `com.mosaicwellness.docmediconnect` (two iOS apps) |
| Little Joys (UAE)    | `middle-east-a7a72`         | `com.mosaicwellness.ourlittlejoysae`                   | `com.mosaicwellness.ourlittlejoysae`                       |

**Each project also contains a `*.staging` app** (e.g.
`com.mosaicwellness.bebodywise.staging`). Default to the non-staging bundle
unless the user explicitly says "staging".

---

## Brands without a Firebase project (Mixpanel ≠ Firebase parity)

These brands have Mixpanel coverage but no visible Firebase project under
the current Firebase account:

- **Bodywise UAE / USA / Health** (3 separate Mixpanel projects)
- **Man Matters UAE**
- **Get Fitter, Rwdy Nutrition, Affluence, Root Labs, Rootlabs US**
- **Little Joys KSA / US** (only LJ AE is in Firebase)

When the user asks about Firebase for one of these brands, say so directly:
"This brand isn't on Firebase under the current account — confirm with the
mobile team whether it's on a different Firebase project, on another
crash-reporting tool, or web-only."

---

## Gotchas

1. **`man-matters-android` is a misleading project name** — the project
   houses both Android **and iOS** apps for Man Matters. Don't infer
   platform from the project name.
2. **OWN uses a non-standard bundle prefix** — `com.foodpharmerthinkerss.*`,
   NOT `com.mosaicwellness.*`. Any rule that pattern-matches on
   `com.mosaicwellness.` will silently miss OWN.
3. **MediConnect iOS has two bundles** in the same project
   (`com.mosaicwellness.mediconnect` and `com.mosaicwellness.docmediconnect`).
   This looks like a historical/migration artifact. When working on iOS-side
   changes, confirm which bundle the team currently ships before editing.
4. **`middle-east-a7a72` is LJ-AE only**, not a shared MENA project. The
   staging iOS bundle has a typo: `com.mosaicwellness.outlittlejoysaestaging`
   (note `out` instead of `our`). Cosmetic — flag it but don't auto-fix.
5. **`app-uninstall-tracking-aa55f`** is a Firebase project with zero apps —
   it's a Functions/Firestore-only project for cross-brand uninstall
   instrumentation. Don't recommend it for app-side work.

---

## Required call order

1. `firebase_get_environment` — confirm user is authenticated.
2. If authenticated user is `<NONE>`: stop, tell the user to run
   `/kai tools-init firebase`.
3. `firebase_update_environment(active_project=<id>)` to scope to a brand.
4. Then any read/write tool.

When switching brands mid-conversation, switch active project again before
the next call. The MCP state is per-session.

---

## Common asks → recipes

| Ask | Recipe |
|---|---|
| "List crash-free users for Bodywise" | switch to `be-bodywise`, query Crashlytics via the Firebase MCP |
| "What Firebase apps does Man Matters have?" | switch to `man-matters-android`, `firebase_list_apps` |
| "Update remote config for Little Joys" | switch to `our-little-joys`, use Remote Config tools — **only after confirming with the user**, since RC changes are live |
| "Why doesn't Get Fitter show up in Firebase?" | Check the "Brands without a Firebase project" list above and tell the user honestly |
