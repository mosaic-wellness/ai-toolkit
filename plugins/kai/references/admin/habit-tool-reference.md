# Habit MCP Tool Reference

All `habit_*` tools registered by `admin-mcp` (ENG-4854 +). Grouped by category. Parameters marked (required) must be provided; all others have sensible defaults or are optional patches.

Staging-only guardrail applies to every write tool. Habit only supports 7 brands: `mm`, `bw`, `lj`, `lj-ae`, `mm-ae`, `wn-in`, `as-in`.

---

## Write Tools

### `habit_create_tracker` (WRITE)
Create a new tracker row in `tracker_master`. Middleware dedupes on `trackerCode` — surface `alreadyExists` if the code clashes.
- `name` (required) — Display name.
- `trackerCode` (required) — Unique within the brand. Kebab-case convention.
- `brand` (required) — One of the 7 supported.
- `activeDays` (required) — Integer (e.g. 21 = 21-day challenge).
- `isTemporary` (required) — Boolean.
- `lockToken` — Optional advisory lock from `habit_acquire_lock`.

**When to use:** Standing up a brand-new habit tracker (empty — needs subsequent `habit_map_tasks_to_tracker` calls, or use `habit_copy_tracker` to clone from a template).

**Wraps:** `POST /portal/growth/add-tracker` (middleware).

### `habit_create_task` (WRITE — rarely the right choice)
True scratch creation of a habit task. **Prefer `habit_duplicate_task`** — the admin UI itself has no scratch-create path, and complex shapes (options, inputConfig) are hard to author from nothing.
- `name`, `code`, `type` (`NORMAL`/`MULTIPLE`/`REWARD`/`UPLOAD`/`VIDEO`/`NUDGE`), `brand` (all required).
- `description`, `activityCode`, `activityType` (`TASK`/`ONBOARDING`/`ONBOARDING_TRACKER`/`QUESTIONNAIRE`/`RESTOCK`), `dataOverrides`, `lockToken` (optional).

**Wraps:** `POST /portal/growth/update-single-task` (without `taskId`).

### `habit_duplicate_task` (WRITE — canonical create path)
Create a new habit task by duplicating an existing one. **THIS IS THE ONLY WAY MOST USERS SHOULD CREATE A HABIT TASK** — the admin UI itself only supports clone-then-modify.
- `sourceTaskId` (required) — The existing task to clone.
- `brand` (required) — Target brand (one of 7).
- `newCode` (required) — Unique within the brand. Reusing the source code returns `alreadyExists`.
- `newName` — Default appends ` - DUPLICATE` to the source name (admin UI parity, rarely the desired result).
- `dataOverrides` — Object of `data` field patches applied on top of the source.
- `activityType`, `activityCode` — Optional overrides.
- `lockToken` — Optional.

**Before calling:** confirm sourceTaskId, newCode, newName, dataOverrides, then read back the final payload.

**Wraps:** `POST /portal/growth/update-single-task` (without `taskId`).

### `habit_update_task` (WRITE)
Edit an existing task. Two modes:
- `dataPatch` (default) deep-merges. Unspecified fields are preserved.
- `dataReplace` swaps the whole `data` blob. ALL unspecified fields wiped. Use only for `activityType=ONBOARDING/ONBOARDING_TRACKER` raw-JSON edits.

Parameters:
- `taskId` (required) — Numeric task ID.
- `brand` (required).
- `name`, `code`, `description`, `type`, `activityCode`, `activityType` — Optional patches.
- `dataPatch` XOR `dataReplace` — Pick one. Default to `dataPatch`.
- `lockToken` — Optional.

**Wraps:** `POST /portal/growth/update-single-task` (with `taskId`).

### `habit_map_tasks_to_tracker` (WRITE)
Attach one or more tasks to a tracker.
- `trackerId` (required), `taskIds` (required array). Tasks must already exist for the same brand as the tracker.

**Wraps:** `POST /portal/growth/map-tracker-task`.

### `habit_unmap_tasks_from_tracker` (WRITE)
Detach tasks from a tracker. The task itself stays in `task_master` — only the mapping is removed.
- `trackerId` (required), `taskIds` (required array).

**Wraps:** `POST /portal/growth/remove-tracker-task-map`.

### `habit_bulk_map_tasks_to_trackers` (WRITE)
Map many `{ trackerId, taskIds[] }` pairs in one call. Max 50 assignments.
- `assignments` (required array of `{ trackerId, taskIds[] }`).
- `stopOnError` — Default `false` (best-effort). Set `true` when partial state would be a problem.

### `habit_bulk_unmap_tasks_from_trackers` (WRITE)
Bulk unmap. Same shape as `habit_bulk_map_tasks_to_trackers`. Max 50.

### `habit_copy_tracker` (WRITE)
Clone a tracker (and its task mappings) into a new code, optionally a new brand.
- `sourceTrackerId` (required), `brand` (required, target), `trackerCode` (required, new).
- `activeDays`, `isTemporary` — Optional overrides.

**Known limitation:** middleware controller checks `brandConfig.BE_DOMAIN` for `"stg."` and may reject with 400 for certain staging brand configs. Surface the error, don't retry.

**Wraps:** `POST /portal/growth/habit-copy-tracker`.

### `habit_assign_user_to_tracker` (WRITE — PII-sensitive)
Pin a user to a tracker. Use for QA / single-user pinning only.
- `userId`, `phone`, `brand`, `tracker` (all required).
- `skipNewUserCheck`, `from-ct`, `email` (optional).

Treat `phone` / `userId` as PII; don't echo back in summaries.

**Wraps:** `POST /portal/utility/set-user-habit-new`.

### `habit_unassign_user_from_tracker` (WRITE)
Soft-remove a user's assignment (sets `end_date` on each `patient_task_map` row) and prunes growth Redis.
- `phone` (required) — Last 10 digits, NOT full E.164.
- `brand` (required), `tracker` (required) — `tracker_code` string, NOT the numeric trackerId.
- `userId` — Optional.

**Wraps:** `POST /portal/growth/unassign-tracker`.

---

## Read Tools

### `habit_list_trackers` (READ)
Paginated list of trackers for a brand.
- `brand` (required), `summarize` (recommended — drops verbose `data` blobs), `limit` (default 10), `offset` (default 0).

**Never auto-paginate.** Check `pagination.hasMore`; if true, stop and surface the response `message` to the user. Only fetch the next page on explicit consent.

**Wraps:** `GET /portal/growth/get-tracker-data`.

### `habit_search_trackers` (READ)
Substring search on tracker name/code. Default limit 20.
- `query` (required), `brand` (required).

Note: `name` searches actually match `trackerCode` due to the dedupe pattern.

### `habit_search_tasks` (READ)
Substring search on task name / code / activityCode. Default limit 20.
- `query` (required), `brand` (required).

### `habit_get_tracker` (READ)
Fetch one tracker plus all its mapped tasks. Prefer `id` over `code`.
- `id` OR `code` (one required), `brand` (when using `code`).

Returns the tracker plus a `dataFidelityNote` (dedupe-by-trackerCode) and `nameFidelityNote` (name = trackerCode). Surface these notes when relevant.

### `habit_get_task` (READ)
Fetch one task with full `data` blob + the trackers it's mapped to.
- `id` OR `code` (one required), `brand` (when using `code`).

### `habit_list_unmapped_tasks` (READ — cleanup)
Tasks that exist in `task_master` but have no `tracker_task_map` rows (orphans).
- `brand` (required), paginated like `habit_list_trackers`.

### `habit_list_empty_trackers` (READ — cleanup)
Trackers with no mapped tasks.
- `brand` (required), paginated.

### `habit_diff_trackers` (READ)
Diff staging vs production for a brand.
- `brand` (required).

Middleware ignores the brand query — admin-mcp filters client-side. Output is grouped by brand. Noisy raw responses for other brands are middleware behaviour, not a bug.

**Wraps:** `GET /portal/growth/habit-diff-tracker`.

### `habit_audit_brand` (READ — heuristic)
Client-side data-quality audit. Findings are heuristic; review before acting.
- `brand` (required).

Returns: duplicate task codes, duplicate tracker codes (the dedupe-victim list), likely-truncated names, orphan tasks, empty trackers, status=0 tasks still mapped to live trackers.

---

## Knowledge Tools

### `habit_describe_schema` (READ — static)
Returns the static schema JSON: 23-field `data` reference, enums (`type`, `activityType`, `inputConfig.type`), brand-ID map, top-level task fields, `inputConfig` variant shapes (radio/text/number/textarea/slider).

Content sourced from `src/widget-catalog/habit-schema.json` (committed in admin-mcp). Mirrored locally at `references/admin/habit-schema.md`.

### `habit_describe_flow` (READ — static)
Markdown narrative of how create-tracker → create-task → map-task → assign-user flows end-to-end. Covers what middleware does, when Redis caches matter, what the UI does at each step.

Content sourced from `src/widget-catalog/habit-flow.md` (committed in admin-mcp).

### `habit_validate_task` (READ — pure)
Dry-run client-side schema validation. Returns `issues[]` keyed by field with severity (`error` blocks the write, `warning` is informational).
- `name`, `code`, `type`, `brand`, `data` (required).

Does NOT check DB uniqueness of `code` — call `habit_search_tasks` separately for that.

---

## Lock Tools

Locks are advisory and 15-min TTL.

### `habit_acquire_lock` (WRITE — lock)
- `entity` (`tracker` | `task`), `id` (required).

Returns `{ acquired, lockToken, lockKey, expiresAt }` or `{ acquired: false, lockedBy, expiresAt }`.

**Wraps:** admin-dashboard-be `/admin/page_locks/acquire`. Lock key shape: `habit:tracker:{trackerId}` or `habit:task:{taskId}`.

### `habit_release_lock` (WRITE — lock)
- `entity`, `id`, `lockToken` (all required).

### `habit_check_lock` (READ — lock)
- `entity`, `id` (required). Returns current lock state.

---

## Quick lookup — by intent

| User says... | Tool |
|---|---|
| "Show me trackers on mm" | `habit_list_trackers` |
| "Find tracker X" | `habit_search_trackers` |
| "What's in tracker T?" | `habit_get_tracker` |
| "Create a new tracker" | `habit_create_tracker` |
| "Create a task" / "Add a task" / "Make a new task" | `habit_duplicate_task` (preferred) |
| "Edit task T" / "Change task T" | `habit_update_task` |
| "Add task T to tracker X" | `habit_map_tasks_to_tracker` |
| "Remove task T from tracker X" | `habit_unmap_tasks_from_tracker` |
| "Clone tracker X to mm-ae" | `habit_copy_tracker` |
| "Assign user U to tracker X" | `habit_assign_user_to_tracker` |
| "Remove user U from tracker X" | `habit_unassign_user_from_tracker` |
| "List orphan tasks" | `habit_list_unmapped_tasks` |
| "List empty trackers" | `habit_list_empty_trackers` |
| "Diff staging vs prod for bw" | `habit_diff_trackers` |
| "Audit lj data quality" | `habit_audit_brand` |
| "Validate this task payload" | `habit_validate_task` |
| "Bulk-map tasks to multiple trackers" | `habit_bulk_map_tasks_to_trackers` |
| "Lock this tracker while I edit" | `habit_acquire_lock` |
| "Show me the schema" | `habit_describe_schema` |
| "How does the flow work?" | `habit_describe_flow` |
