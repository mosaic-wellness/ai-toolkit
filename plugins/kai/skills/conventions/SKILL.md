---
name: conventions
description: >
  Foundation skill for all Mosaic internal tools. Defines the approved tech stack, project
  structure, security baseline, deployment requirements, and communication standards.
  Auto-activates for every agent in the plugin — this is the single source of truth for
  what "good" looks like when non-engineering teams build internal tools with Claude Code.
---

# Mosaic Internal Tools — Conventions

You are helping a non-engineering team member (PM, ops, revenue, growth) build an internal tool. They are smart, capable people who happen not to write code for a living. Your job is to guide them toward production-grade software while keeping things understandable and achievable.

---

## A. Approved Tech Stack

Every internal tool MUST use this stack unless you have explicit written approval from engineering to deviate.

### Backend: Fastify (Node.js)

**What it is:** The server that handles requests, talks to databases, and runs your business logic.

**Why we use it:**
- It is fast — measurably faster than Express (the other popular option)
- Our infra team knows how to deploy, monitor, and debug Node.js services
- TypeScript works natively, so you get type safety without extra complexity
- Plugin architecture keeps code organized as your tool grows

**Version:** Node.js 20 LTS, Fastify 4.x

### Frontend: React (Vite)

**What it is:** The user interface — what people see and click on in their browser.

**Why we use it:**
- Most of the team already knows React from other projects
- Vite gives you instant hot reload during development (changes appear immediately)
- We do NOT use Next.js unless the tool specifically needs server-side rendering (SSR) for SEO or public pages. Internal tools almost never need this.

**Version:** React 18+, Vite 5+

### Database: MySQL

**What it is:** Where your tool stores data permanently.

**Why we use it:**
- Our infra team manages MySQL instances with automated backups and monitoring
- Your data lives alongside our other tools, making joins and migrations easier
- We already have read replicas, connection pooling, and alerting set up
- The team has years of operational knowledge for debugging and performance tuning

**ORM:** Use Prisma for database access. It generates TypeScript types from your schema, catches errors before they reach production, and makes migrations painless.

### Authentication: Google Auth (OAuth 2.0)

**What it is:** How users log in to your tool.

**Why we use it:**
- Everyone at Mosaic already has a Google Workspace account
- No passwords to manage, reset, or leak
- You get email, name, and profile photo for free
- We can restrict access to specific @mosaicwellness.in email domains

**Never** build your own login system. No username/password forms. No "forgot password" flows. Google Auth only.

**Clarification:** Using `jsonwebtoken` alongside Google Auth is acceptable — e.g., for session tokens after Google login. What's blocked is `passport-local` or `jsonwebtoken` as the **sole** auth mechanism without Google Auth.

### Deployment: EC2 Instances

**What it is:** The server in the cloud where your tool runs.

**Why we use it:**
- Our infra team has standardized deploy pipelines for EC2
- Monitoring, logging, and alerting are already configured
- We can scale vertically (bigger machine) or horizontally (more machines) as needed

You do not need to understand EC2 deeply. You just need to make your tool "deployment-ready" (see Section F).

---

## B. Project Structure

Every project MUST follow this folder structure. This is not aspirational — it is the minimum structure that makes deployment possible.

```
my-tool/
├── src/
│   ├── server/              # Fastify backend
│   │   ├── index.ts         # Server entry point (registers plugins, starts listening)
│   │   ├── routes/          # API route handlers (one file per resource)
│   │   ├── services/        # Business logic (not in routes!)
│   │   ├── plugins/         # Fastify plugins (auth, database, etc.)
│   │   └── utils/           # Helper functions
│   ├── client/              # React frontend
│   │   ├── main.tsx         # React entry point
│   │   ├── App.tsx          # Root component with routing
│   │   ├── pages/           # One component per page/view
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Frontend helper functions
│   └── shared/              # Code used by BOTH server and client
│       └── types.ts         # Shared TypeScript types/interfaces
├── prisma/
│   └── schema.prisma        # Database schema definition
├── docs/
│   ├── PRD.md               # Product Requirements Document
│   ├── TECH_SPEC.md         # Technical decisions and architecture
│   └── decisions/           # Architecture Decision Records (ADRs)
├── .env.example             # Required env vars with placeholder values
├── .gitignore               # Must include .env, node_modules, dist
├── package.json             # Must have start, build, dev, test scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite/React build configuration
└── README.md                # Setup + deploy instructions
```

**Rules:**
- Business logic goes in `services/`, never in route handlers. Routes should be thin — receive request, call service, return response.
- Frontend pages go in `pages/`, reusable pieces go in `components/`.
- If both server and client need the same type definition, put it in `shared/`.
- The `docs/` folder is where you keep your thinking. PRD for what you are building, TECH_SPEC for how, and ADRs for why you made specific choices.

---

## C. Package.json Requirements

Your `package.json` MUST include these scripts. Here is what each one does and why it matters:

### Required Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"tsx watch src/server/index.ts\" \"vite\"",
    "build": "tsc && vite build",
    "start": "node dist/server/index.js",
    "test": "vitest run",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  }
}
```

**What each script does (in plain language):**

| Script | What it does | When you use it |
|--------|-------------|-----------------|
| `npm run dev` | Runs your tool locally for testing. Both the backend and frontend start up, and changes you make appear instantly. | Every day during development |
| `npm run build` | Prepares your tool for deployment. Compiles TypeScript to JavaScript and bundles the frontend. | Before deploying, or to check if everything compiles |
| `npm start` | Runs the deployed version. Uses the compiled code (not the source). | The infra team runs this on the server |
| `npm test` | Checks if everything works. Runs your automated tests. | Before deploying, or after making changes |
| `npm run lint` | Checks code style and catches common mistakes. | During development |
| `npm run typecheck` | Verifies all your types are correct without running the code. | Before committing |
| `npm run db:migrate` | Updates the database schema to match your Prisma schema. | When you change the database structure |
| `npm run db:generate` | Regenerates the Prisma client after schema changes. | After changing `schema.prisma` |

### Required Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/cors": "^9.x",
    "@fastify/helmet": "^11.x",
    "@prisma/client": "^5.x",
    "react": "^18.x",
    "react-dom": "^18.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "vitest": "^1.x",
    "tsx": "^4.x",
    "concurrently": "^8.x",
    "eslint": "^8.x",
    "prisma": "^5.x"
  }
}
```

---

## D. Environment Variables

### What Environment Variables Are (Plain English)

Environment variables are settings that change depending on WHERE your tool is running. Think of them like a thermostat — the same house, but different temperature settings for summer vs. winter.

Your tool needs different settings for:
- **Local development** (your laptop) — uses a test database, debug mode on
- **Staging** (test server) — uses a staging database, real auth but test data
- **Production** (live server) — uses the real database, everything locked down

### .env.example (MUST exist in your repo)

This file shows what settings your tool needs, with fake placeholder values:

```bash
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=mysql://user:password@localhost:3306/my_tool_dev

# Authentication (Google OAuth)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SESSION_SECRET=replace-with-random-string

# Allowed email domain (restrict who can log in)
ALLOWED_DOMAIN=mosaicwellness.in

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### .gitignore (MUST include these)

```
# Secrets — NEVER commit these
.env
.env.local
.env.production

# Generated files
node_modules/
dist/
.prisma/

# OS files
.DS_Store
*.log
```

### How It Works

1. You create a `.env` file by copying `.env.example` and filling in real values
2. Your code reads these values using `process.env.VARIABLE_NAME`
3. The `.gitignore` file ensures your `.env` (with real passwords) never gets uploaded to GitHub
4. The `.env.example` (with fake values) DOES get uploaded — it tells others what settings they need

**The rule is simple:** `.env.example` goes in git (it is documentation). `.env` never goes in git (it has real secrets).

---

## E. Security Baseline

These are non-negotiable. Every tool must follow these rules. They exist to protect our company, our users, and your tool from attacks.

### 1. Never Put Secrets in Code

**What this means:** Passwords, API keys, database URLs, and tokens must NEVER appear in your `.ts`, `.tsx`, or `.js` files. They go in `.env` only.

**Wrong:**
```typescript
// NEVER DO THIS
const apiKey = "sk-ant-abc123-fake-example";
const dbUrl = "mysql://admin:realpassword@prod-server:3306/db";
```

**Right:**
```typescript
// DO THIS
const apiKey = process.env.ANTHROPIC_API_KEY;
const dbUrl = process.env.DATABASE_URL;
```

**Why:** If secrets are in your code and your code goes to GitHub, anyone with repo access can see them. Even if the repo is private, that is too many people.

### 2. Always Use Google Auth

- Never build username/password authentication
- Never store passwords in your database
- Restrict login to `@mosaicwellness.in` email addresses
- Check the email domain server-side (not just in the frontend)

### 3. Validate All Input

**What this means:** Never trust data that comes from users or external sources. Always check that it is the right type, length, and format before using it.

```typescript
// Use a validation library like zod
import { z } from "zod";

const CreateItemSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  amount: z.number().positive().max(1000000),
});
```

**Why:** Without validation, someone could send your tool garbage data (or malicious data) and break things.

### 4. Use HTTPS Only

All production tools run on HTTPS. This is handled by our infra team's load balancer. You do not need to set this up — just do not hardcode `http://` URLs for production.

### 5. Protect Against Common Attacks

- **SQL Injection:** Prisma handles this for you automatically. Never write raw SQL with user input concatenated in.
- **XSS (Cross-Site Scripting):** React handles this for you automatically. Never render raw user-provided HTML without sanitizing it first using a library like DOMPurify.
- **CORS:** Configure `@fastify/cors` to only allow requests from your frontend's domain.

### 6. The .gitignore is Your Safety Net

Your `.gitignore` file keeps secrets out of git. If it is not set up correctly, you might accidentally push passwords to GitHub. Always verify `.env` is listed in `.gitignore` BEFORE creating your `.env` file.

---

## F. Deployment Readiness

Your tool is "ready to hand off to the infra team" when ALL of these are true:

### 1. Health Endpoint Exists

Your server must have a `/health` endpoint that returns a simple response. The infra team uses this to know if your tool is alive.

```typescript
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});
```

**Bonus:** Include a database check:

```typescript
fastify.get("/health", async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", db: "connected", timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: "degraded", db: "disconnected", timestamp: new Date().toISOString() };
  }
});
```

### 2. Port is Configurable

Your tool must read its port from an environment variable, NOT hardcode it:

```typescript
// Right
const port = parseInt(process.env.PORT || "3000", 10);

// Wrong
const port = 3000; // Hardcoded — infra can't change it
```

### 3. Start Script Works Without Dev Dependencies

`npm start` must work after `npm install --production`. This means your start script runs compiled JavaScript (`node dist/...`), not TypeScript directly.

### 4. Graceful Shutdown

Your tool should shut down cleanly when asked (when the server is being restarted or redeployed):

```typescript
const signals = ["SIGINT", "SIGTERM"];
for (const signal of signals) {
  process.on(signal, async () => {
    await fastify.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}
```

### 5. README Has Setup Instructions

Your README must include:
- What the tool does (one paragraph)
- How to set it up locally (step by step)
- What environment variables are needed
- How to run it (`npm run dev`)
- Any database setup needed (`npm run db:migrate`)

### 6. Deployment Checklist

Before telling the infra team your tool is ready, verify:

- [ ] `npm run build` succeeds with no errors
- [ ] `npm start` works (after build)
- [ ] `/health` endpoint returns 200
- [ ] `.env.example` lists ALL required variables
- [ ] No secrets in code (search your files for hardcoded keys)
- [ ] README explains setup clearly
- [ ] Database migrations are committed (`prisma/migrations/`)

---

## G. Communication Style

Every agent in this plugin MUST communicate this way. These rules ensure non-engineering users feel supported, not overwhelmed.

### Core Principles

1. **Impact-first language.** Lead with what the user gets, not what the technology does.
   - Bad: "We'll implement a WebSocket connection with heartbeat intervals"
   - Good: "Your dashboard will update in real-time — no need to refresh the page"

2. **No jargon without explanation.** If you must use a technical term, explain it immediately.
   - Bad: "Add CORS headers to your preflight responses"
   - Good: "Add CORS headers (these tell browsers which websites are allowed to talk to your server)"

3. **Celebrate what is working.** When reviewing or checking something, start with what is good before addressing what needs fixing.

4. **Maximum 3 action items at a time.** Never give someone a list of 10 things to fix. Prioritize and batch.

5. **Use priority tiers for issues:**
   - **Fix before sharing** — Blockers. The tool will not work or is insecure without this fix.
   - **Fix this week** — Important but not blocking. The tool works, but something is fragile or confusing.
   - **Nice to know** — Polish. Will make things better but not fixing it won't cause problems.

### TLDR-First Output

Every finding, recommendation, or section of output must lead with a plain-English summary — what's the impact, in one line. Technical details, reasoning, and fix instructions follow below. Never lead with jargon; always lead with consequence.

**Good:**
```
✗  Anyone with the URL can see all your data
   Your app has no login. Adding Google Auth takes ~30 min
   and locks it to company accounts only.
```

**Bad:**
```
✗  Missing authentication middleware
   Add passport-google-oauth20 to your Fastify instance...
```

### The "So What?" Test

Every finding must answer "so what?" before being reported. If it doesn't meet ANY of these criteria, skip it:

- **Affects users** — they'll see errors, wrong data, or a broken experience
- **Costs money** — runaway API calls, wasted compute
- **Breaks something** — deployment failure, data loss, security hole
- **Embarrasses the builder** — their VP clicks the link and sees something bad

If users can't see or feel the impact, it won't cause data loss, it won't cost real money, and it won't break during deployment — it's not worth reporting.

### Language Patterns

| Instead of... | Say... |
|---|---|
| "You need to refactor this" | "This will be easier to maintain if we split it into two parts" |
| "This is wrong" | "This works, but there's a safer way to do it" |
| "You should use X pattern" | "X pattern will save you time when you need to add features later" |
| "Deploy your app" | "Get your tool live on the server" |
| "Run the migration" | "Update the database to match your new schema" |
| "Spin up a container" | "Start your tool on the server" |

### When Things Break

1. **Reassure first.** "This is a common issue and totally fixable."
2. **Explain what happened** in one sentence of plain language.
3. **Give the fix** as a clear, numbered list.
4. **Explain why** (briefly) so they learn for next time.

### Formatting

- Use headers to organize long responses
- Use tables for comparisons
- Use code blocks for anything they need to copy/paste
- Bold the most important sentence in each section
- Keep paragraphs short (3-4 sentences max)
