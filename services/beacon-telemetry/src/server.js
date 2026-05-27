import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import ingestRoutes from './routes/ingest.js';
import adminRoutes from './routes/admin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VIEWS_DIR = join(__dirname, 'views');

const ADMIN_TOKEN = process.env.TELEMETRY_ADMIN_TOKEN || '';
const prisma = new PrismaClient();
const fastify = Fastify({ logger: true });

function checkAuth(request) {
  if (!ADMIN_TOKEN) return true;
  const header = request.headers['authorization'];
  const headerToken = header && header.startsWith('Bearer ')
    ? header.slice(7)
    : null;
  const token = request.query.token || headerToken;
  return token === ADMIN_TOKEN;
}

function loadView(name) {
  try {
    return readFileSync(join(VIEWS_DIR, name), 'utf8');
  } catch (err) {
    fastify.log.warn({ err, name }, 'view not found');
    return `<!doctype html><meta charset="utf-8"><title>${name}</title><pre>View ${name} missing.</pre>`;
  }
}

const dashboardHtml = loadView('dashboard.html');
const feedbackHtml = loadView('feedback.html');

fastify.get('/health', async () => ({ status: 'ok' }));

fastify.get('/', async (request, reply) => {
  if (!checkAuth(request)) {
    reply.code(401);
    return { error: 'unauthorized' };
  }
  reply.type('text/html');
  return reply.send(dashboardHtml);
});

fastify.get('/feedback', async (request, reply) => {
  if (!checkAuth(request)) {
    reply.code(401);
    return { error: 'unauthorized' };
  }
  reply.type('text/html');
  return reply.send(feedbackHtml);
});

fastify.register(ingestRoutes, { prisma });
fastify.register(adminRoutes, { prisma });

const start = async () => {
  const port = parseInt(process.env.PORT || '3000', 10);
  await fastify.listen({ port, host: '0.0.0.0' });
};

start().catch((err) => {
  fastify.log.error(err);
  process.exit(1);
});
