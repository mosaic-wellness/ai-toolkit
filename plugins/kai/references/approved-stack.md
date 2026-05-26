# Approved Stack

> These are the only technology choices that have infra support, team familiarity, and a clear deployment path. Deviating from this list means you're on your own when something breaks.

---

## 1. Fastify (Node.js 20 LTS, Fastify 4.x)

### What it is
The server framework that handles HTTP requests, routes them to your business logic, calls the database, and sends back responses. Every API endpoint your frontend calls goes through Fastify.

### Why we chose it
- **Measurably faster than Express** — benchmarks show 2-3x more requests/second at the same load. Not that you'll need it at 15 users, but fast also means less CPU per request, meaning your EC2 stays responsive under burst traffic (e.g., Monday morning when everyone opens the tool at once).
- **Infra team knows it** — when something breaks in production, the person helping you debug it has Fastify experience. This matters more than benchmarks.
- **TypeScript native** — Fastify's type system catches route handler mistakes at compile time, not at 11 PM when a user reports a broken page.
- **Plugin architecture** — authentication, database, logging all register as plugins. Code stays organized without complex abstractions.

### What it means for you
You write route handlers. Fastify handles the HTTP plumbing. You get a fast server that the infra team can deploy, monitor, and debug without you needing to explain it.

### What NOT to use

| Framework | Why it's blocked |
|-----------|-----------------|
| **Express** | Not supported by infra. When you need deployment help, they'll be unfamiliar with your setup. Switching mid-project is painful. |
| **Hono** | Infra team is not familiar with it. Same deployment friction problem as Express. |
| **Nest.js** | Massive framework designed for large engineering teams. Adds decorators, dependency injection, module systems — none of which you need for an internal tool. The concepts alone will slow down Claude Code significantly. |
| **Koa** | Limited ecosystem, fewer maintained plugins, smaller community for troubleshooting. |

### Version requirements
- Node.js: **20 LTS** (never use odd-numbered versions — they're not LTS)
- Fastify: **4.x** (not 3.x — missing TypeScript improvements; not 5.x until infra approves it)

---

## 2. React + Vite (React 18+, Vite 5+)

### What it is
React is the UI framework — you build components (a button, a table, a form) and React handles updating the page when data changes. Vite is the build tool — it compiles your React code into files the browser can run, and gives you instant hot reload during development (change a file, see it update in the browser in under a second).

### Why we chose it
- **Team familiarity** — React is the most widely known frontend framework. When you ask Claude Code to build a UI component, it produces better React than anything else because of how much React code is in its training data.
- **Fast dev loop** — Vite's hot reload is genuinely instant. Webpack (the old alternative) takes 5-30 seconds to rebuild. Vite takes under 200ms. Over a day of development, that difference is hours.
- **Large ecosystem** — every UI component library, charting library, and utility you'll ever need has a React version.

### What it means for you
Run `npm run dev` and your browser updates instantly as you code. Run `npm run build` and you get a `dist/` folder ready to serve from your EC2.

### What NOT to use

| Framework/Tool | Why it's blocked |
|----------------|-----------------|
| **Next.js** | Only justified if you need server-side rendering (SEO, public pages). Internal tools never need SEO. Next.js adds a deployment model that doesn't match a simple EC2 setup and requires understanding the App Router vs Pages Router distinction — unnecessary complexity. |
| **Vue** | The team doesn't know it. Claude Code knows React significantly better. If you start in Vue, every AI-generated component needs more review. |
| **Angular** | Extremely heavy framework. 5-10x more boilerplate than React for the same feature. Designed for large teams with strict conventions. |
| **jQuery** | Legacy. No component model — you're manipulating the DOM directly, which means no reusable components, no state management, difficult to maintain with Claude Code. |

### Version requirements
- React: **18+** (concurrent rendering, modern hooks)
- Vite: **5+** (Rollup 4 bundler, faster builds)

---

## 3. MySQL + Prisma (MySQL 8.0+, Prisma 5.x)

### What it is
MySQL is the database — it stores all your tool's data persistently. Prisma is the ORM (Object-Relational Mapper) — it's the layer between your Node.js code and MySQL that lets you write `prisma.user.findMany()` instead of raw SQL. Prisma also generates TypeScript types from your database schema, so your editor catches typos in column names before they cause runtime errors.

### Why we chose it
- **Infra-managed** — the MySQL instance is provisioned, backed up nightly, monitored for disk space, and has alerting already configured. You don't manage any of this.
- **Backups exist** — if your EC2 dies, your data doesn't. This is not true for SQLite.
- **Prisma gives you TypeScript types** — `prisma.user.findMany({ where: { emal: 'x' }})` is a compile-time error (typo in `email`). Raw SQL would silently return wrong results.
- **Migration system** — `npx prisma migrate dev` generates SQL migration files. You have a history of every schema change. Rolling back is possible.
- **SQL injection protection** — Prisma uses parameterized queries by default. You can't accidentally write an injection vulnerability.

### What it means for you
Define your schema in `schema.prisma`, run `npx prisma migrate dev`, and you have a typed database client. No manual SQL, no migration scripts to write, no injection vulnerabilities.

### What NOT to use

| Choice | Why it's blocked |
|--------|-----------------|
| **SQLite** | Data lives on your EC2's local disk. If the instance is replaced, data is gone. No backups. No infra monitoring. Fine for prototyping, not for a tool people depend on. |
| **PostgreSQL** | Infra manages MySQL, not Postgres. You'd be running an unmanaged database with no backups, no monitoring, no support. |
| **MongoDB** | No relations between data — as soon as you need to connect users to records, you're doing it manually in code. Schema chaos: data shape drifts over time with no enforcement. |
| **Raw SQL** | SQL injection risk (if you ever concatenate user input into a query). No TypeScript types. No migration history. Hard for Claude Code to maintain safely. |
| **Sequelize** | Older ORM with much worse TypeScript support than Prisma. Types are often `any`. Harder to introspect schema. |

### Version requirements
- MySQL: **8.0+** (JSON column support, improved performance)
- Prisma: **5.x** (improved relation queries, better TypeScript inference)

---

## 4. Google Auth (OAuth 2.0)

### What it is
The login system for your tool. Instead of a username/password form, users click "Sign in with Google" and use their existing company Google account. Your tool never sees or stores their password — Google handles authentication and tells your app "this person is who@mosaicwellness.in."

### Why we chose it
- **Everyone already has it** — no new accounts to create, no passwords to remember, no "forgot password" flows to build.
- **No passwords to manage** — you don't store passwords, so you can't leak them. No breach liability, no password reset emails, no expired passwords locking people out.
- **Domain restriction** — you configure Google Auth to only accept `@mosaicwellness.in` emails. Anyone outside the company cannot log in, even if they try.
- **Session management is simple** — after Google login, issue a short-lived JWT for your session. Standard, auditable, easy to invalidate.

### What it means for you
Users log in with one click. You never touch passwords. You restrict access to your company domain in one line of config.

### What NOT to use

| Choice | Why it's blocked |
|--------|-----------------|
| **passport-local** | You're building login from scratch — password hashing, salting, storage, reset emails, account lockout, breach detection. All of that liability is now yours. |
| **Custom JWT as primary auth** | Same problems as passport-local. You still need to issue credentials, store them, and handle all edge cases. |
| **Magic links** | Adds email delivery complexity (SMTP setup, deliverability issues, spam filters). Unnecessary when Google Auth is simpler and already available. |
| **Auth0** | A paid third-party service. Adds a vendor dependency and monthly cost for a problem that Google Auth solves for free. |

**Note:** Using `jsonwebtoken` alongside Google Auth is fine and recommended — issue a JWT after successful Google login to manage your app session. The blocklist applies to using JWT as the *primary* authentication mechanism (replacing Google login).

### Version requirements
- Use `google-auth-library` (official Google SDK) or `passport-google-oauth20`
- JWT: `jsonwebtoken` 9.x

---

## 5. EC2 (Standard infra provision)

### What it is
The cloud server where your tool runs. Infra provisions an EC2 instance for your project — a virtual Linux server running in AWS that your tool is deployed to and that users access via a URL.

### Why we chose it
- **Infra team manages it** — standardized deployment pipeline, OS updates, security patches, disk monitoring, and alerting are already configured before you get the instance.
- **Already integrated** — monitoring, logging, and alerting connect to existing infrastructure. When your app crashes, someone knows.
- **Simple mental model** — it's a server. Your app runs on it. SSH in if needed. No abstraction layers to learn.
- **Persistent storage** — unlike serverless, your file system and in-memory state persist between requests. Simpler programming model.

### What it means for you
You get an IP, a domain, and SSH access. Deploy with `git pull && npm run build && pm2 restart`. The server stays up, gets monitored, and gets backed up by infra.

### What NOT to use

| Platform | Why it's blocked |
|----------|-----------------|
| **Vercel** | Not supported by infra. Deployment, monitoring, and alerting pipelines don't connect to it. You're on your own if it breaks. Also: Vercel's model is designed for Next.js/serverless, not a Fastify API server. |
| **Lambda** | Serverless: different programming model (no persistent state, cold starts, 15-minute execution limit). Requires understanding AWS IAM, API Gateway, Lambda layers. Significant complexity for an internal tool. |
| **Docker** | An unnecessary wrapper for one app on one server. Adds a container runtime, image builds, and registry management — none of which solve a problem you have. |
| **Heroku** | Not supported by infra. Different deployment pipeline, different monitoring, different everything. |

### Version requirements
- EC2 instance type: as provisioned by infra (typically t3.small or t3.medium)
- OS: Ubuntu 22.04 LTS (infra standard)
- Node.js: 20 LTS (installed via nvm or nodesource)

---

## 6. @anthropic-ai/sdk (TypeScript) / anthropic (Python)

### What it is
The official SDK for calling Claude's API from your code. Instead of manually constructing HTTP requests to `api.anthropic.com`, you use the SDK which handles authentication, request formatting, retries, streaming, and error handling.

### Why we chose it
- **Official** — maintained by Anthropic. When the API changes, the SDK is updated first.
- **TypeScript types** — every API parameter and response field is typed. Your editor catches mistakes before they cause runtime errors.
- **Built-in retries** — the SDK automatically retries on transient errors (rate limits, network blips) with exponential backoff. Without this, you'd write it yourself or leave it out (causing occasional failures).
- **Streaming support** — if you want to stream Claude's response token-by-token (so users see text appearing as it generates), the SDK handles the SSE connection for you.
- **Error handling** — API errors are typed exceptions you can catch specifically, not generic HTTP errors you have to parse manually.

### What it means for you
`import Anthropic from '@anthropic-ai/sdk'`, create a client, call `client.messages.create()`. The SDK handles everything else.

### What NOT to use

| Choice | Why it's blocked |
|--------|-----------------|
| **LangChain** | A heavy abstraction layer over LLM APIs. Hides what's actually happening (which model, which prompt, which parameters). When something breaks or costs too much, it's hard to trace why. For simple tool-calling and chat, the Anthropic SDK is always cleaner. |
| **OpenAI SDK** | Wrong provider. The OpenAI SDK targets OpenAI's API, not Anthropic's. They're different APIs with different models and parameters. |
| **Direct HTTP requests** | You'd need to implement authentication headers, retry logic, error parsing, and streaming yourself. Every piece of that is already in the SDK. |
| **Frontend API calls** | Your Anthropic API key would be visible in the browser's network tab. Anyone with browser dev tools could read it and use it at your cost. API calls always go through your backend. |

### Version requirements
- TypeScript: `@anthropic-ai/sdk` **0.20+**
- Python: `anthropic` **0.25+**
- Always pin to a minor version in `package.json` (`"@anthropic-ai/sdk": "^0.20.0"`) and update intentionally
