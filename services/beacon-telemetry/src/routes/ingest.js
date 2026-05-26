import { verify } from '../lib/hmac.js';
import { checkRateLimit } from '../lib/rateLimit.js';

const ALLOWED_PLUGINS = new Set(['kai', 'kai-dev', 'mosaic-admin']);
const ALLOWED_EVENT_TYPES = new Set([
  'session_start',
  'command_invoked',
  'agent_spawned',
  'agent_completed',
  'tools_init_step',
  'feedback_submitted',
]);
const MAX_METADATA_BYTES = 1024;

export const legacyDroppedCount = { kai_legacy: 0, other: 0, mosaic_buddy: 0 };

function clamp(v, max) {
  if (v == null) return null;
  const s = String(v);
  return s.length > max ? s.slice(0, max) : s;
}

export default async function ingestRoutes(fastify, opts) {
  const { prisma } = opts;

  fastify.post('/v2/ingest', async (request, reply) => {
    const body = request.body || {};
    const {
      plugin, plugin_version, event_type, command, subcommand,
      user_local, project, session_id, os, ts, sig, metadata,
    } = body;

    if (typeof plugin !== 'string' || !plugin) {
      return reply.code(400).send({ error: 'plugin required' });
    }

    if (plugin === 'mosaic-buddy') {
      legacyDroppedCount.mosaic_buddy++;
      return reply.code(204).send();
    }

    if (!ALLOWED_PLUGINS.has(plugin)) {
      legacyDroppedCount.other++;
      return reply.code(204).send();
    }

    if (typeof event_type !== 'string' || !ALLOWED_EVENT_TYPES.has(event_type)) {
      return reply.code(400).send({ error: 'invalid event_type' });
    }
    if (typeof user_local !== 'string' || !user_local) {
      return reply.code(400).send({ error: 'user_local required' });
    }
    if (typeof project !== 'string' || !project) {
      return reply.code(400).send({ error: 'project required' });
    }

    if (!verify(plugin, event_type, user_local, ts, sig)) {
      return reply.code(403).send({ error: 'invalid signature or stale ts' });
    }

    if (!checkRateLimit(request.ip)) {
      return reply.code(429).send({ error: 'rate limited' });
    }

    let metadataValue = null;
    if (metadata !== undefined && metadata !== null) {
      const serialized = JSON.stringify(metadata);
      if (Buffer.byteLength(serialized, 'utf8') > MAX_METADATA_BYTES) {
        return reply.code(400).send({ error: 'metadata too large' });
      }
      metadataValue = metadata;
    }

    const subcommandValue = (subcommand == null ? '' : String(subcommand)).toLowerCase();

    try {
      await prisma.event.create({
        data: {
          plugin: clamp(plugin, 32),
          pluginVersion: clamp(plugin_version, 32),
          eventType: clamp(event_type, 32),
          command: command == null ? null : clamp(command, 32),
          subcommand: subcommandValue.slice(0, 80),
          userLocal: clamp(user_local, 64),
          project: clamp(project, 96),
          sessionId: session_id == null ? null : clamp(session_id, 64),
          os: os == null ? null : clamp(os, 16),
          metadata: metadataValue,
        },
      });
    } catch (err) {
      request.log.error({ err }, 'ingest write failed');
      return reply.code(500).send({ error: 'write failed' });
    }

    return reply.code(204).send();
  });

  fastify.post('/v2/feedback', async (request, reply) => {
    const body = request.body || {};
    const { rating, title, description, user_local, project, plugin_version, ts, sig } = body;

    const ratingInt = Number(rating);
    if (!Number.isInteger(ratingInt) || ratingInt < 1 || ratingInt > 4) {
      return reply.code(400).send({ error: 'rating must be integer 1-4' });
    }
    if (typeof title !== 'string' || !title.trim() || title.length > 200) {
      return reply.code(400).send({ error: 'title required, max 200 chars' });
    }
    if (typeof description !== 'string' || !description.trim() || description.length > 2000) {
      return reply.code(400).send({ error: 'description required, max 2000 chars' });
    }
    if (typeof user_local !== 'string' || !user_local) {
      return reply.code(400).send({ error: 'user_local required' });
    }
    if (typeof project !== 'string' || !project) {
      return reply.code(400).send({ error: 'project required' });
    }

    if (!verify('kai', 'feedback_submitted', user_local, ts, sig)) {
      return reply.code(403).send({ error: 'invalid signature or stale ts' });
    }

    if (!checkRateLimit(request.ip)) {
      return reply.code(429).send({ error: 'rate limited' });
    }

    try {
      await prisma.feedback.create({
        data: {
          rating: ratingInt,
          title: title.trim().slice(0, 200),
          description: description.trim().slice(0, 2000),
          userLocal: clamp(user_local, 64),
          project: clamp(project, 96),
          pluginVersion: plugin_version == null ? null : clamp(plugin_version, 32),
        },
      });
    } catch (err) {
      request.log.error({ err }, 'feedback write failed');
      return reply.code(500).send({ error: 'write failed' });
    }

    return reply.code(204).send();
  });

  // Legacy endpoints — Gone.
  const legacyHandler = async (request, reply) => {
    legacyDroppedCount.kai_legacy++;
    return reply.code(410).send({ error: 'upgrade to /v2/ingest' });
  };
  fastify.get('/t', legacyHandler);
  fastify.post('/beacon/telemetry', legacyHandler);
}
