# Anti-Patterns

> These are patterns that look reasonable in isolation but cause real problems: slow pages, broken UIs, database meltdowns, and code that Claude Code struggles to maintain. Each one has a name, a signature, and a fix.

---

## Category 1: AI Slop Indicators

These patterns appear when an LLM generates code without understanding the actual requirements. They look complete but add complexity with zero benefit. When you see these, delete them — they make the codebase harder to maintain, not easier.

---

### 1. Over-Engineered Abstractions

**What it looks like:**
```typescript
// Generated for an app with ONE database table
abstract class BaseRepository<T, ID> {
  abstract findById(id: ID): Promise<T | null>;
  abstract findAll(): Promise<T[]>;
  abstract save(entity: T): Promise<T>;
  abstract delete(id: ID): Promise<void>;
}

class UserRepository extends BaseRepository<User, number> {
  async findById(id: number) { return prisma.user.findUnique({ where: { id } }); }
  async findAll() { return prisma.user.findMany(); }
  async save(user: User) { return prisma.user.upsert(...); }
  async delete(id: number) { return prisma.user.delete({ where: { id } }); }
}
```

**Why it's bad:** The abstraction adds 50 lines of code that do nothing `prisma.user.findUnique()` doesn't already do. Prisma IS the repository layer. Adding another layer means two places to update when you need a new query, twice as many files to navigate, and no benefit. The abstraction pattern makes sense when you're switching between databases — you're not.

**Fix:**
```typescript
// Just use Prisma directly in your route handlers or a simple service file
const user = await prisma.user.findUnique({ where: { id } });
```

---

### 2. Unnecessary Middleware Layers

**What it looks like:**
```typescript
// Auth middleware that calls another auth middleware
const requireAuth = (req, res, next) => {
  const token = authMiddleware.validateToken(req);
  if (!token) return res.status(401).send();
  req.user = sessionMiddleware.getUser(token);
  next();
};
```

**Why it's bad:** Authentication should be one check: is there a valid session, and who does it belong to? When you stack middleware that calls other middleware, a bug in any layer is hard to trace. "Which layer rejected this request?" becomes a debugging puzzle.

**Fix:** One `authenticate` hook that checks the session and sets `request.user`. Done. If a route needs auth, it uses this hook. If it doesn't, it doesn't.

---

### 3. Dead Code / Unused Utility Functions

**What it looks like:**
```typescript
// utils/string.ts — none of these are called anywhere
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const truncate = (s: string, len: number) => s.length > len ? s.slice(0, len) + '...' : s;
export const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
export const camelToSnake = (s: string) => s.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
export const stripHtml = (s: string) => s.replace(/<[^>]*>/g, '');
```

**Why it's bad:** Dead code isn't neutral — it takes up space in your mental model, gets included in Claude Code's context window (using tokens that could go to your actual problem), and often suggests that whoever generated the code didn't understand what was actually needed.

**Fix:** Delete it. If you need `truncate` later, add `truncate` then. Don't keep functions "just in case."

---

### 4. Overly Generic Type Systems

**What it looks like:**
```typescript
// A type system that describes everything and nothing
type ApiResponse<T, E = ApiError, M = Record<string, unknown>> = {
  data: T | null;
  error: E | null;
  meta: M;
  pagination?: PaginationMeta;
  links?: HateoasLinks;
  version: string;
  requestId: string;
};
```

**Why it's bad:** This type was generated for an app that returns a list of users and a form submission result. HATEOAS links, API versioning, and request IDs are enterprise API concerns. The generic type makes every response harder to write and every consumer harder to read.

**Fix:**
```typescript
// What you actually need
type ApiResponse<T> = {
  data: T;
  error?: string;
};

// Or even simpler: just return the data directly
return { users: [...] };
```

---

### 5. Excessive Error Types Nobody Catches Differently

**What it looks like:**
```typescript
class DatabaseConnectionError extends AppError { ... }
class DatabaseQueryError extends AppError { ... }
class DatabaseTimeoutError extends AppError { ... }
class DatabaseConstraintError extends AppError { ... }
class DatabaseDeadlockError extends AppError { ... }
```

**Why it's bad:** In your actual error handlers, you treat all of these the same way: log the error, return 500, tell the user something went wrong. The type hierarchy exists in theory but never affects behavior. Every new developer (including future-you with Claude Code) has to learn which error type to throw where.

**Fix:** One `AppError` class with a `code` string and an HTTP status. If you ever need to handle database constraint violations differently from timeouts (you probably won't), add the distinction then.

---

### 6. Config Files for Features That Don't Exist

**What it looks like:**
```typescript
// config/features.ts
export const featureFlags = {
  enableBetaUi: false,
  enableAnalytics: false,
  enableMultiTenancy: false,
  enableSsoIntegration: false,
  enableAdvancedSearch: false,
  enableExportToPdf: false,
};
```

**Why it's bad:** You're not building multi-tenancy. You're not building SSO. These flags create the impression of flexibility while adding nothing but noise. Worse: they suggest to the next AI session that these features might be coming, generating more scaffolding for things that will never exist.

**Fix:** Add feature flags when you have a feature that needs flagging. Not before.

---

## Category 2: Frontend Anti-Patterns

These patterns make your UI feel broken, confusing, or unusable. Users won't always report them — they'll just stop using the tool.

---

### 1. Loading All Data Client-Side Without Pagination

**What it looks like:**
```typescript
// Fetches everything, always
useEffect(() => {
  fetch('/api/orders').then(r => r.json()).then(setOrders);
}, []);
```

**Why it's bad:** Month 1: 200 orders, loads in 1s. Month 6: 10,000 orders, loads in 8s. Month 12: 50,000 orders, your server sends a 15MB JSON response that crashes the browser tab.

**Fix:**
```typescript
// Server-side pagination
const [page, setPage] = useState(1);
useEffect(() => {
  fetch(`/api/orders?page=${page}&limit=50`)
    .then(r => r.json())
    .then(({ orders, total }) => {
      setOrders(orders);
      setTotal(total);
    });
}, [page]);
```

Add `LIMIT` and `OFFSET` to your Prisma query on the backend. Add prev/next buttons on the frontend. 30 minutes of work that prevents a guaranteed future crisis.

---

### 2. No Error States

**What it looks like:**
```typescript
const Dashboard = () => {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
    // No .catch() — errors are silently swallowed
  }, []);

  return <DataTable data={data} />; // Blank or crashes if data is null
};
```

**Why it's bad:** Network requests fail. APIs return errors. When they do, users see a blank page or a JavaScript exception. They don't know if it's broken, loading, or empty. They try to refresh 5 times and give up.

**Fix:**
```typescript
const [data, setData] = useState(null);
const [error, setError] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/data')
    .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json(); })
    .then(setData)
    .catch(err => setError(err.message))
    .finally(() => setLoading(false));
}, []);

if (loading) return <Spinner />;
if (error) return <ErrorMessage message="Couldn't load data. Try refreshing." />;
if (!data?.length) return <EmptyState message="No records yet." />;
return <DataTable data={data} />;
```

---

### 3. No Empty States

**What it looks like:**
A table that shows nothing — no headers, no message, just a blank white box — when there's no data.

**Why it's bad:** Users don't know if the tool is broken, if they're filtered to an empty state, or if there genuinely is no data. They assume it's broken. They ping you.

**Fix:** Every list, table, or feed needs an explicit empty state:
```tsx
{orders.length === 0 && (
  <div className="empty-state">
    <p>No orders yet. Orders will appear here once created.</p>
  </div>
)}
```

---

### 4. Raw Error Messages Shown to Users

**What it looks like:**
```
ER_DUP_ENTRY: Duplicate entry 'user@example.com' for key 'users.email'
```
Or:
```
Cannot read properties of undefined (reading 'name')
```

**Why it's bad:** These messages are meaningless to users, reveal internal implementation details, and make the tool feel broken and unprofessional.

**Fix:** Catch errors on the backend, translate them to user-friendly messages, and return them in a consistent format:
```typescript
try {
  await prisma.user.create({ data: { email } });
} catch (err) {
  if (err.code === 'P2002') {  // Prisma unique constraint violation
    reply.status(400).send({ error: 'That email is already registered.' });
    return;
  }
  reply.status(500).send({ error: 'Something went wrong. Please try again.' });
}
```

---

### 5. No Loading Indicators

**What it looks like:** User clicks "Submit" or navigates to a page. Nothing happens visually for 2 seconds. They click again. Double submission. Or they think it's broken and refresh.

**Why it's bad:** Modern users interpret "nothing is changing" as "it's broken." Even a 500ms delay needs a visual indicator.

**Fix:**
```tsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (data) => {
  setSubmitting(true);
  try {
    await fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) });
    // success
  } finally {
    setSubmitting(false);
  }
};

<button disabled={submitting} onClick={handleSubmit}>
  {submitting ? 'Saving...' : 'Save'}
</button>
```

Disable the button while submitting to prevent double-submissions.

---

### 6. Broken Responsive Design

**What it looks like:** The tool looks fine on a laptop but on a tablet or on a laptop with a smaller window, columns overlap, buttons fall off the edge, or text wraps into broken layouts.

**Why it's bad:** People use tools on different screen sizes. A broken layout makes core actions (clicking a button, reading a table row) physically impossible.

**Fix:** Use Tailwind's responsive prefixes or CSS media queries. Test by resizing your browser window to 768px wide. If anything looks broken, fix it. For tables with many columns, add horizontal scrolling:
```css
.table-container {
  overflow-x: auto;
}
```

---

### 7. Excessive Client-Side Computation

**What it looks like:**
```typescript
// Sorting/filtering 10,000 records in the browser
const filteredOrders = orders
  .filter(o => o.status === selectedStatus)
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 50);
```

**Why it's bad:** If `orders` is 10,000 items (which it will be eventually), this runs in the browser's main thread on every render, freezing the UI. The browser is not a database.

**Fix:** Move filtering and sorting to the server. Pass filter parameters as query params. The database is designed for this; the browser is not.

---

### 8. Form Submissions Without Feedback

**What it looks like:** User fills out a form, clicks submit, form clears or stays the same, and nothing happens visually. They don't know if it worked.

**Why it's bad:** Users resubmit, creating duplicate records. They assume it failed. They contact you.

**Fix:** After every form submission, show a clear success or error message. Either:
- A success toast/banner: "Record saved successfully"
- Redirect to the record that was created
- Clear the form and show "Done. Submit another?" message

The user must always know what happened.

---

## Category 3: Backend Anti-Patterns

These patterns cause silent performance degradation, database crashes, security vulnerabilities, or confusing API behavior.

---

### 1. N+1 Queries

**What it looks like:**
```typescript
// Route handler for /api/orders
const orders = await prisma.order.findMany();

// For each order, fetch the user separately — N+1 queries
const ordersWithUsers = await Promise.all(
  orders.map(async (order) => ({
    ...order,
    user: await prisma.user.findUnique({ where: { id: order.userId } }),
  }))
);
```

**Why it's bad:** If there are 100 orders, this makes 101 database queries (1 for orders + 1 for each user). At 1,000 orders it makes 1,001 queries. The page load time scales linearly with your data size. At some point it becomes unusably slow.

**Fix:** Use Prisma's `include` to fetch related data in one query:
```typescript
const orders = await prisma.order.findMany({
  include: { user: true },  // One query, joins the data
});
```

---

### 2. Multiple PrismaClient Instances

**What it looks like:**
```typescript
// db.ts
export const prisma = new PrismaClient();

// But also in some other file...
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); // Second instance!
```

**Why it's bad:** Each `PrismaClient` instance creates its own connection pool. MySQL has a maximum connection limit (typically 100-150). If you have multiple instances across multiple files and Fastify's multi-process handling, you can exhaust the connection pool during normal load. New connections fail with "too many connections."

**Fix:** Create one `PrismaClient` instance, export it, and import that same instance everywhere:
```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

// Everywhere else:
import { prisma } from '../lib/prisma';
```

---

### 3. Synchronous Operations Blocking the Event Loop

**What it looks like:**
```typescript
fastify.get('/export', async (request, reply) => {
  const data = await prisma.order.findMany(); // 50,000 rows
  
  // Synchronous! Blocks the event loop for ~5 seconds
  const csv = data.map(row => Object.values(row).join(',')).join('\n');
  
  reply.send(csv);
});
```

**Why it's bad:** Node.js is single-threaded. A CPU-intensive synchronous operation (like processing 50,000 rows synchronously) blocks ALL other requests for the entire duration. While one user is exporting, everyone else's requests queue up and time out.

**Fix:** For large data processing, stream the response instead of loading everything into memory:
```typescript
fastify.get('/export', async (request, reply) => {
  reply.header('Content-Type', 'text/csv');
  reply.header('Content-Disposition', 'attachment; filename="export.csv"');
  
  // Stream results from database in batches
  const cursor = await prisma.order.findMany({ take: 1000, skip: 0 });
  // Write in chunks, yield between chunks
});
```

Or offload to a background job if the dataset is very large.

---

### 4. Missing Request Validation

**What it looks like:**
```typescript
fastify.post('/users', async (request, reply) => {
  const { email, name, role } = request.body as any;
  // No validation — trusts whatever was sent
  await prisma.user.create({ data: { email, name, role } });
  return { success: true };
});
```

**Why it's bad:** A user (or a bug in the frontend) sends `{ role: 'admin' }` and the endpoint promotes them to admin. Or sends an empty email and creates a user with no email. Or sends a 10,000-character name that overflows your column. Unvalidated input is both a security and a data integrity problem.

**Fix:** Use Fastify's built-in JSON Schema validation:
```typescript
const createUserSchema = {
  body: {
    type: 'object',
    required: ['email', 'name'],
    properties: {
      email: { type: 'string', format: 'email', maxLength: 255 },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      // role is NOT accepted from the client — set it server-side
    },
    additionalProperties: false,  // Reject unknown fields
  },
};

fastify.post('/users', { schema: createUserSchema }, async (request, reply) => {
  const { email, name } = request.body;
  await prisma.user.create({ data: { email, name, role: 'member' } }); // role set server-side
});
```

---

### 5. Unstructured Error Responses

**What it looks like:**
Different endpoints return errors in different formats:
```javascript
// Some routes:
{ error: 'Not found' }

// Other routes:
{ message: 'User not found', code: 404 }

// Other routes:
'Unauthorized'  // Just a string

// Other routes:
{ success: false, err: { msg: 'Bad request' } }
```

**Why it's bad:** Your frontend has to handle 4 different error shapes. When you add a new API call, there's no clear contract for how errors look. Claude Code generates inconsistent error handling as a result. Users see inconsistent error messages.

**Fix:** Define one error format and use it everywhere:
```typescript
// The error format: { error: string, details?: unknown }

// Set a global error handler in Fastify
fastify.setErrorHandler((error, request, reply) => {
  const statusCode = error.statusCode || 500;
  reply.status(statusCode).send({
    error: error.message || 'Something went wrong',
  });
});

// In route handlers, throw with a status code
throw fastify.httpErrors.notFound('User not found');
throw fastify.httpErrors.badRequest('Email is required');
```

---

### 6. No Request Timeouts on External Calls

**What it looks like:**
```typescript
fastify.post('/summarize', async (request, reply) => {
  // No timeout — if the Anthropic API hangs, this hangs forever
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    messages: [{ role: 'user', content: request.body.text }],
  });
  return { summary: response.content[0].text };
});
```

**Why it's bad:** External APIs (Anthropic, Google, any HTTP service) can be slow or unresponsive. Without a timeout, your request handler waits indefinitely. The client's request times out. The Fastify connection stays open consuming memory. Under load, you accumulate hundreds of hanging requests.

**Fix:**
```typescript
fastify.post('/summarize', async (request, reply) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // 30 second timeout

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      messages: [{ role: 'user', content: request.body.text }],
    }, { signal: controller.signal });

    return { summary: response.content[0].text };
  } catch (err) {
    if (err.name === 'AbortError') {
      reply.status(504).send({ error: 'AI is taking too long. Please try again.' });
      return;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
});
```
