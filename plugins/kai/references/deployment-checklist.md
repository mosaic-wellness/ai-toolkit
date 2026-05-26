# Deployment Checklist

> Every item on this list represents something that has caused a real outage or deployment failure. None of it is theoretical.

Run through this before handing off to infra or sharing the URL with users.

---

## 1. Health Endpoint

**What it is:** A GET endpoint at `/health` that returns a simple JSON response. Infra load balancers, monitoring tools, and uptime checkers ping this URL to know if your app is alive.

**Requirements:**
- Path: `GET /health`
- No authentication required (monitoring tools don't have your session token)
- Returns `{ "status": "ok" }` at minimum
- Responds in under 1 second (if it takes longer, the health check times out and marks your app as down)
- Optional: include a DB connectivity check so monitoring catches DB connection failures too

**Implementation:**

```typescript
// Basic health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// With optional DB check
fastify.get('/health', async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'connected' };
  } catch (err) {
    reply.status(503);
    return { status: 'error', db: 'disconnected' };
  }
});
```

**What breaks without it:** Infra can't tell if your app is running. If your process crashes silently, nobody knows until a user reports it.

---

## 2. Port Configuration

**What it is:** The network port your server listens on. EC2 deployments route traffic to your app via a port — if you hardcode the wrong one or listen on the wrong address, the app is unreachable.

**Requirements:**
- Read port from `process.env.PORT` with a default fallback
- **Listen on `0.0.0.0`** — this means "accept connections on all network interfaces." If you listen on `127.0.0.1` (localhost), your server is only reachable from within the same machine. External traffic (including from infra's load balancer) will be refused.

**Implementation:**

```typescript
const PORT = parseInt(process.env.PORT || '3000', 10);

await fastify.listen({
  port: PORT,
  host: '0.0.0.0',  // CRITICAL: not '127.0.0.1' or 'localhost'
});

console.log(`Server running on port ${PORT}`);
```

**What breaks without it:** App starts successfully on EC2, but every request from the outside world gets "connection refused." The app appears to work when tested locally but is completely inaccessible in production.

---

## 3. Process Management

**What it is:** A system that monitors your Node.js process and restarts it automatically if it crashes. Without this, one unhandled exception kills your app and it stays dead until someone manually restarts it.

**Option A — PM2 (recommended for most tools):**

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-tool',
    script: 'dist/server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
    },
    env_production: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/my-tool/error.log',
    out_file: '/var/log/my-tool/out.log',
  }],
};
```

Deploy commands:
```bash
pm2 start ecosystem.config.js --env production
pm2 save        # persist process list across reboots
pm2 startup     # generate startup script for the OS
```

**Option B — systemd (if PM2 isn't available):**

```ini
# /etc/systemd/system/my-tool.service
[Unit]
Description=My Internal Tool
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/var/www/my-tool
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=5
EnvironmentFile=/var/www/my-tool/.env

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable my-tool
sudo systemctl start my-tool
```

**What breaks without it:** App crashes once, stays down until someone manually restarts it. Users get "connection refused." You find out from a Slack message.

---

## 4. Graceful Shutdown

**What it is:** Signal handlers that let your app finish what it's doing before exiting. When infra deploys a new version or reboots the server, they send a SIGTERM signal. Without handling it, requests that are mid-flight get cut off — users lose their work.

**Implementation:**

```typescript
const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    // Stop accepting new requests
    await fastify.close();

    // Disconnect from database
    await prisma.$disconnect();

    console.log('Shutdown complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C in terminal
process.on('SIGTERM', () => shutdown('SIGTERM')); // PM2/systemd stop signal
```

**What breaks without it:** During deployments, users mid-request see errors or lose data. Prisma connections aren't released cleanly, which can cause connection pool exhaustion on the new process.

---

## 5. Environment Variables

**What it is:** Configuration values (database URLs, API keys, OAuth credentials) that live outside your code. Your `.env.example` file is the contract — it lists every variable your app reads, without actual values.

**Golden rule:** If the code reads it, `.env.example` has it.

**Example `.env.example`:**
```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=mysql://user:password@localhost:3306/myapp

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# Session
SESSION_SECRET=your-random-secret-here

# Anthropic (if using AI features)
ANTHROPIC_API_KEY=sk-ant-...

# Email (if sending notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@mosaicwellness.in
SMTP_PASS=your-app-password
```

**What breaks without it:** Infra can't deploy without knowing what variables to set. You'll get runtime errors in production from undefined env vars that worked fine locally because you had a `.env` file they don't have.

---

## 6. Start Script

**What it is:** The command infra runs to start your app in production. It must work after a fresh `npm install --production` (which skips devDependencies).

**Requirements:**
- `package.json` scripts section must include:
  ```json
  {
    "scripts": {
      "build": "tsc",
      "start": "node dist/server/index.js",
      "dev": "tsx watch src/server/index.ts"
    }
  }
  ```
- `start` runs compiled JavaScript — never `ts-node` or `tsx` in production (they're devDependencies)
- Build step runs before start: `npm run build && npm start`
- If using Prisma, generate the client during build: `prisma generate && tsc`

**Full deploy sequence:**
```bash
git pull origin main
npm install --production
npm run build
pm2 restart ecosystem.config.js --env production
```

**What breaks without it:** `npm start` fails with "Cannot find module 'ts-node'" or runs uncompiled TypeScript that doesn't work in plain Node.js.

---

## 7. Static Asset Serving

**What it is:** In production, your Fastify server serves the compiled React frontend (the `dist/client/` folder from `npm run build`). In development, Vite serves the frontend separately. Production must handle this correctly.

**Requirements:**
- Serve static files from the Vite build output directory
- SPA fallback: any request that isn't an API route (`/api/...`) or a file that exists should return `index.html` — this lets React Router handle client-side navigation

**Implementation:**

```typescript
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.join(__dirname, '../../client/dist');

// Serve static files
await fastify.register(import('@fastify/static'), {
  root: clientDistPath,
  prefix: '/',
});

// SPA fallback — must come AFTER API routes
fastify.setNotFoundHandler((request, reply) => {
  // Let API 404s through
  if (request.url.startsWith('/api/')) {
    reply.status(404).send({ error: 'Not found' });
    return;
  }
  // Send index.html for all other routes (React Router handles them)
  reply.sendFile('index.html');
});
```

**What breaks without it:** Navigating directly to `/dashboard` or `/users/123` returns a 404 because Fastify doesn't know about those routes (React Router does). Users can only access the app by navigating to `/` first.

---

## 8. Log Management

**What it is:** Structured application logs that capture what your app is doing, what errors occur, and who did what. Fastify comes with Pino built in — a fast, structured logger that writes JSON in production (machine-readable for log aggregation) and pretty-printed text in development (human-readable).

**Configuration:**

```typescript
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'production'
      ? undefined  // JSON output — infra log aggregators parse this
      : {
          target: 'pino-pretty',
          options: { colorize: true },
        },
  },
});
```

**Logging guidelines:**
- Log at `info` level: successful operations, requests, key business events
- Log at `warn` level: recoverable errors, auth failures, unexpected but handled states
- Log at `error` level: unhandled exceptions, database failures, crashes
- **Never log secrets** — passwords, API keys, session tokens, even in error messages

**Bad:**
```typescript
fastify.log.info({ apiKey: process.env.ANTHROPIC_API_KEY }, 'Making AI call');
```

**Good:**
```typescript
fastify.log.info({ userId: user.id, feature: 'ai-summary' }, 'Making AI call');
```

**What breaks without it:** When the app crashes or behaves wrong, you have no record of what happened. Debugging is guessing.

---

## 9. Memory Limits

**What it is:** Configuration that prevents your app from consuming all available RAM on the EC2 instance and crashing it (taking down every other process with it).

**PM2 memory limit:**
```javascript
// In ecosystem.config.js
max_memory_restart: '500M',  // PM2 restarts the process if it exceeds 500MB
```

**Request body size limits (Fastify):**
```typescript
const fastify = Fastify({
  bodyLimit: 1 * 1024 * 1024,  // 1MB body limit for API requests
});
```

**File upload limits:**
```typescript
// If using @fastify/multipart for file uploads
await fastify.register(import('@fastify/multipart'), {
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB per file
    files: 1,                    // max 1 file per request
  },
});
```

**What breaks without it:** One user uploads a 500MB file and your server freezes for everyone. A memory leak causes the process to slowly consume all RAM over 3 days until the instance becomes unresponsive.

---

## 10. Common Pitfalls

| # | Pitfall | What happens | Fix |
|---|---------|-------------|-----|
| 1 | Listening on `127.0.0.1` instead of `0.0.0.0` | App starts but is completely inaccessible from outside. Every request gets "connection refused." | Change `host` to `'0.0.0.0'` in `fastify.listen()` |
| 2 | Hardcoded `localhost` in frontend API calls | App works in development. In production, browser tries to call `localhost:3000` on the user's computer (not your server). All API calls fail. | Use relative URLs (`/api/users`) or an environment variable for the API base URL |
| 3 | Running `npm start` without a build step | `dist/` folder doesn't exist or is stale. Node throws "Cannot find module './dist/server/index.js'". | Always run `npm run build` before `npm start` in deployment scripts |
| 4 | devDependencies in the start command | `tsx`, `ts-node`, `nodemon` aren't installed after `npm install --production`. Start command fails. | `npm start` must use plain `node`, not `tsx` or `ts-node` |
| 5 | Wrong Node.js version | Syntax errors from features not available in older Node, or compatibility issues with newer ones. | Set `.nvmrc` or `.node-version` to `20`. Infra uses this to install the right version. |
| 6 | Missing `prisma generate` in build | Prisma Client isn't generated from the schema. All database calls throw "PrismaClient is not generated." | Add `prisma generate` before `tsc` in the build script: `"build": "prisma generate && tsc"` |
| 7 | `.env` not copied to server | All environment variables are `undefined` in production. App crashes on startup or behaves incorrectly. | Copy `.env` to the server manually or use infra's secrets management. `.env` is never committed to git. |
| 8 | Port conflict | Another process is already using port 3000 (or whatever port you chose). App fails to start with "EADDRINUSE". | Use `process.env.PORT` so infra can assign a free port. Or check `lsof -i :3000` to see what's using the port. |
| 9 | No log rotation | Log files grow forever. After a few months, disk fills up. EC2 runs out of space and everything stops working. | Configure PM2 log rotation: `pm2 install pm2-logrotate` and set max size. Or use `logrotate` in systemd setups. |
| 10 | No health check endpoint | Infra monitoring can't verify the app is running. Silent crashes go undetected for hours. Automated restarts don't work. | Implement `GET /health` returning `{ status: 'ok' }` before deployment (see item 1 above). |
