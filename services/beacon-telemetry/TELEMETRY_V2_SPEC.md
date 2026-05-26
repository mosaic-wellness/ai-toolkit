# Beacon Telemetry v2 — Shared Spec

Single source of truth for the v2 redesign. Backend, frontend, and hook
agents all conform to this file.

> **Existing data will be wiped.** No backward-compat requirements.

---

## 1. Scope

Track usage of the **`kai`** Claude Code plugin (and its sibling, `kai-dev`,
for completeness). **`mosaic-buddy` events are dropped at the ingest
layer** — the plugin is deprecated and we don't want noise from in-flight
uninstalls.

Admin user wants to answer:

1. Who's using kai? Are they coming back?
2. Which commands actually fire? Which agents are popular?
3. Where does `tools-init` lose people?
4. Are users actually running follow-on workflows after tools-init, or do
   the MCPs sit unused?
5. Is the deprecated mosaic-buddy still alive? (best-effort tracked via a
   single `legacy_seen` counter, no per-event detail)

---

## 2. Event Model

A single `Event` table covers all event types. Type-specific extras live
in `metadata` JSONB.

### Event types

| `event_type` | When the hook emits it | `command` | `subcommand` | `metadata` keys |
|---|---|---|---|---|
| `session_start` | SessionStart hook | `null` | `null` | `{cc_version?, claude_model?}` |
| `command_invoked` | UserPromptSubmit when prompt matches `/kai` router | `kai` (or `kai-dev`) | the subcommand path, e.g. `tools-init.mixpanel` (dot-separated; empty for bare `/kai`) | `{raw_args?}` (truncated 80 chars) |
| `agent_spawned` | SubagentStart | `kai` | agent name (`doctor`, `reviewer`, `documenter`, `coach`, `coach-lite`, `brainstormer`, `grillme`, `ux-reviewer`, `stack-reviewer`, `debugger`) | — |
| `agent_completed` | (optional, if a Stop or SubagentEnd hook fires) | `kai` | agent name | `{duration_ms, success: bool}` |
| `tools_init_step` | Emitted by the tools-init skill via explicit `curl` calls at key checkpoints — one event at flow entry, one terminal event at flow exit | `kai` | `tools-init.<step>` where step ∈ `mixpanel`, `firebase`, `newrelic`, `validate`, `rotate`, `remove`, `status`, `shell_hook` | `{outcome: "started" \| "success" \| "cancelled" \| "error", error_class?}` — `started` fires once at entry; exactly one terminal outcome (`success` XOR `cancelled` XOR `error`) fires at exit |
| `feedback_submitted` | The existing `/kai feedback` flow | `kai` | `feedback` | `{rating: 1-4}` (no title/description here — feedback bodies stay in the Feedback table) |

Notes:
- `subcommand` is **always dot-separated** and lowercased. Empty string
  (not `null`) for bare commands like `/kai`. This keeps grouping queries
  simple.
- `metadata` is JSONB. Limit to 1 KB serialized. Reject larger.
- All events for plugin = `mosaic-buddy` return **204 silently** at the
  ingest endpoint without writing to the DB. We don't want to lie to
  hooks (a 4xx might trip retries), but we don't want the data either.

### Allowed `plugin` values
```
kai | kai-dev | mosaic-admin
```
Any other plugin name → **drop silently with 204**, increment a global
`legacy_dropped_count` Prometheus-style counter (or just a row in a
side-table) so we know if there's still mosaic-buddy traffic out there.

---

## 3. Prisma Schema

```prisma
model Event {
  id            Int      @id @default(autoincrement())
  plugin        String   @db.VarChar(32)
  pluginVersion String?  @map("plugin_version") @db.VarChar(32)
  eventType     String   @map("event_type") @db.VarChar(32)
  command       String?  @db.VarChar(32)
  subcommand    String   @default("") @db.VarChar(80)
  userLocal     String   @map("user_local") @db.VarChar(64)
  project       String   @db.VarChar(96)
  sessionId     String?  @map("session_id") @db.VarChar(64)
  os            String?  @db.VarChar(16)
  ts            DateTime @default(now())
  metadata      Json?

  @@index([plugin])
  @@index([eventType])
  @@index([userLocal])
  @@index([sessionId])
  @@index([ts])
  @@map("beacon_events")
}

model Feedback {
  id          Int      @id @default(autoincrement())
  rating      Int
  title       String   @db.VarChar(200)
  description String   @db.Text
  userLocal   String   @map("user_local") @db.VarChar(64)
  project     String   @db.VarChar(96)
  pluginVersion String? @map("plugin_version") @db.VarChar(32)
  ts          DateTime @default(now())

  @@index([rating])
  @@index([ts])
  @@map("beacon_feedback")
}
```

One fresh migration drops the old tables and creates these.

---

## 4. Ingest API

### `POST /v2/ingest`

JSON body:
```json
{
  "plugin":         "kai",
  "plugin_version": "1.0.0",
  "event_type":     "tools_init_step",
  "command":        "kai",
  "subcommand":     "tools-init.mixpanel",
  "user_local":     "hitesh.burla96",
  "project":        "ai-toolkit",
  "session_id":     "abc123",
  "os":             "darwin",
  "ts":             1716700000,
  "sig":            "<hex>",
  "metadata":       { "outcome": "success" }
}
```

**HMAC**: `sha256_hmac(KAI_HMAC_KEY, plugin + event_type + user_local + ts)`.
`ts` is unix seconds, must be within 300s of server time. `timingSafeEqual`
comparison.

**Responses**:
- `204` — accepted (also returned for dropped plugins like `mosaic-buddy`).
- `400` — schema validation failure.
- `403` — bad signature or stale `ts`.
- `429` — rate limit (in-memory, 30 req / 60s per IP, same as today).

### `POST /v2/feedback`

Existing feedback shape, but with `user_local` instead of `user`, and
`plugin_version` optional. Otherwise same.

### Backward-compat

The legacy `GET /t` and `POST /beacon/telemetry` endpoints still exist
but return `410 Gone` with a body `{ "error": "upgrade to /v2/ingest" }`.
The kai hook ships with the v2 client so this only affects an
unupgraded mosaic-buddy install (whose events we're dropping anyway).

---

## 5. Admin API

All require `TELEMETRY_ADMIN_TOKEN` via `?token=...` or `Authorization: Bearer`.

### `GET /api/overview?days=30`
```json
{
  "totals": {
    "events": 1234,
    "dau": 12,
    "wau": 27,
    "active_users_window": 38,
    "active_projects": 11
  },
  "top_commands":  [{ "command": "kai", "subcommand": "doctor", "count": 87 }, ...],
  "top_agents":    [{ "agent":   "doctor",   "count": 45 }, ...],
  "top_users":     [{ "user_local": "hitesh.burla96", "count": 22 }, ...],
  "top_projects":  [{ "project": "storybook", "count": 19 }, ...]
}
```

### `GET /api/funnel?days=30`
```json
{
  "stages": [
    { "key": "session_start",  "label": "Opened Claude Code with kai",     "users": 38 },
    { "key": "command",        "label": "Ran /kai at least once",          "users": 24 },
    { "key": "tools_init",     "label": "Started tools-init",              "users": 14 },
    { "key": "tools_init_done","label": "Completed at least one MCP setup",  "users": 9  },
    { "key": "agent_run",      "label": "Ran any kai agent",               "users": 17 },
    { "key": "returning",      "label": "Came back ≥ 2 distinct days",     "users": 11 }
  ]
}
```

### `GET /api/commands?days=30&group=true`
Returns command counts. With `group=true`, group commands into buckets:
- **Setup**: `tools-init.*`, `token-usage-guardrails`
- **Audit**: `doctor`, `review`, `review-stack`, `ux`, `grillme`
- **Build**: `brainstorm`, `document`, `debug`
- **Session**: `handoff`, `sidequest`
- **Coaching**: `5x`, `10x`
- **Meta**: `help`, `recommendations`, `feedback` (bare `kai` falls here)

### `GET /api/tools_init?days=30`
Tools-init specific breakdown:
```json
{
  "by_step": [
    { "step": "mixpanel",  "started": 14, "success": 9,  "cancelled": 3, "errored": 2 },
    { "step": "firebase",  "started": 12, "success": 11, "cancelled": 0, "errored": 1 },
    { "step": "newrelic",  "started": 8,  "success": 5,  "cancelled": 1, "errored": 2 }
  ],
  "median_time_to_complete_seconds": 142
}
```

### `GET /api/users?days=30`
```json
{
  "users": [
    {
      "user_local":   "hitesh.burla96",
      "first_seen":   "2026-05-12T09:00:00Z",
      "last_seen":    "2026-05-26T14:33:00Z",
      "days_active":  7,
      "events":       42,
      "commands_tried": ["doctor", "tools-init.mixpanel", "feedback"],
      "agents_run":   ["doctor", "reviewer"]
    }
  ]
}
```

### `GET /api/heatmap?days=30`
Daily activity per user, suitable for a calendar heatmap:
```json
{
  "users": ["hitesh.burla96", "ayush.pawar", ...],
  "days":  ["2026-04-26", "2026-04-27", ..., "2026-05-26"],
  "matrix": [
    [2, 0, 5, 1, ...],
    ...
  ]
}
```

### `GET /api/recent?limit=50`
```json
{
  "events": [
    {
      "ts":         "2026-05-26T14:33:00Z",
      "user_local": "hitesh.burla96",
      "project":    "ai-toolkit",
      "event_type": "agent_spawned",
      "command":    "kai",
      "subcommand": "doctor",
      "metadata":   null
    }
  ]
}
```

### `GET /feedback/recent?limit=20`
Same as today, but `user_local` instead of `user`.

---

## 6. Server Code Layout

```
services/beacon-telemetry/
├── src/
│   ├── server.js          # Fastify bootstrap, registers routes, serves dashboard
│   ├── routes/
│   │   ├── ingest.js      # POST /v2/ingest, POST /v2/feedback, legacy 410
│   │   └── admin.js       # GET /api/*  — token-protected
│   ├── lib/
│   │   ├── hmac.js        # sign + verify
│   │   ├── rateLimit.js   # in-memory bucket
│   │   └── queries.js     # raw SQL for all admin endpoints
│   └── views/
│       ├── dashboard.html # main page (no more inline templates)
│       └── feedback.html  # feedback page
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20260526000000_v2_reset/
│           └── migration.sql  # DROP old tables, CREATE new
├── package.json
├── Dockerfile
└── railway.toml
```

---

## 7. Frontend Spec

Dashboard at `/`, vanilla JS, dark theme (match the current screenshot
aesthetic but cleaner — keep purple accents, fix the grid breathing room).

### Sections (top → bottom)

1. **Header strip**: Title "Kai Telemetry", subtitle "Plugin usage", time-range tabs (7 / 14 / 30 / 90 days), top-right "View feedback →" link.
2. **KPI row** (4 cards): Events, DAU, WAU, Active projects.
3. **Adoption funnel** (horizontal bar chart): 6 stages from `/api/funnel`, showing user counts with drop-off percentages between stages.
4. **Two-column row**:
   - Left: **Commands** (grouped bar chart, `/api/commands?group=true`)
   - Right: **Agents** (top-N agents from `/api/overview.top_agents`)
5. **Tools-init breakdown**: stacked bar (success / cancelled / errored) per step from `/api/tools_init`.
6. **Calendar heatmap**: per-user × day grid from `/api/heatmap`. Click a cell to filter the activity feed.
7. **Users table**: from `/api/users`, columns: user, first seen, last seen, days active, events, commands tried (chips), agents run (chips). Sortable by last-seen by default.
8. **Recent activity**: from `/api/recent`, list of last 50 events with timestamp, user, project, event type, command, subcommand.

### Visual

- Dark slate background `#0d0e12`, card background `#16181e`, accent purple `#7c6cff`.
- Use chip styling for commands/agents (same as current screenshot's pill style for command names).
- All charts: vanilla SVG, no external libs. Keep total page weight under 100 KB minified.
- Sparkline for daily DAU at the top of each KPI card.

---

## 8. Hook Spec

Hook updates live in `plugins/kai/hooks/`:

- `telemetry.sh` (existing — rewrite to POST `/v2/ingest` with JSON body
  instead of the current `GET /t?...`). Handles `SessionStart`,
  `UserPromptSubmit`, `SubagentStart`. Reads `plugin_version` from
  `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`.
- `hooks.json` (existing — add SessionStart matcher).
- `tools-init` skill (SKILL.md) — add explicit `curl` calls at the start
  and end of each step's flow with event_type=`tools_init_step` and
  metadata={step, outcome}. Skill drives those; hook doesn't.

The hook must:
- Resolve plugin name by reading `plugin.json` (so it works identically
  for kai and kai-dev if kai-dev ever adopts the same hook).
- Compute HMAC client-side with `KAI_HMAC_KEY` (default
  `mb-telem-v1-2026`, env-overridable).
- Fail silently — never block a tool call.
- Time out after 3s.
- Respect `KAI_TELEMETRY_URL=off`.

---

## 9. Out of scope (v2.0)

- Real-time updates / WebSockets — page reload is fine.
- External analytics integrations (Mixpanel, GA) — we have Mixpanel for
  product analytics; this is for plugin telemetry only.
- Per-tool-call tracking (PreToolUse for every Read/Bash/Edit) — too
  noisy. Maybe v2.1.
- Cohort retention curves beyond "returning ≥ 2 days" — defer.
