import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'node:crypto';

const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

// --- Auth ---

const HMAC_KEY = process.env.TELEMETRY_HMAC_KEY || 'mb-telem-v1-2026';
const ADMIN_TOKEN = process.env.TELEMETRY_ADMIN_TOKEN || '';

function verifyHmac(c, d, p, ts, sig) {
  if (!sig || !ts) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (age > 300) return false;
  const expected = createHmac('sha256', HMAC_KEY)
    .update(`${c}${d}${p}${ts}`)
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function requireAdmin(request, reply) {
  if (!ADMIN_TOKEN) return true;
  const token = request.query.token || request.headers['authorization']?.replace('Bearer ', '');
  if (token === ADMIN_TOKEN) return true;
  reply.code(401).send({ error: 'unauthorized' });
  return false;
}

// --- Rate Limiting ---

const rateMap = new Map();
const RATE_WINDOW = 60_000;
const RATE_MAX = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (entry && entry.reset > now) {
    if (entry.count >= RATE_MAX) return false;
    entry.count++;
    return true;
  }
  rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (entry.reset <= now) rateMap.delete(ip);
  }
}, 300_000);

// --- API Routes ---

// Tracking endpoint — GET /t?c=doctor&d=username&p=project&s=agent&ts=epoch&sig=hmac
fastify.get('/t', async (request, reply) => {
  const { c, d, p, s, ts, sig } = request.query;

  if (!c || !d) {
    reply.code(204).send();
    return;
  }

  if (!verifyHmac(c, d, p, ts, sig)) {
    reply.code(403).send();
    return;
  }

  if (!checkRateLimit(request.ip)) {
    reply.code(429).send();
    return;
  }

  await prisma.event.create({
    data: {
      command: String(c).slice(0, 50),
      userEmail: String(d).slice(0, 255),
      projectName: String(p || 'unknown').slice(0, 255),
      source: String(s || 'prompt').slice(0, 10),
      ts: new Date(),
    },
  });

  reply.code(204).send();
});

// Legacy POST endpoint
fastify.post('/beacon/telemetry', async (request, reply) => {
  const { command, user_email, project_name, ts, sig, epoch } = request.body || {};

  if (!command || !user_email) {
    return reply.code(400).send({ ok: false, error: 'command and user_email required' });
  }

  if (!verifyHmac(command, user_email, project_name || 'unknown', epoch, sig)) {
    return reply.code(403).send({ ok: false, error: 'invalid signature' });
  }

  if (!checkRateLimit(request.ip)) {
    return reply.code(429).send({ ok: false, error: 'rate limited' });
  }

  await prisma.event.create({
    data: {
      command: command.slice(0, 50),
      userEmail: user_email.slice(0, 255),
      projectName: (project_name || 'unknown').slice(0, 255),
      ts: ts ? new Date(ts) : new Date(),
    },
  });

  return { ok: true };
});

// Stats — admin only
fastify.get('/beacon/telemetry/stats', async (request, reply) => {
  if (!requireAdmin(request, reply)) return;

  const days = parseInt(request.query.days || '30', 10);
  const since = new Date(Date.now() - days * 86400000);

  const byCommand = await prisma.$queryRaw`
    SELECT command, COUNT(*)::int as count
    FROM beacon_events WHERE ts >= ${since}
    GROUP BY command ORDER BY count DESC
  `;

  const byUser = await prisma.$queryRaw`
    SELECT user_email, COUNT(*)::int as count
    FROM beacon_events WHERE ts >= ${since}
    GROUP BY user_email ORDER BY count DESC
  `;

  const byProject = await prisma.$queryRaw`
    SELECT project_name, COUNT(*)::int as count
    FROM beacon_events WHERE ts >= ${since}
    GROUP BY project_name ORDER BY count DESC
  `;

  const daily = await prisma.$queryRaw`
    SELECT ts::date as date, COUNT(*)::int as count
    FROM beacon_events WHERE ts >= ${since}
    GROUP BY ts::date ORDER BY date
  `;

  const recent = await prisma.$queryRaw`
    SELECT command, user_email, project_name, ts
    FROM beacon_events ORDER BY ts DESC LIMIT 50
  `;

  const total = await prisma.event.count({ where: { ts: { gte: since } } });

  return { total, days, byCommand, byUser, byProject, daily, recent };
});

// Feedback submission — POST /feedback {rating, title, description, user, project, ts, sig}
fastify.post('/feedback', async (request, reply) => {
  const { rating, title, description, user, project, ts, sig } = request.body || {};

  const ratingInt = Number(rating);
  if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 4) {
    return reply.code(400).send({ ok: false, error: 'rating must be integer 1-4' });
  }
  if (typeof title !== 'string' || !title.trim() || title.length > 200) {
    return reply.code(400).send({ ok: false, error: 'title required, max 200 chars' });
  }
  if (typeof description !== 'string' || !description.trim() || description.length > 2000) {
    return reply.code(400).send({ ok: false, error: 'description required, max 2000 chars' });
  }
  if (!user || !project) {
    return reply.code(400).send({ ok: false, error: 'user and project required' });
  }

  if (!verifyHmac(ratingInt, user, project, ts, sig)) {
    return reply.code(403).send({ ok: false, error: 'invalid signature' });
  }

  if (!checkRateLimit(request.ip)) {
    return reply.code(429).send({ ok: false, error: 'rate limited' });
  }

  await prisma.feedback.create({
    data: {
      rating: ratingInt,
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 2000),
      userEmail: String(user).slice(0, 255),
      projectName: String(project).slice(0, 255),
      ts: new Date(),
    },
  });

  return { ok: true };
});

// Feedback stats — admin only
fastify.get('/feedback/stats', async (request, reply) => {
  if (!requireAdmin(request, reply)) return;

  const days = parseInt(request.query.days || '90', 10);
  const since = new Date(Date.now() - days * 86400000);

  const total = await prisma.feedback.count({ where: { ts: { gte: since } } });

  const avgRow = await prisma.$queryRaw`
    SELECT AVG(rating)::float as avg
    FROM beacon_feedback WHERE ts >= ${since}
  `;
  const avg = avgRow[0]?.avg ?? null;

  const byRating = await prisma.$queryRaw`
    SELECT rating, COUNT(*)::int as count
    FROM beacon_feedback WHERE ts >= ${since}
    GROUP BY rating ORDER BY rating DESC
  `;

  const byProject = await prisma.$queryRaw`
    SELECT project_name, COUNT(*)::int as count, AVG(rating)::float as avg
    FROM beacon_feedback WHERE ts >= ${since}
    GROUP BY project_name ORDER BY count DESC
  `;

  const recent = await prisma.$queryRaw`
    SELECT id, rating, title, description, user_email, project_name, ts
    FROM beacon_feedback ORDER BY ts DESC LIMIT 100
  `;

  return { total, days, avg, byRating, byProject, recent };
});

fastify.get('/health', async () => ({ status: 'ok' }));

// --- Dashboard (admin only) ---

fastify.get('/', async (request, reply) => {
  if (!requireAdmin(request, reply)) return;
  reply.type('text/html');
  return reply.send(dashboardHtml);
});

fastify.get('/feedback', async (request, reply) => {
  if (!requireAdmin(request, reply)) return;
  reply.type('text/html');
  return reply.send(feedbackDashboardHtml);
});

const dashboardHtml = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beacon Telemetry</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e0e0e8; min-height: 100vh; }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #1a1a2e; }
  .header h1 { font-size: 20px; font-weight: 600; color: #fff; }
  .header p { font-size: 13px; color: #666; margin-top: 4px; }
  .controls { padding: 16px 40px; display: flex; gap: 8px; }
  .controls button { padding: 6px 14px; border-radius: 6px; border: 1px solid #1a1a2e; background: transparent; color: #888; font-size: 13px; cursor: pointer; transition: all 0.15s; }
  .controls button:hover { border-color: #333; color: #ccc; }
  .controls button.active { background: #1a1a2e; color: #fff; border-color: #2a2a4e; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding: 8px 40px 24px; }
  .stat-card { background: #111118; border: 1px solid #1a1a2e; border-radius: 10px; padding: 20px; }
  .stat-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
  .stat-card .value { font-size: 28px; font-weight: 700; color: #fff; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 40px 24px; }
  .card { background: #111118; border: 1px solid #1a1a2e; border-radius: 10px; padding: 24px; }
  .card h2 { font-size: 13px; font-weight: 600; color: #888; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .bar-label { font-size: 13px; color: #ccc; width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
  .bar-track { flex: 1; height: 24px; background: #0a0a0f; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
  .bar-count { font-size: 13px; color: #666; width: 40px; text-align: right; flex-shrink: 0; }
  .chart-area { width: 100%; height: 180px; position: relative; }
  .chart-area svg { width: 100%; height: 100%; }
  .full-width { grid-column: 1 / -1; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; padding: 8px 12px; border-bottom: 1px solid #1a1a2e; }
  td { font-size: 13px; padding: 8px 12px; border-bottom: 1px solid #0f0f18; color: #bbb; }
  tr:hover td { background: #0f0f18; }
  .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
  .empty-msg { color: #444; font-size: 13px; padding: 20px 0; text-align: center; }
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .header, .controls, .stats, .grid { padding-left: 20px; padding-right: 20px; } }
</style>
</head>
<body>
  <div class="header" style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <h1>Beacon Telemetry</h1>
      <p>Plugin usage across the team</p>
    </div>
    <a id="feedback-link" href="#" style="color:#8b5cf6;text-decoration:none;font-size:13px;">View feedback &rarr;</a>
  </div>
  <div class="controls" id="controls"></div>
  <div class="stats" id="stats"></div>
  <div class="grid" id="grid"></div>

<script>
const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#7c3aed','#5b21b6','#4f46e5'];
const CMD_COLORS = { doctor:'#ef4444', review:'#f59e0b', brainstorm:'#22c55e', grillme:'#ec4899',
  ux:'#06b6d4', debug:'#f97316', document:'#8b5cf6', '10x':'#6366f1', 'review-stack':'#14b8a6', recommendations:'#64748b' };
let currentDays = 30;

const urlToken = new URLSearchParams(window.location.search).get('token') || '';
document.getElementById('feedback-link').href = '/feedback?token=' + encodeURIComponent(urlToken);

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.textContent;
}

function el(tag, attrs, children) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'className') e.className = v;
    else e.setAttribute(k, v);
  });
  if (typeof children === 'string') e.textContent = children;
  else if (Array.isArray(children)) children.forEach(c => { if (c) e.appendChild(c); });
  else if (children instanceof Node) e.appendChild(children);
  return e;
}

function buildControls() {
  const container = document.getElementById('controls');
  container.replaceChildren();
  [7, 14, 30, 90].forEach(d => {
    const btn = el('button', { 'data-days': d, className: d === currentDays ? 'active' : '' }, d + ' days');
    btn.addEventListener('click', () => load(d));
    container.appendChild(btn);
  });
}

function statCard(label, value) {
  return el('div', { className: 'stat-card' }, [
    el('div', { className: 'label' }, label),
    el('div', { className: 'value' }, String(value)),
  ]);
}

function barRow(label, count, max, color) {
  const pct = (count / max * 100).toFixed(1);
  const fill = el('div', { className: 'bar-fill', style: { width: pct + '%', background: color } });
  return el('div', { className: 'bar-row' }, [
    el('span', { className: 'bar-label', title: label }, label),
    el('div', { className: 'bar-track' }, fill),
    el('span', { className: 'bar-count' }, String(count)),
  ]);
}

function card(title, contentEl, extra) {
  const c = el('div', { className: 'card' + (extra ? ' ' + extra : '') }, [
    el('h2', null, title),
    contentEl,
  ]);
  return c;
}

function emptyMsg() {
  return el('div', { className: 'empty-msg' }, 'No data yet');
}

function sparkChart(daily) {
  const maxVal = Math.max(...daily.map(d => d.count), 1);
  const w = 100, h = 100, pad = 5;
  const step = daily.length > 1 ? (w - 2 * pad) / (daily.length - 1) : 0;
  const pts = daily.map((d, i) => [pad + i * step, h - pad - (d.count / maxVal) * (h - 2 * pad)]);

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  svg.setAttribute('preserveAspectRatio', 'none');

  const areaPoints = pad + ',' + (h - pad) + ' ' + pts.map(p => p.join(',')).join(' ') + ' ' + (pad + (daily.length - 1) * step) + ',' + (h - pad);
  const poly = document.createElementNS(ns, 'polygon');
  poly.setAttribute('points', areaPoints);
  poly.setAttribute('fill', 'rgba(99,102,241,0.15)');
  svg.appendChild(poly);

  const line = document.createElementNS(ns, 'polyline');
  line.setAttribute('points', pts.map(p => p.join(',')).join(' '));
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', '#6366f1');
  line.setAttribute('stroke-width', '1.5');
  svg.appendChild(line);

  pts.forEach(p => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', '1.5'); c.setAttribute('fill', '#6366f1');
    svg.appendChild(c);
  });

  const container = el('div', { className: 'chart-area' });
  container.appendChild(svg);
  return container;
}

function recentTable(rows) {
  const thead = el('thead', null, [
    el('tr', null, ['Command', 'User', 'Project', 'Time'].map(t => el('th', null, t)))
  ]);
  const tbody = el('tbody');
  rows.forEach(r => {
    const color = CMD_COLORS[r.command] || '#6366f1';
    const tag = el('span', { className: 'tag', style: { background: color + '22', color: color } }, esc(r.command));
    const tr = el('tr', null, [
      el('td', null, tag),
      el('td', null, esc(r.user_email)),
      el('td', null, esc(r.project_name)),
      el('td', null, timeAgo(new Date(r.ts))),
    ]);
    tbody.appendChild(tr);
  });
  return el('table', null, [thead, tbody]);
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

async function load(days) {
  currentDays = days;
  buildControls();

  const res = await fetch('/beacon/telemetry/stats?days=' + days + '&token=' + encodeURIComponent(urlToken));
  if (!res.ok) {
    const msg = el('div', { className: 'empty-msg' }, 'Unauthorized. Add ?token=YOUR_ADMIN_TOKEN to the URL.');
    document.getElementById('stats').replaceChildren(msg);
    return;
  }
  const d = await res.json();

  const statsEl = document.getElementById('stats');
  const gridEl = document.getElementById('grid');
  statsEl.replaceChildren();
  gridEl.replaceChildren();

  const topCmd = d.byCommand[0] ? d.byCommand[0].command : '-';
  [['Total Events', d.total], ['Active Users', d.byUser.length], ['Projects', d.byProject.length], ['Top Command', topCmd]]
    .forEach(([l, v]) => statsEl.appendChild(statCard(l, v)));

  const maxCmd = Math.max(...d.byCommand.map(r => r.count), 1);
  const cmdContent = d.byCommand.length ? el('div', null, d.byCommand.map(r => barRow(r.command, r.count, maxCmd, CMD_COLORS[r.command] || '#6366f1'))) : emptyMsg();
  gridEl.appendChild(card('Commands', cmdContent));

  const maxUser = Math.max(...d.byUser.map(r => r.count), 1);
  const userContent = d.byUser.length ? el('div', null, d.byUser.map((r, i) => barRow(r.user_email, r.count, maxUser, COLORS[i % COLORS.length]))) : emptyMsg();
  gridEl.appendChild(card('Team Members', userContent));

  const maxProj = Math.max(...d.byProject.map(r => r.count), 1);
  const projContent = d.byProject.length ? el('div', null, d.byProject.map((r, i) => barRow(r.project_name, r.count, maxProj, COLORS[(i + 3) % COLORS.length]))) : emptyMsg();
  gridEl.appendChild(card('Projects', projContent));

  const chartContent = d.daily.length ? sparkChart(d.daily) : emptyMsg();
  gridEl.appendChild(card('Daily Activity', chartContent));

  const tableContent = d.recent.length ? recentTable(d.recent) : emptyMsg();
  gridEl.appendChild(card('Recent Activity', tableContent, 'full-width'));
}

buildControls();
load(30);
</script>
</body>
</html>`;

const feedbackDashboardHtml = /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beacon Feedback</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #e0e0e8; min-height: 100vh; }
  .header { padding: 32px 40px 24px; border-bottom: 1px solid #1a1a2e; display: flex; justify-content: space-between; align-items: flex-end; }
  .header h1 { font-size: 20px; font-weight: 600; color: #fff; }
  .header p { font-size: 13px; color: #666; margin-top: 4px; }
  .header a { color: #8b5cf6; text-decoration: none; font-size: 13px; }
  .controls { padding: 16px 40px; display: flex; gap: 8px; }
  .controls button { padding: 6px 14px; border-radius: 6px; border: 1px solid #1a1a2e; background: transparent; color: #888; font-size: 13px; cursor: pointer; transition: all 0.15s; }
  .controls button:hover { border-color: #333; color: #ccc; }
  .controls button.active { background: #1a1a2e; color: #fff; border-color: #2a2a4e; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; padding: 8px 40px 24px; }
  .stat-card { background: #111118; border: 1px solid #1a1a2e; border-radius: 10px; padding: 20px; }
  .stat-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; }
  .stat-card .value { font-size: 28px; font-weight: 700; color: #fff; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 0 40px 24px; }
  .card { background: #111118; border: 1px solid #1a1a2e; border-radius: 10px; padding: 24px; }
  .card h2 { font-size: 13px; font-weight: 600; color: #888; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .bar-label { font-size: 13px; color: #ccc; width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
  .bar-track { flex: 1; height: 24px; background: #0a0a0f; border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
  .bar-count { font-size: 13px; color: #666; width: 60px; text-align: right; flex-shrink: 0; }
  .full-width { grid-column: 1 / -1; }
  .feedback-item { background: #0f0f18; border: 1px solid #1a1a2e; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .feedback-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .feedback-rating { font-size: 14px; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
  .feedback-title { font-size: 15px; color: #fff; font-weight: 600; margin-bottom: 6px; }
  .feedback-desc { font-size: 13px; color: #bbb; white-space: pre-wrap; line-height: 1.5; }
  .feedback-user, .feedback-project, .feedback-time { font-size: 12px; color: #666; }
  .feedback-user::before { content: '•'; margin-right: 8px; color: #333; }
  .feedback-project::before { content: '•'; margin-right: 8px; color: #333; }
  .feedback-time { margin-left: auto; }
  .empty-msg { color: #444; font-size: 13px; padding: 20px 0; text-align: center; }
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } .header, .controls, .stats, .grid { padding-left: 20px; padding-right: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Beacon Feedback</h1>
      <p>What teammates are telling us about mosaic-buddy</p>
    </div>
    <a id="telemetry-link" href="#">&larr; Back to telemetry</a>
  </div>
  <div class="controls" id="controls"></div>
  <div class="stats" id="stats"></div>
  <div class="grid" id="grid"></div>

<script>
const RATING_LABELS = { 4: 'Loved it', 3: 'Liked it', 2: 'Meh', 1: 'Frustrated' };
const RATING_COLORS = { 4: '#22c55e', 3: '#84cc16', 2: '#f59e0b', 1: '#ef4444' };
const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#7c3aed'];
let currentDays = 90;

const urlToken = new URLSearchParams(window.location.search).get('token') || '';
document.getElementById('telemetry-link').href = '/?token=' + encodeURIComponent(urlToken);

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.textContent;
}

function el(tag, attrs, children) {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'className') e.className = v;
    else e.setAttribute(k, v);
  });
  if (typeof children === 'string') e.textContent = children;
  else if (Array.isArray(children)) children.forEach(c => { if (c) e.appendChild(c); });
  else if (children instanceof Node) e.appendChild(children);
  return e;
}

function buildControls() {
  const container = document.getElementById('controls');
  container.replaceChildren();
  [7, 30, 90, 365].forEach(d => {
    const btn = el('button', { 'data-days': d, className: d === currentDays ? 'active' : '' }, d + ' days');
    btn.addEventListener('click', () => load(d));
    container.appendChild(btn);
  });
}

function statCard(label, value) {
  return el('div', { className: 'stat-card' }, [
    el('div', { className: 'label' }, label),
    el('div', { className: 'value' }, String(value)),
  ]);
}

function barRow(label, count, max, color, suffix) {
  const pct = (count / max * 100).toFixed(1);
  const fill = el('div', { className: 'bar-fill', style: { width: pct + '%', background: color } });
  return el('div', { className: 'bar-row' }, [
    el('span', { className: 'bar-label', title: label }, label),
    el('div', { className: 'bar-track' }, fill),
    el('span', { className: 'bar-count' }, (suffix ? count + ' ' + suffix : String(count))),
  ]);
}

function card(title, contentEl, extra) {
  return el('div', { className: 'card' + (extra ? ' ' + extra : '') }, [
    el('h2', null, title),
    contentEl,
  ]);
}

function emptyMsg(msg) {
  return el('div', { className: 'empty-msg' }, msg || 'No feedback yet');
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function feedbackItem(r) {
  const color = RATING_COLORS[r.rating] || '#666';
  const label = RATING_LABELS[r.rating] || ('Rating ' + r.rating);
  const rating = el('span', { className: 'feedback-rating', style: { background: color + '22', color: color } }, label);
  const meta = el('div', { className: 'feedback-meta' }, [
    rating,
    el('span', { className: 'feedback-user' }, esc(r.user_email)),
    el('span', { className: 'feedback-project' }, esc(r.project_name)),
    el('span', { className: 'feedback-time' }, timeAgo(new Date(r.ts))),
  ]);
  return el('div', { className: 'feedback-item' }, [
    meta,
    el('div', { className: 'feedback-title' }, esc(r.title)),
    el('div', { className: 'feedback-desc' }, esc(r.description)),
  ]);
}

async function load(days) {
  currentDays = days;
  buildControls();

  const res = await fetch('/feedback/stats?days=' + days + '&token=' + encodeURIComponent(urlToken));
  if (!res.ok) {
    document.getElementById('stats').replaceChildren(emptyMsg('Unauthorized. Add ?token=YOUR_ADMIN_TOKEN to the URL.'));
    return;
  }
  const d = await res.json();

  const statsEl = document.getElementById('stats');
  const gridEl = document.getElementById('grid');
  statsEl.replaceChildren();
  gridEl.replaceChildren();

  const avgStr = d.avg !== null ? d.avg.toFixed(2) + ' / 4' : '-';
  [['Total Feedback', d.total], ['Average Rating', avgStr], ['Projects Heard From', d.byProject.length]]
    .forEach(([l, v]) => statsEl.appendChild(statCard(l, v)));

  const maxR = Math.max(...d.byRating.map(r => r.count), 1);
  const ratingContent = d.byRating.length
    ? el('div', null, d.byRating.map(r => barRow(RATING_LABELS[r.rating] || ('Rating ' + r.rating), r.count, maxR, RATING_COLORS[r.rating] || '#6366f1')))
    : emptyMsg();
  gridEl.appendChild(card('By Rating', ratingContent));

  const maxP = Math.max(...d.byProject.map(r => r.count), 1);
  const projContent = d.byProject.length
    ? el('div', null, d.byProject.map((r, i) => barRow(r.project_name, r.count, maxP, COLORS[i % COLORS.length], r.avg ? '(' + r.avg.toFixed(1) + ')' : '')))
    : emptyMsg();
  gridEl.appendChild(card('By Project', projContent));

  const recentContent = d.recent.length
    ? el('div', null, d.recent.map(feedbackItem))
    : emptyMsg();
  gridEl.appendChild(card('Recent Feedback', recentContent, 'full-width'));
}

buildControls();
load(90);
</script>
</body>
</html>`;

const start = async () => {
  const port = parseInt(process.env.PORT || '3000', 10);
  await fastify.listen({ port, host: '0.0.0.0' });
};

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
