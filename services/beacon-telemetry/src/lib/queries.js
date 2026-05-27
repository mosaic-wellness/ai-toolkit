// Raw SQL queries backing the admin endpoints. All parameters are bound,
// never interpolated into the SQL string. Returns plain JS values.

const ALLOWED_PLUGINS = ['kai', 'kai-dev', 'mosaic-admin'];

function sinceDate(days) {
  const d = Math.max(1, Math.min(365, Number(days) || 30));
  return new Date(Date.now() - d * 86400000);
}

export async function overview(prisma, days) {
  const since = sinceDate(days);

  const [totals] = await prisma.$queryRaw`
    SELECT
      (SELECT COUNT(*)::int FROM beacon_events
        WHERE ts >= ${since} AND plugin = ANY(${ALLOWED_PLUGINS}::text[])) AS events,
      (SELECT COUNT(DISTINCT user_local)::int FROM beacon_events
        WHERE ts >= NOW() - INTERVAL '1 day'
          AND plugin = ANY(${ALLOWED_PLUGINS}::text[])) AS dau,
      (SELECT COUNT(DISTINCT user_local)::int FROM beacon_events
        WHERE ts >= NOW() - INTERVAL '7 days'
          AND plugin = ANY(${ALLOWED_PLUGINS}::text[])) AS wau,
      (SELECT COUNT(DISTINCT user_local)::int FROM beacon_events
        WHERE ts >= ${since}
          AND plugin = ANY(${ALLOWED_PLUGINS}::text[])) AS active_users_window,
      (SELECT COUNT(DISTINCT project)::int FROM beacon_events
        WHERE ts >= ${since}
          AND plugin = ANY(${ALLOWED_PLUGINS}::text[])) AS active_projects
  `;

  const topCommands = await prisma.$queryRaw`
    SELECT command, subcommand, COUNT(*)::int AS count
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
      AND event_type = 'command_invoked'
    GROUP BY command, subcommand
    ORDER BY count DESC
    LIMIT 20
  `;

  const topAgents = await prisma.$queryRaw`
    SELECT subcommand AS agent, COUNT(*)::int AS count
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
      AND event_type = 'agent_spawned'
    GROUP BY subcommand
    ORDER BY count DESC
    LIMIT 20
  `;

  const topUsers = await prisma.$queryRaw`
    SELECT user_local, COUNT(*)::int AS count
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
    GROUP BY user_local
    ORDER BY count DESC
    LIMIT 20
  `;

  const topProjects = await prisma.$queryRaw`
    SELECT project, COUNT(*)::int AS count
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
    GROUP BY project
    ORDER BY count DESC
    LIMIT 20
  `;

  return {
    totals,
    top_commands: topCommands,
    top_agents: topAgents,
    top_users: topUsers,
    top_projects: topProjects,
  };
}

export async function funnel(prisma, days) {
  const since = sinceDate(days);

  const [row] = await prisma.$queryRaw`
    WITH scoped AS (
      SELECT * FROM beacon_events
      WHERE ts >= ${since}
        AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
    )
    SELECT
      (SELECT COUNT(DISTINCT user_local)::int FROM scoped
        WHERE event_type = 'session_start') AS session_start_users,
      (SELECT COUNT(DISTINCT user_local)::int FROM scoped
        WHERE event_type = 'command_invoked') AS command_users,
      (SELECT COUNT(DISTINCT user_local)::int FROM scoped
        WHERE event_type = 'tools_init_step'
          AND subcommand IN (
            'tools-init.mixpanel','tools-init.firebase','tools-init.newrelic'
          )) AS tools_init_users,
      (SELECT COUNT(DISTINCT user_local)::int FROM scoped
        WHERE event_type = 'tools_init_step'
          AND subcommand IN (
            'tools-init.mixpanel','tools-init.firebase','tools-init.newrelic'
          )
          AND metadata->>'outcome' = 'success') AS tools_init_done_users,
      (SELECT COUNT(DISTINCT user_local)::int FROM scoped
        WHERE event_type = 'agent_spawned') AS agent_users,
      (SELECT COUNT(user_local)::int FROM (
        SELECT user_local
        FROM scoped
        GROUP BY user_local
        HAVING COUNT(DISTINCT DATE(ts)) >= 2
      ) AS r) AS returning_users
  `;

  return {
    stages: [
      { key: 'session_start',   label: 'Opened Claude Code with kai',    users: row.session_start_users },
      { key: 'command',         label: 'Ran /kai at least once',         users: row.command_users },
      { key: 'tools_init',      label: 'Started tools-init',             users: row.tools_init_users },
      { key: 'tools_init_done', label: 'Completed at least one MCP setup', users: row.tools_init_done_users },
      { key: 'agent_run',       label: 'Ran any kai agent',              users: row.agent_users },
      { key: 'returning',       label: 'Came back ≥ 2 distinct days',    users: row.returning_users },
    ],
  };
}

const COMMAND_GROUPS = {
  Setup:    new Set(['tools-init', 'token-usage-guardrails']),
  Audit:    new Set(['doctor', 'review', 'review-stack', 'ux', 'grillme']),
  Build:    new Set(['brainstorm', 'document', 'debug']),
  Session:  new Set(['handoff', 'sidequest']),
  Coaching: new Set(['5x', '10x']),
  Meta:     new Set(['help', 'recommendations', 'feedback']),
};

function bucketFor(subcommand) {
  if (!subcommand) return 'Meta';
  const root = subcommand.split('.')[0];
  for (const [name, set] of Object.entries(COMMAND_GROUPS)) {
    if (set.has(root)) return name;
  }
  return 'Meta';
}

export async function commands(prisma, days, group) {
  const since = sinceDate(days);

  const rows = await prisma.$queryRaw`
    SELECT command, subcommand, COUNT(*)::int AS count
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
      AND event_type = 'command_invoked'
    GROUP BY command, subcommand
    ORDER BY count DESC
  `;

  if (!group) return { commands: rows };

  const buckets = {};
  for (const r of rows) {
    const name = bucketFor(r.subcommand);
    if (!buckets[name]) buckets[name] = { group: name, count: 0, items: [] };
    buckets[name].count += r.count;
    buckets[name].items.push({ command: r.command, subcommand: r.subcommand, count: r.count });
  }
  const ordered = ['Setup', 'Audit', 'Build', 'Session', 'Coaching', 'Meta']
    .map(n => buckets[n])
    .filter(Boolean);

  return { groups: ordered };
}

export async function toolsInit(prisma, days) {
  const since = sinceDate(days);

  const steps = await prisma.$queryRaw`
    SELECT
      REPLACE(subcommand, 'tools-init.', '') AS step,
      COUNT(*) FILTER (WHERE metadata->>'outcome' = 'started')::int AS started,
      COUNT(*) FILTER (WHERE metadata->>'outcome' = 'success')::int AS success,
      COUNT(*) FILTER (WHERE metadata->>'outcome' = 'cancelled')::int AS cancelled,
      COUNT(*) FILTER (WHERE metadata->>'outcome' = 'error')::int AS errored
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
      AND event_type = 'tools_init_step'
      AND subcommand LIKE 'tools-init.%'
    GROUP BY step
    ORDER BY started DESC
  `;

  const [medianRow] = await prisma.$queryRaw`
    WITH spans AS (
      SELECT
        session_id,
        EXTRACT(EPOCH FROM (MAX(ts) - MIN(ts))) AS seconds
      FROM beacon_events
      WHERE ts >= ${since}
        AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
        AND event_type = 'tools_init_step'
        AND session_id IS NOT NULL
      GROUP BY session_id
      HAVING COUNT(*) >= 2
        AND BOOL_OR(metadata->>'outcome' = 'success')
    )
    SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY seconds)::int AS median
    FROM spans
  `;

  return {
    by_step: steps,
    median_time_to_complete_seconds: medianRow?.median ?? null,
  };
}

export async function users(prisma, days) {
  const since = sinceDate(days);

  const rows = await prisma.$queryRaw`
    SELECT
      user_local,
      MIN(ts) AS first_seen,
      MAX(ts) AS last_seen,
      COUNT(DISTINCT DATE(ts))::int AS days_active,
      COUNT(*)::int AS events,
      ARRAY_AGG(DISTINCT subcommand)
        FILTER (WHERE event_type = 'command_invoked' AND subcommand <> '')
        AS commands_tried,
      ARRAY_AGG(DISTINCT subcommand)
        FILTER (WHERE event_type = 'agent_spawned' AND subcommand <> '')
        AS agents_run
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
    GROUP BY user_local
    ORDER BY last_seen DESC
  `;

  const users = rows.map(r => ({
    user_local: r.user_local,
    first_seen: r.first_seen,
    last_seen: r.last_seen,
    days_active: r.days_active,
    events: r.events,
    commands_tried: r.commands_tried || [],
    agents_run: r.agents_run || [],
  }));

  return { users };
}

export async function heatmap(prisma, days) {
  const since = sinceDate(days);
  const numDays = Math.max(1, Math.min(365, Number(days) || 30));

  const rows = await prisma.$queryRaw`
    SELECT
      user_local,
      TO_CHAR(DATE(ts), 'YYYY-MM-DD') AS day,
      COUNT(*)::int AS count
    FROM beacon_events
    WHERE ts >= ${since}
      AND plugin = ANY(${ALLOWED_PLUGINS}::text[])
    GROUP BY user_local, day
    ORDER BY user_local, day
  `;

  const userOrder = [];
  const userSet = new Set();
  for (const r of rows) {
    if (!userSet.has(r.user_local)) {
      userSet.add(r.user_local);
      userOrder.push(r.user_local);
    }
  }

  const daysList = [];
  const today = new Date();
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    daysList.push(d.toISOString().slice(0, 10));
  }
  const dayIndex = new Map(daysList.map((d, i) => [d, i]));

  const matrix = userOrder.map(() => new Array(daysList.length).fill(0));
  const userIndex = new Map(userOrder.map((u, i) => [u, i]));

  for (const r of rows) {
    const ui = userIndex.get(r.user_local);
    const di = dayIndex.get(r.day);
    if (ui === undefined || di === undefined) continue;
    matrix[ui][di] = r.count;
  }

  return { users: userOrder, days: daysList, matrix };
}

export async function recent(prisma, limit) {
  const lim = Math.max(1, Math.min(500, Number(limit) || 50));
  const rows = await prisma.$queryRaw`
    SELECT ts, user_local, project, event_type, command, subcommand, metadata
    FROM beacon_events
    WHERE plugin = ANY(${ALLOWED_PLUGINS}::text[])
    ORDER BY ts DESC
    LIMIT ${lim}
  `;
  return { events: rows };
}

export async function feedbackRecent(prisma, limit) {
  const lim = Math.max(1, Math.min(500, Number(limit) || 20));
  const rows = await prisma.$queryRaw`
    SELECT id, rating, title, description, user_local, project, plugin_version, ts
    FROM beacon_feedback
    ORDER BY ts DESC
    LIMIT ${lim}
  `;
  return { feedback: rows };
}

export async function feedbackStats(prisma, days) {
  const since = sinceDate(days);
  const [agg] = await prisma.$queryRaw`
    SELECT
      COUNT(*)::int                             AS total,
      COALESCE(AVG(rating), 0)::float           AS avg_rating,
      COUNT(*) FILTER (WHERE rating >= 3)::int  AS positive,
      COUNT(*) FILTER (WHERE rating <= 2)::int  AS negative
    FROM beacon_feedback
    WHERE ts >= ${since}
  `;
  const byRating = await prisma.$queryRaw`
    SELECT rating, COUNT(*)::int AS count
    FROM beacon_feedback
    WHERE ts >= ${since}
    GROUP BY rating
    ORDER BY rating
  `;
  const byProject = await prisma.$queryRaw`
    SELECT project, COUNT(*)::int AS count
    FROM beacon_feedback
    WHERE ts >= ${since}
    GROUP BY project
    ORDER BY count DESC
    LIMIT 10
  `;
  return {
    total: agg?.total ?? 0,
    avg_rating: agg?.avg_rating ?? 0,
    positive: agg?.positive ?? 0,
    negative: agg?.negative ?? 0,
    by_rating: byRating,
    by_project: byProject,
  };
}
