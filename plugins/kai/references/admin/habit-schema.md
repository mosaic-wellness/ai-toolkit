# Habit Schema Reference

The 23-field `data` blob + top-level task / tracker fields + enums + `inputConfig` variants. Source of truth: `admin-mcp/src/widget-catalog/habit-schema.json` (and the canonical `habit_describe_schema` tool).

Generated from:
- `admin-dashboard-be/application/views/admin/habit/habit_tracker.php (updateTaskKeyTextMap)`
- `middleware/api/helpers/growth-helper.ts (appendModalToTask)`
- `middleware/config/default.json (BRAND_ID_MAP, taskTypes)`
- `Mosaic-RN-Mobile-App/docs/adr/0001-habit-feature-end-to-end-flow.md`

---

## Top-Level Task Fields

| Field          | Type    | Req? | Notes                                                                                                                             |
|----------------|---------|------|-----------------------------------------------------------------------------------------------------------------------------------|
| `name`         | string  | yes  | Display title in admin grid. Mirrored into `data.text`.                                                                            |
| `code`         | string  | yes  | Unique task code within brand (e.g. `STRETCH30`). Stable reference for trackers and analytics. Changing breaks references.        |
| `type`         | enum    | yes  | `NORMAL` / `MULTIPLE` / `REWARD` / `UPLOAD` / `VIDEO` / `NUDGE`. See **Task Types** below.                                          |
| `activityCode` | string  | yes  | Activity grouping (used for streaks/contests scoping).                                                                             |
| `activityType` | enum    | no   | Default `TASK`. `TASK` / `ONBOARDING` / `ONBOARDING_TRACKER` / `QUESTIONNAIRE` / `RESTOCK`. Picks rendering and form variants.    |
| `description`  | string  | no   | Long description. Mirrored into `data.desc`.                                                                                       |
| `brand`        | string  | yes  | Short code (`MM`, `BW`, `LJ`, `LJ-AE`, `MM-AE`, `WN-IN`, `AS-IN`). Tool also sends numeric `brandId`.                              |
| `taskId`       | number  | no   | **Presence flips CREATE → UPDATE.** Omit to create, include to update.                                                             |

---

## `data` Fields (23-field reference)

The `data` object holds the bulk of the per-task configuration. Defaults shown where applicable.

| Field                              | Type    | Default | Purpose                                                                                                  |
|------------------------------------|---------|---------|----------------------------------------------------------------------------------------------------------|
| `text`                             | string  | `""`    | Task title on the app card. Auto-filled from top-level `name`.                                            |
| `type`                             | enum    | —       | Mirror of top-level `type`. Auto-filled.                                                                  |
| `rewardAmount`                     | number  | `0`     | Reward points when `type=REWARD`. Ignored otherwise.                                                      |
| `desc`                             | string  | `""`    | Long description on the card body. Auto-filled from top-level `description`.                             |
| `subText`                          | string  | `""`    | Secondary line under title.                                                                               |
| `code`                             | string  | —       | Mirror of top-level `code`. Auto-filled.                                                                  |
| `icon`                             | string  | —       | Icon URL on the card.                                                                                      |
| `buttonText`                       | string  | —       | CTA label.                                                                                                 |
| `successText`                      | string  | —       | Toast/snackbar copy on completion.                                                                         |
| `score`                            | number  | `0`     | Priority/ranking. Higher = surfaced first.                                                                |
| `newCode`                          | string  | —       | Used for renaming a task code without breaking refs. Read-only in admin UI. Risky.                        |
| `hideOnComplete`                   | boolean | `false` | Hide the card from home widget tree after completion.                                                     |
| `hideAfterNdays`                   | number  | `1000`  | Auto-hide N days after tracker assignment.                                                                |
| `showOnDelivery`                   | boolean | `false` | Reveal only after the user's order is marked delivered (gated on OMS state).                              |
| `afterNdays`                       | number  | `0`     | Day index (from tracker assignment) the card first becomes visible. 0 = immediately.                      |
| `everyNdays`                       | number  | `1`     | Repeat cadence. 1 = daily, 7 = weekly.                                                                    |
| `rnclTaskData`                     | object  | `{}`    | Second action on completion (RNCL action payload). E.g. deeplink, navigate-to.                            |
| `rnclFirstActionTaskData`          | object  | `{}`    | First action on completion. Often `OPEN_MODAL` that surfaces `TrackerModal`.                              |
| `reminderData`                     | object  | `{}`    | Reminder schedule config (push notifications).                                                            |
| `options`                          | array   | `[]`    | Multi-choice options for `type=MULTIPLE`. Also carries `inputConfig` variants for typed inputs.            |
| `completionCriteria`               | object  | `{}`    | Server-side auto-completion rules.                                                                         |
| `otherConfigs`                     | object  | `{}`    | Miscellaneous per-task config.                                                                            |
| `versionControlRnclFirstAction`    | object  | `{}`    | Version-pinned variants of `rnclFirstActionTaskData`. Target different RN app versions with different action payloads. |
| `rnclFirstActionTaskDataOld`       | object  | `{}`    | Legacy fallback for older app versions.                                                                   |
| `versionControlTaskAction`         | object  | `{}`    | Version-pinned variants of `rnclTaskData`.                                                                |

---

## `options[]` Shape

For `type=MULTIPLE` (or any task using an `inputConfig` variant), the `options` array carries each choice.

| Field            | Type   | Req? | Notes                                                                                          |
|------------------|--------|------|------------------------------------------------------------------------------------------------|
| `code`           | string | yes  | Unique within the options array. Becomes `id` in the RN modal payload.                          |
| `text`           | string | yes  | Display label. Becomes `label` in the RN modal payload.                                         |
| `image`          | string | no   | Image URL for image-radio variants.                                                             |
| `config`         | object | no   | Per-option style overrides (e.g. `imageStyles`). Merged with middleware defaults.               |
| `inputConfig`    | object | no   | Presence transforms the radio modal into a typed input control. See **inputConfig Variants**.   |
| `analytics`      | object | no   | STRIPPED by middleware before sending to the app.                                               |
| `pushBoostEvent` | object | no   | STRIPPED by middleware before sending to the app.                                               |

**Critical:** `options[i].code` must be unique within a task. Reuses silently break the RN modal selection.

---

## `inputConfig` Variants

Presence of `inputConfig` on an option flips the RadioButtonModal into a typed input control. The wire contract still uses `selectedOption` regardless of variant.

### default (omitted)
- Control: radio list
- Submitted value: selected option's `code` (stored as `data.selectedOption.id`)

### `text`
TextInput single-line.
- Fields: `label`, `placeholder`, `defaultValue`, `maxLength`, `required`
- Submitted: input string

### `number`
TextInput with `keyboardType=number-pad`.
- Fields: `label`, `placeholder`, `defaultValue`, `maxLength`, `required`
- Submitted: digit string

### `textarea`
Multi-line TextInput.
- Fields: `label`, `placeholder`, `defaultValue`, `numberOfLines`, `required`
- Submitted: free text

### `slider`
`@react-native-community/slider`.
- Fields: `label`, `defaultValue`, `minimumValue`, `maximumValue`, `step`, `unit`, `valuePrefix`, `hideValueDisplay`, `minimumTrackTintColor`, `maximumTrackTintColor`, `thumbTintColor`, `showRangeLabels`, `minLabel`, `maxLabel`, `tapToSeek`, `required`
- Submitted: `String(sliderValue)`

---

## Tracker Fields

| Field         | Type    | Req? | Default | Notes                                                                                                                      |
|---------------|---------|------|---------|----------------------------------------------------------------------------------------------------------------------------|
| `name`        | string  | yes  | —       | Display name in the admin grid.                                                                                             |
| `trackerCode` | string  | yes  | —       | Unique code per brand. Referenced by `habit_assign_user_to_tracker`. Middleware dedupes — duplicates return `alreadyExists`. |
| `activeDays`  | number  | yes  | `21`    | Duration in days (e.g. 21 = 21-day challenge).                                                                              |
| `brand`       | string  | yes  | —       | Short code. Tool sends both string code and numeric `brandId`.                                                              |
| `isTemporary` | boolean | yes  | `true`  | `true` = does not reset the user's purchase date when assigned. `false` = permanent tracker that resets cohort dates.       |

---

## Enums

### Task Types (`type`)
- `NORMAL` — Default task. Single-action completion (tap → done).
- `MULTIPLE` — Multi-completion task. `completedTimes` is incremented per action.
- `REWARD` — Reward-collection task. Submission triggers OMS `/V1/customer/add-reward` via middleware `collectReward`.
- `UPLOAD` — Image-upload task. Opens `UploadImages` screen in RN.
- `VIDEO` — Video-consumption task. Opens `VideoModal` with `task.data.onClickVideo` URL.
- `NUDGE` — Optional task. Shown with `(Optional)` label, excluded from required-completion flows.

### Activity Types (`activityType`)
- `TASK` — Default. Standard habit-tracking activity.
- `ONBOARDING` — Onboarding-flow task. Uses raw-JSON paste mode in admin form (use `dataReplace`, not `dataPatch`).
- `ONBOARDING_TRACKER` — Tracker variant of onboarding.
- `QUESTIONNAIRE` — Form-based activity. Filtered separately by middleware `habit-v2-helper`.
- `RESTOCK` — Product restocking activity. Separate card rendering in `habit-v2-helper`.

**Don't conflate `type` with `activityType`.** First is behaviour kind, second is classification. Easy to confuse.

---

## Brand IDs

| Brand ID | Code   | Short  | Display Name             | Aliases                                       |
|----------|--------|--------|--------------------------|-----------------------------------------------|
| 1        | MM     | mm     | Man Matters              | `manmatters`, `man matters`                   |
| 2        | BW     | bw     | Be Bodywise              | `bodywise`, `bebodywise`, `be bodywise`       |
| 3        | LJ     | lj     | Little Joys              | `littlejoys`, `little joys`                   |
| 4        | LJ-AE  | lj-ae  | Little Joys UAE          | `lj uae`, `littlejoys-ae`                     |
| 5        | MM-AE  | mm-ae  | Man Matters UAE          | `mm uae`, `manmatters-ae`                     |
| 6        | WN-IN  | wn-in  | Only What's Needed India | `wn`, `onlywhatsneeded`, `whatsneeded`        |
| 7        | AS-IN  | as-in  | Absolute Science India   | `as`, `absolute science`, `absolutescience`   |

Habit only ships on these 7. `mm-co`, `bw-us`, `lj-co`, `rl-in`, `fw`, etc. are **NOT** habit-supported even though admin-mcp PDP/widget tools accept them.

---

## Endpoint Reference

| Endpoint                                            | Purpose                                                                                       |
|-----------------------------------------------------|-----------------------------------------------------------------------------------------------|
| `POST /portal/growth/add-tracker`                   | Create `tracker_master` row. Dedupes on `trackerCode` → `alreadyExists`.                       |
| `POST /portal/growth/update-single-task`            | Create OR update `task_master`. Presence of `taskId` in body flips behavior.                   |
| `POST /portal/growth/map-tracker-task`              | Insert rows in `tracker_task_map`. Body: `{ trackerId, taskIds[] }`.                            |
| `POST /portal/growth/remove-tracker-task-map`       | Remove rows from `tracker_task_map`.                                                            |
| `POST /portal/growth/habit-copy-tracker`            | Clone a tracker incl. task mappings. Middleware enforces staging-only on this endpoint.        |
| `GET /portal/growth/get-tracker-data`               | Return all trackers + tasks + mappings (large payload — use `summarize: true`).                 |
| `GET /portal/growth/habit-diff-tracker`             | Diff between staging and prod for the given brand.                                              |
| `POST /portal/utility/set-user-habit-new`           | Assign a user to a tracker. Calls health-service `/habit/v2/assign-tasks`.                      |
| `POST /portal/growth/unassign-tracker`              | Soft-remove a user's tracker assignment. Prunes growth Redis.                                   |

---

## Known Pitfalls

1. **`type` vs `activityType`** are different axes. Don't conflate.
2. **`options[i].code` must be unique** within a task. Silent breakage if duplicated.
3. **`inputConfig` presence** flips the modal render mode but not the wire contract (`selectedOption`).
4. **Habit only supports 7 brand IDs** — others rejected at tool layer.
5. **Writes do NOT invalidate Redis caches** — `habit-daily-progress-{version}` (60m), `all_task_{phone}` (10m). Up to ~60min lag for newly-mapped tasks to appear in `/portal/growth/home` for live users.
6. **`data.newCode`** (rename) is supported by the admin UI but references in `tracker_task_map` continue to point at the old code until middleware reconciles. Risky.
7. **`dataReplace` wipes everything** — only use for `activityType=ONBOARDING/ONBOARDING_TRACKER`. Default to `dataPatch` (deep merge).
