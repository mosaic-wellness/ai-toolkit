# MCP Conventions

> Standards for building MCP (Model Context Protocol) servers that Claude Code can reliably use. An MCP tool that doesn't follow these conventions will be misused, fail silently, or be ignored.

---

## 1. Tool Naming

Tools follow the pattern: **`verb_noun`** in **snake_case**.

### Approved verbs

| Verb | Use for |
|------|---------|
| `get` | Fetching a single record by ID |
| `list` | Fetching multiple records (with optional filters) |
| `search` | Full-text or fuzzy search across records |
| `create` | Creating a new record |
| `update` | Modifying an existing record |
| `delete` | Removing a record |
| `calculate` | Computing a derived value (totals, scores, durations) |
| `validate` | Checking whether input is valid without side effects |
| `send` | Delivering a message, email, or notification |
| `export` | Generating a file from data (CSV, PDF, JSON) |

### Good names

```
get_order          — fetches one order by ID
list_orders        — fetches multiple orders (with filters)
create_order       — creates a new order
update_order       — updates an existing order
delete_order       — deletes an order
search_products    — searches products by name/description
calculate_total    — computes order total with discounts
validate_email     — checks if an email is valid
send_notification  — sends a notification to a user
export_orders_csv  — exports orders as a CSV file
```

### Bad names (and why)

| Bad name | Problem |
|----------|---------|
| `orderManager` | camelCase, no verb, vague |
| `handleOrder` | "handle" is not an approved verb — what does it do? |
| `doStuff` | Completely meaningless |
| `order_CRUD` | Not a verb, abbreviations confuse the model |
| `getOrderAndRelatedDataAndCalculateTotals` | One tool should do one thing |
| `fetch_orders` | Use `list` not `fetch` — consistency matters |
| `Orders` | No verb, PascalCase |

### One tool, one action

Never combine operations in one tool. If you need to get an order AND calculate its total, that's two tools: `get_order` and `calculate_order_total`. Claude will chain them. Combining them makes each tool less reusable and harder to describe accurately.

---

## 2. Input Validation

Every tool validates its inputs at two levels:

**Level 1 — JSON Schema** (structural validation — caught before the handler runs):
- Required fields are present
- Types are correct (string, number, boolean)
- Strings have length limits
- Numbers have range limits
- Enum fields only accept valid values

**Level 2 — Handler business rules** (semantic validation — caught inside the handler):
- Referenced records actually exist
- The caller has permission to access them
- Values are logically valid (end date is after start date)

### Example

```typescript
server.tool(
  'create_order',
  'Creates a new order for a customer. Use when a customer confirms their purchase.',
  {
    // JSON Schema validation (Level 1)
    customerId: z.number().int().positive().describe('The customer ID. Must be an existing customer.'),
    items: z.array(z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().min(1).max(100),
    })).min(1).max(50).describe('List of items to order. At least 1 item required.'),
    notes: z.string().max(500).optional().describe('Optional order notes. Max 500 characters.'),
  },
  async ({ customerId, items, notes }) => {
    // Business rule validation (Level 2)
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Customer ${customerId} not found. Use list_customers to find valid customer IDs.` }],
      };
    }

    // Verify all products exist
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    if (products.length !== productIds.length) {
      const missing = productIds.filter(id => !products.find(p => p.id === id));
      return {
        isError: true,
        content: [{ type: 'text', text: `Products not found: ${missing.join(', ')}. Use list_products to find valid product IDs.` }],
      };
    }

    // Create the order
    const order = await prisma.order.create({ ... });
    return {
      content: [{ type: 'text', text: JSON.stringify(order) }],
    };
  }
);
```

---

## 3. Error Format

**Never throw errors from tool handlers.** Return them as structured error responses. Thrown errors produce unhelpful stack traces in Claude Code. Returned errors give Claude the information it needs to try a different approach.

### The rule: return `isError: true`, don't throw

```typescript
// BAD — throws an error
if (!customer) {
  throw new Error('Customer not found');
}

// GOOD — returns an error response
if (!customer) {
  return {
    isError: true,
    content: [{
      type: 'text',
      text: 'Customer 42 not found. Use list_customers to see available customers.',
    }],
  };
}
```

### Error message formula

Every error message must answer two questions:
1. **What went wrong?** — specific, not generic
2. **What should Claude do next?** — a concrete next step

### Good vs bad error messages

| Bad | Good |
|-----|------|
| `"Error"` | `"Order 123 not found. Use list_orders to see available order IDs."` |
| `"Invalid input"` | `"quantity must be between 1 and 100. Received: 500."` |
| `"Unauthorized"` | `"This session does not have permission to delete orders. Only admin sessions can delete."` |
| `"Something went wrong"` | `"Database connection failed. The order was not created. Try again in a few seconds."` |
| `"Not found"` | `"Product ID 999 not found. Use search_products to find the correct product ID."` |

### Error response structure

```typescript
// Always this shape
return {
  isError: true,
  content: [{
    type: 'text',
    text: 'What went wrong. What to do next.',
  }],
};

// Success shape (for reference)
return {
  content: [{
    type: 'text',
    text: JSON.stringify(result),
  }],
};
```

---

## 4. Documentation

Every tool needs three levels of documentation. Claude uses all three to decide whether and how to call your tool.

### Tool description (what + when)

The `description` parameter tells Claude what the tool does and — crucially — when to use it vs other tools.

```typescript
server.tool(
  'get_order',
  // Description: what it returns + when to use it vs list_orders
  'Fetches a single order by its ID, including all items and customer details. ' +
  'Use this when you already have a specific order ID. ' +
  'Use list_orders instead if you need to search or browse orders.',
  { orderId: z.number() },
  handler
);
```

### Parameter descriptions (format + example)

Every parameter needs a description that includes:
- What it is
- What format it expects
- An example value

```typescript
{
  startDate: z.string().describe(
    'Start of date range in ISO 8601 format (YYYY-MM-DD). Example: "2024-01-15"'
  ),
  status: z.enum(['pending', 'confirmed', 'shipped', 'cancelled']).describe(
    'Order status to filter by. Use list_order_statuses if unsure which values are valid.'
  ),
  limit: z.number().int().min(1).max(100).default(20).describe(
    'Maximum number of orders to return (1-100). Default is 20.'
  ),
}
```

### README tool list

Your MCP server's README must include a table of all tools:

```markdown
## Tools

| Tool | Description | Required params |
|------|-------------|-----------------|
| `get_order` | Fetch a single order by ID | `orderId` |
| `list_orders` | List orders with optional filters | none |
| `create_order` | Create a new order | `customerId`, `items` |
| `update_order` | Update an existing order | `orderId` |
| `delete_order` | Delete an order | `orderId` |
```

---

## 5. Security

Every MCP server that handles real data must implement these four controls.

### Rate limiting

Prevent runaway Claude sessions from hammering your database or running up API costs:

```typescript
import rateLimit from 'express-rate-limit'; // or equivalent for your transport

// 60 requests per minute per session
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.headers['mcp-session-id'] || req.ip,
  message: { isError: true, content: [{ type: 'text', text: 'Rate limit exceeded. Wait 60 seconds.' }] },
});
```

### Auth on every call

Never assume a caller is authenticated based on how they connected. Check auth on every tool invocation:

```typescript
async ({ sessionToken, ...params }) => {
  const session = await validateSession(sessionToken);
  if (!session) {
    return { isError: true, content: [{ type: 'text', text: 'Invalid or expired session. Re-authenticate.' }] };
  }
  // proceed with session.userId
}
```

### Log all calls

Every tool call should be logged with: who called it, what tool, what inputs (minus secrets), what the result was, and how long it took.

```typescript
const start = Date.now();
logger.info({ tool: 'create_order', userId: session.userId, params: safeParams }, 'Tool called');

const result = await handler(params);

logger.info({ tool: 'create_order', userId: session.userId, duration: Date.now() - start, isError: result.isError }, 'Tool completed');
```

### Data minimization

Return only the fields Claude needs. Don't return full user objects with password hashes, internal flags, or unrelated data:

```typescript
// BAD — returns everything
return { content: [{ type: 'text', text: JSON.stringify(user) }] };

// GOOD — returns only what's needed
return {
  content: [{
    type: 'text',
    text: JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }),
  }],
};
```

---

## 6. Transport

Choose the right transport based on where your MCP server runs:

### stdio — local tools and Claude Code plugins

Use stdio when:
- The MCP server runs on the same machine as Claude Code
- It's a developer tool or plugin (not a shared service)
- You want zero network configuration

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const transport = new StdioServerTransport();
await server.connect(transport);
```

Claude Code config (`.claude/settings.json`):
```json
{
  "mcpServers": {
    "my-tool": {
      "command": "node",
      "args": ["dist/mcp-server.js"]
    }
  }
}
```

### Streamable HTTP — remote/production servers

Use Streamable HTTP when:
- Multiple Claude Code instances need to share the same MCP server
- The server runs on EC2 or another remote host
- You need session management across requests

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
await server.connect(transport);
```

### SSE (Server-Sent Events) — legacy only

Use SSE only when:
- You're connecting to an older MCP client that doesn't support Streamable HTTP

SSE is the previous transport standard. Prefer Streamable HTTP for new servers.

---

## 7. Testing

Every MCP tool needs tests for these five scenarios. You don't need a test framework — direct unit tests with `node:test` are fine.

```typescript
import { test } from 'node:test';
import assert from 'node:assert';

// 1. Happy path — valid input, expected output
test('get_order returns order for valid ID', async () => {
  const result = await get_order_handler({ orderId: 1 });
  assert.strictEqual(result.isError, undefined);
  const order = JSON.parse(result.content[0].text);
  assert.strictEqual(order.id, 1);
});

// 2. Invalid input — validation catches bad data before hitting the DB
test('create_order rejects negative quantity', async () => {
  const result = await create_order_handler({
    customerId: 1,
    items: [{ productId: 1, quantity: -5 }],
  });
  assert.strictEqual(result.isError, true);
  assert(result.content[0].text.includes('quantity'));
});

// 3. Not found — record doesn't exist
test('get_order returns error for non-existent ID', async () => {
  const result = await get_order_handler({ orderId: 99999 });
  assert.strictEqual(result.isError, true);
  assert(result.content[0].text.includes('not found'));
});

// 4. Edge cases — boundary values, empty arrays, maximum values
test('list_orders with limit=100 returns at most 100 results', async () => {
  const result = await list_orders_handler({ limit: 100 });
  const orders = JSON.parse(result.content[0].text);
  assert(orders.length <= 100);
});

// 5. Rate limits — exceeding the limit returns a proper error (not an exception)
test('rate limiter returns error after 60 requests per minute', async () => {
  // Simulate 61 requests
  for (let i = 0; i < 60; i++) {
    await list_orders_handler({}, { sessionId: 'test-session' });
  }
  const result = await list_orders_handler({}, { sessionId: 'test-session' });
  assert.strictEqual(result.isError, true);
  assert(result.content[0].text.includes('Rate limit'));
});
```

Run tests:
```bash
node --test src/**/*.test.ts
```
