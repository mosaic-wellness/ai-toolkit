---
name: habit-workflows
description: >
  Step-by-step recipes for the 15 common habit workflows (browse, search, inspect, create
  tracker / task, duplicate task, update task, map / unmap, copy tracker, assign / unassign
  user, cleanup audit, lock-protected multi-step edits, diff stg vs prod, validate, bulk ops,
  audit brand). Auto-activates when the user asks how to do a multi-step habit operation,
  or whenever an admin-mcp habit_* tool is invoked and the agent needs the recipe.
---

# Habit Workflows — 15 Recipes

This skill is the recipe library for habit work. Pair with the `habit-essentials` skill (brand list, hard rules, schema crash-course) and the `habit-author` agent (full orchestration).

Map the user's goal to a recipe. If the goal spans multiple, run them in order, confirming success after each.

| User goal | Recipe |
|---|---|
| Browse what trackers exist | R1 — Browse |
| Find a specific tracker or task | R2 — Search |
| Inspect one tracker or task | R3 — Inspect |
| Create a brand-new tracker | R4 — Create tracker |
| Create a task from scratch | R5a — Create task from scratch |
| Create a task like an existing one | R5b — Duplicate task |
| Edit a task | R6 — Update task |
| Attach / detach tasks | R7 — Map / unmap |
| Clone a whole tracker (with tasks) | R8 — Copy tracker |
| Assign a user → tracker | R9a — Assign user |
| Remove a user from a tracker | R9b — Unassign user |
| Cleanup audit | R10 — Cleanup |
| Multi-step edits (lock) | R11 — Lock workflow |
| Diff stg vs prod | R12 — Diff |
| Dry-run validate a task payload | R13 — Validate |
| Bulk map / unmap | R14 — Bulk ops |
| Data-quality audit for a brand | R15 — Audit brand |

---

## R1 — Browse trackers

1. `habit_list_trackers({ brand: <code>, summarize: true })`. Default page is 10. Read `pagination.hasMore` and the `message` field.
2. If `hasMore`, **stop and ask the user** with the message text. Only call again with `offset: <pagination.nextOffset>` after explicit consent.
3. If the user mentions a specific tracker by name, switch to **R2 — Search**.

## R2 — Search

- Tracker by name/code → `habit_search_trackers({ query, brand })`. Limit 20 by default. Note: `name` searches actually match `trackerCode`.
- Task by name / code / activityCode → `habit_search_tasks({ query, brand })`.

If 0 matches, try a shorter substring. Don't fall back to `habit_list_*` without telling the user — pagination through the full list is expensive.

## R3 — Inspect

- Tracker: `habit_get_tracker({ id })` (preferred) or `habit_get_tracker({ code })`. Returns the tracker plus all mapped tasks.
- Task: `habit_get_task({ id })` (preferred) or `habit_get_task({ code })`. Returns the full `data` blob plus trackers the task is mapped to.

If `not found` for a tracker the user insists exists in DB, surface the `dataFidelityNote` from prior responses — middleware may have deduped it.

## R4 — Create tracker

Confirm with the user before calling:
- `name` — display name (NB: middleware doesn't expose this back via reads).
- `trackerCode` — unique within the brand. Convention is kebab-case.
- `brand` — one of the 7 supported codes.
- `activeDays` — integer.
- `isTemporary` — boolean.

Preflight: `habit_search_trackers({ query: <trackerCode>, brand })` to avoid `alreadyExists`.

Call: `habit_create_tracker({ ... })`. The tracker is empty — you still need R7 to map tasks (or use R8 to copy from a template).

## R5a — Create task from scratch

Confirm with the user:
- `name`, `code`, `type` (`NORMAL`/`MULTIPLE`/`REWARD`/`UPLOAD`/`VIDEO`/`NUDGE`), `brand`.
- Optional `dataOverrides` for advanced fields. Read `habit_describe_schema` (or `references/admin/habit-schema.md`) for the field catalogue.

Call: `habit_create_task({ ... })`.

If the user describes anything complex (options arrays, action payloads, inputConfig), switch to **R5b** — duplicating a working task is faster than authoring from scratch.

## R5b — Duplicate task

The right choice when the user references an existing task as a template.

1. Find the source: `habit_search_tasks` or `habit_get_task`. Confirm the user picked the correct `sourceTaskId`.
2. Ask the user:
   - `newCode` — required, must differ from source.
   - `newName` — optional; default appends ` - DUPLICATE` (admin UI parity, rarely what the user wants).
   - `dataOverrides` — optional.
3. Call: `habit_duplicate_task({ sourceTaskId, brand, newCode, newName, dataOverrides })`.
4. Verify with `habit_get_task({ id: <newTaskId> })` and confirm the `data.options` / `data.icon` / etc. carried over.

## R6 — Update task

Two modes:
- **`dataPatch`** (default): deep-merges. Unspecified fields are preserved.
- **`dataReplace`**: wholesale swap. ALL unspecified fields are wiped. Use only for `ONBOARDING` / `ONBOARDING_TRACKER` raw-JSON edits.

Workflow:
1. `habit_get_task({ id })` to see current state. Show the user what's there.
2. Confirm what to change. Translate to `dataPatch` (preferred).
3. Call `habit_update_task({ taskId, brand, dataPatch })`.
4. Re-fetch to verify the merge landed as intended.

If you mistakenly used `dataReplace`, the original fields are gone — apologise and offer to re-author from `habit_get_task` of a sibling task.

## R7 — Map / unmap

- Map: `habit_map_tasks_to_tracker({ trackerId, taskIds })`. Tasks must already exist for the same brand as the tracker.
- Unmap: `habit_unmap_tasks_from_tracker({ trackerId, taskIds })`. The task itself stays; only the mapping is removed.

If the user says "delete the task from this tracker", clarify: unmapping leaves the task in `task_master` for other trackers. To get rid of the task entirely, route to admin UI.

## R8 — Copy tracker

`habit_copy_tracker({ sourceTrackerId, trackerCode, brand, activeDays?, isTemporary? })` clones the tracker and its task mappings into the target brand (or same brand with a new code).

**Known limitation**: the underlying middleware endpoint can return 400 from staging admin-mcp for some brands (the controller checks `brandConfig.BE_DOMAIN` for `"stg."` and rejects if matched). If you get a 400, surface this — don't keep retrying.

## R9a — Assign user

`habit_assign_user_to_tracker({ userId, phone, brand, tracker })` wraps `/portal/utility/set-user-habit-new`. Use for QA / single-user pinning only — never for bulk enrolment.

Treat the user/phone as PII: don't echo it back in summaries beyond what's necessary.

## R9b — Unassign user

`habit_unassign_user_from_tracker({ phone, brand, tracker, userId? })` wraps `/portal/growth/unassign-tracker`. Soft-removes (sets `end_date` on each `patient_task_map` row) and prunes growth Redis so the tracker disappears from `/portal/growth/home`.

- `tracker` is the `tracker_code` (string), NOT the numeric trackerId.
- `phone` must be the last 10 digits, not the full E.164 number.
- This does NOT delete the tracker or its tasks — only the user's assignment.

## R10 — Cleanup audits

- Orphan tasks (no tracker maps): `habit_list_unmapped_tasks({ brand })`.
- Empty trackers (no task maps): `habit_list_empty_trackers({ brand })`.

Both are paginated; respect R1 pagination etiquette. Surface the `dataFidelityNote` if the user wants to act on the count.

## R11 — Lock workflow (multi-step edits)

Locks are **advisory** and 15-min TTL. They don't physically block writes — they're a UX coordination signal. Use them when:

- You're about to make several writes against the same tracker/task.
- The user is collaborating with someone else on the same row.

1. `habit_acquire_lock({ entity: "tracker" | "task", id })` → returns `lockToken`.
2. Pass `lockToken` to each subsequent write tool (`habit_update_task`, `habit_duplicate_task`, `habit_copy_tracker`).
3. `habit_release_lock({ ... })` when done.

If a lock acquisition fails, run `habit_check_lock` to see who holds it.

## R12 — Diff stg vs prod

`habit_diff_trackers({ brand })`. Middleware ignores the brand query — admin-mcp filters client-side. Output is grouped by brand. If you see noisy raw responses for other brands, that's middleware behaviour, not a bug.

## R13 — Validate task payload (dry-run)

`habit_validate_task({ name, code, type, brand, data })` does pure client-side schema validation. Use it before any create/update/duplicate to catch errors early. Returns `issues[]` keyed by field with severity (`error` blocks the write, `warning` is informational).

It does NOT check DB uniqueness of `code` — call `habit_search_tasks({ query: code })` separately for that.

## R14 — Bulk ops

For many mappings in one call:
- `habit_bulk_map_tasks_to_trackers({ assignments: [{ trackerId, taskIds }, ...], stopOnError? })`
- `habit_bulk_unmap_tasks_from_trackers({ assignments, stopOnError? })`

Max 50 assignments per call. Default is best-effort (errors don't abort the batch). Use `stopOnError: true` only when partial state would be a problem.

## R15 — Audit brand

`habit_audit_brand({ brand })` runs a client-side data-quality audit:

- Duplicate task codes within the brand
- Duplicate tracker codes (the dedupe-victim list)
- Likely-truncated names (heuristic — review before acting)
- Orphan tasks (in `task_master` but no mappings)
- Empty trackers (no tasks attached)
- Status=0 tasks still mapped to live trackers

Findings are heuristic, not authoritative. Use as input for `habit_bulk_unmap_tasks_from_trackers` etc., but **always confirm with the user** before bulk-acting.
