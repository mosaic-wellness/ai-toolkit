---
name: habit-essentials
description: >
  Core knowledge for using admin-mcp habit_* tools: 7 supported brands (mm/bw/lj/lj-ae/mm-ae/wn-in/as-in),
  brand-ID resolution, 23-field data schema crash-course, staging-only guardrail, no-delete rule,
  duplicate-only task creation pattern (admin UI never creates tasks from scratch), pagination etiquette,
  and lock TTL. Auto-activates whenever admin-mcp habit_* tools are being used or the user asks about
  habit trackers, habit tasks, tracker-task mappings, habit user assignments, or habit brand audits
  for Mosaic Wellness brands.
---

# Habit MCP Essentials

You are working with the **admin-mcp `habit_*` tools** — a staging-only surface for managing Mosaic Wellness habit-feature configuration (trackers, tasks, mappings, user assignments) stored in `tracker_master`, `task_master`, and `tracker_task_map` MySQL tables.

## Staging-Only Guardrail

**All writes via `habit_*` go to staging.** Production publishing requires the admin dashboard UI at Zeus (`https://stg-zeus.mosaicwellness.in`). The MCP layer enforces this at four levels — never try to override `environment: "production"`.

## Habit-Supported Brands (7 only)

Habit only ships on these 7 brand/country combos. Anything else is rejected at the tool layer.

| Short code | Code   | Brand ID | Display name                | Aliases                                        |
|------------|--------|----------|-----------------------------|------------------------------------------------|
| `mm`       | MM     | 1        | Man Matters                 | `manmatters`, `man matters`                    |
| `bw`       | BW     | 2        | Be Bodywise                 | `bodywise`, `bebodywise`, `be bodywise`        |
| `lj`       | LJ     | 3        | Little Joys                 | `littlejoys`, `little joys`                    |
| `lj-ae`    | LJ-AE  | 4        | Little Joys UAE             | `lj uae`, `littlejoys-ae`                      |
| `mm-ae`    | MM-AE  | 5        | Man Matters UAE             | `mm uae`, `manmatters-ae`                      |
| `wn-in`    | WN-IN  | 6        | Only What's Needed India    | `wn`, `onlywhatsneeded`, `whatsneeded`         |
| `as-in`    | AS-IN  | 7        | Absolute Science India      | `as`, `absolute science`, `absolutescience`    |

**Brand resolution.** Every tool that takes a `brand` input accepts ANY of: short code (`mm`), uppercase code (`MM`), display name (`Man Matters`), or any alias. Case-insensitive, spaces/dashes optional. Use `resolve_brand` if in doubt.

**Critical gotcha.** Habit only supports these 7. `mm-co`, `bw-us`, `lj-co`, `rl-in`, `fw`, etc. are *not* habit-supported even though admin-mcp's PDP/widget tools accept them. If a user names something outside the 7, reject early and list the valid set.

## The No-Delete Rule

There is **no MCP delete tool** for habit entities — not for tasks, not for trackers, not for mappings.

- "Remove a task from a tracker" → `habit_unmap_tasks_from_tracker` (the task itself still exists in `task_master`).
- "Remove a user from a tracker" → `habit_unassign_user_from_tracker` (soft-removes the assignment).
- "Delete a tracker / task entirely" → not possible via MCP. Send the user to the admin UI with explicit human confirmation.

## Duplicate-Only Task Creation

**The admin team never creates a task from a blank form.** The admin UI itself has no "Add Task from scratch" button — every task originates by clicking **"Duplicate Task"** on an existing card.

Two tools mirror this workflow:

- **`habit_duplicate_task`** is the canonical create path. Pre-fills the new task from a source `sourceTaskId`, applies `dataOverrides`, and POSTs without `taskId` to flip middleware into CREATE mode. Mandatory: `sourceTaskId`, `newCode`. Optional: `newName`, `dataOverrides`.
- **`habit_create_task`** exists for true scratch creation but is rarely the right answer. If the user describes anything with options arrays, action payloads, or `inputConfig`, prefer `habit_duplicate_task` — duplicating a working task is much faster and safer than authoring from scratch.

When the user says "create a habit task", ask first:
1. **Which existing task to duplicate?** (sourceTaskId) — offer `habit_list_trackers` or `habit_search_tasks` if they don't know.
2. **New code?** (must be unique within the brand)
3. **New display name?** (default appends ` - DUPLICATE` to the source name — rarely what the user wants)
4. **Which fields change?** (dataOverrides)
5. **Confirm the final payload before submitting.**

## Pagination Etiquette

`habit_list_trackers`, `habit_list_unmapped_tasks`, `habit_list_empty_trackers` all paginate. Default page is 10.

**Never auto-paginate.** When the response has `pagination.hasMore: true`:

1. Stop.
2. Show the user the `message` field from the response verbatim.
3. Wait for explicit consent to fetch the next page (with `offset: pagination.nextOffset`).

Walking the full list silently is expensive and rarely what the user actually wants.

## Lock TTL

Locks are **advisory** (UX coordination signals), not write barriers, and expire after **15 minutes**.

- Use when doing multiple writes against the same tracker/task.
- `habit_acquire_lock({ entity: "tracker" | "task", id })` returns a `lockToken`.
- Pass `lockToken` to each subsequent write (`habit_update_task`, `habit_duplicate_task`, `habit_copy_tracker`).
- `habit_release_lock({ ... })` when done.
- If acquisition fails, `habit_check_lock` reveals who holds it.

## Tool-Name Convention

All habit tools follow `habit_<verb>_<noun>`:

- `habit_create_tracker`, `habit_get_task`, `habit_map_tasks_to_tracker`, etc.

If you see old-style names in user input (`create_habit_tracker`, `get_habit_tracker`), translate silently. Never invent a name that isn't present in the live tool list — call `ToolSearch` to verify when unsure.

## 23-Field Data Schema — Crash Course

Each habit task has a top-level shape plus a nested `data` blob (the bulk of the configuration). Full reference: `${CLAUDE_PLUGIN_ROOT}/references/admin/habit-schema.md`.

**Top-level task fields:** `name`, `code`, `type` (NORMAL/MULTIPLE/REWARD/UPLOAD/VIDEO/NUDGE), `activityCode`, `activityType` (TASK/ONBOARDING/ONBOARDING_TRACKER/QUESTIONNAIRE/RESTOCK), `description`, `brand`, `taskId` (presence flips CREATE → UPDATE).

**Top 10 `data` fields** (in order of how often you'll touch them):

| Field          | Purpose                                                  |
|----------------|----------------------------------------------------------|
| `text`         | Task title shown on the app card                         |
| `desc`         | Long description on the card body                        |
| `subText`      | Secondary line under title                               |
| `icon`         | Icon URL                                                 |
| `buttonText`   | CTA label                                                |
| `score`        | Priority/ranking (higher = surfaced first)               |
| `rewardAmount` | Reward points (only for `type=REWARD`)                   |
| `options`      | Choice list for `type=MULTIPLE`; also carries `inputConfig` variants |
| `everyNdays`   | Repeat cadence (1 = daily, 7 = weekly)                   |
| `hideOnComplete` | Hide the card after the user finishes it               |

**Reminder fields:** `reminderData`, `completionCriteria`, `rnclTaskData`, `rnclFirstActionTaskData`, plus version-controlled variants. These are object blobs — read the source task first via `habit_get_task` and modify rather than authoring from scratch.

**Enums you'll hit:** `type` (6 values, listed above) ≠ `activityType` (5 values). Don't conflate them.

**inputConfig variants:** presence of `inputConfig` on an option flips the radio modal into a typed control: `text` / `number` / `textarea` / `slider` (defaults to radio list when omitted). The wire contract still uses `selectedOption`.

## Critical Gotchas

1. **`type` ≠ `activityType`.** First is behaviour kind (NORMAL/MULTIPLE/REWARD…), second is classification (TASK/ONBOARDING/…). Easy to mix up.
2. **`options[i].code` must be unique** within a task. Reuses silently break the RN modal selection.
3. **`inputConfig` presence flips render mode** but not the wire contract (still `selectedOption`).
4. **Habit Redis caches are NOT invalidated on writes.** `habit-daily-progress-{version}` (60m), `all_task_{phone}` (10m). Newly-mapped tasks may take up to ~60min to appear in `/portal/growth/home` for live users.
5. **`data.newCode`** is supported for renaming a task code without breaking refs, but it's rare and risky — `tracker_task_map` rows continue to point at the old code until middleware reconciles.
6. **`dataReplace` wipes everything.** Use only for `ONBOARDING` / `ONBOARDING_TRACKER` raw-JSON edits. Default to `dataPatch` (deep merge).
7. **Brand mismatch on `habit_copy_tracker`** — the underlying middleware controller rejects on `BE_DOMAIN: "stg."` matches. If you get a 400 from staging admin-mcp, don't retry; surface the cause.
8. **Trust the fidelity notes.** Tracker reads include `dataFidelityNote` (dedupe-by-trackerCode) and `nameFidelityNote` (`name` = `trackerCode`). Don't claim authoritative counts/names — relay these notes when relevant.
9. **No DB uniqueness check at validate time.** `habit_validate_task` is pure client-side schema. To check `code` uniqueness, run `habit_search_tasks({ query: code })` separately.

## Post-Write Verification

After ANY write, verify before reporting success:

1. **Create / duplicate** → `habit_get_*` the new entity and confirm fields.
2. **Update** → re-fetch and diff against the requested patch.
3. **Map / unmap** → `habit_get_tracker({ id })` and check `mappedTaskIds`.
4. **Copy** → confirm new tracker exists and task count matches the source.

Mention the ~60min Redis cache lag if the user expects the change to be visible in the live app immediately.

## Reference Docs

For deeper knowledge, read:

- `${CLAUDE_PLUGIN_ROOT}/references/admin/habit-tool-reference.md` — All ~24 `habit_*` tools with required/optional inputs and gotchas
- `${CLAUDE_PLUGIN_ROOT}/references/admin/habit-schema.md` — Full 23-field `data` reference + enums + inputConfig variants

Live MCP resources (preferred when available — they stay in sync with the server):

- `admin-mcp://habit/usage` — Tool surface index
- `admin-mcp://habit/usage/<tool-name>` — Per-tool guidance (when to use, when NOT, common mistakes)
