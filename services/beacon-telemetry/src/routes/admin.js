import * as q from '../lib/queries.js';

const ADMIN_TOKEN = process.env.TELEMETRY_ADMIN_TOKEN || '';

function checkAuth(request) {
  if (!ADMIN_TOKEN) return true;
  const header = request.headers['authorization'];
  const headerToken = header && header.startsWith('Bearer ')
    ? header.slice(7)
    : null;
  const token = request.query.token || headerToken;
  return token === ADMIN_TOKEN;
}

export default async function adminRoutes(fastify, opts) {
  const { prisma } = opts;

  const guard = async (request, reply) => {
    if (!checkAuth(request)) {
      reply.code(401).send({ error: 'unauthorized' });
      return reply;
    }
  };

  const route = (path, handler) => {
    fastify.get(path, { preHandler: guard }, handler);
  };

  route('/api/overview',    async (req) => q.overview(prisma, req.query.days));
  route('/api/funnel',      async (req) => q.funnel(prisma, req.query.days));
  route('/api/commands',    async (req) => {
    const group = req.query.group === 'true' || req.query.group === '1';
    return q.commands(prisma, req.query.days, group);
  });
  route('/api/tools_init',  async (req) => q.toolsInit(prisma, req.query.days));
  route('/api/users',       async (req) => q.users(prisma, req.query.days));
  route('/api/heatmap',     async (req) => q.heatmap(prisma, req.query.days));
  route('/api/recent',      async (req) => q.recent(prisma, req.query.limit));
  route('/feedback/recent', async (req) => q.feedbackRecent(prisma, req.query.limit));
  route('/feedback/stats',  async (req) => q.feedbackStats(prisma, req.query.days));
}
