# Cost Optimization for AI Applications

## Understanding Costs

### Token Pricing (per 1M tokens, approximate)

| Model | Input | Output | Cached Input |
|---|---|---|---|
| Claude Haiku 4.5 | $0.80 | $4.00 | $0.08 |
| Claude Sonnet 4.6 | $3.00 | $15.00 | $0.30 |
| Claude Opus 4.6 | $15.00 | $75.00 | $1.50 |

### Cost Formula
```
cost = (input_tokens * input_price) + (output_tokens * output_price)
```

## Optimization Strategies

### 1. Model Routing (Biggest Impact)

Route requests to the cheapest model that can handle the task:

```typescript
function selectModel(task: string): string {
  // Haiku for simple, structured tasks
  if (task === "classify" || task === "extract" || task === "tag") {
    return "claude-haiku-4-5-20251001";
  }
  // Opus for complex reasoning
  if (task === "architect" || task === "review_security" || task === "complex_analysis") {
    return "claude-opus-4-6";
  }
  // Sonnet for everything else
  return "claude-sonnet-4-6";
}
```

**Rules of thumb:**
- Classification, extraction, tagging → Haiku (10x cheaper than Sonnet)
- Coding, analysis, writing → Sonnet (best value)
- Complex reasoning, architecture → Opus (when quality matters most)

### 2. Prompt Caching (Up to 90% savings on input)

Cache large, repeated context (system prompts, reference docs):

```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: [{
    type: "text",
    text: largeSystemPrompt,  // Only charged full price once
    cache_control: { type: "ephemeral" }
  }],
  messages: [{ role: "user", content: userQuestion }],
});
```

**When to cache:**
- System prompts > 1024 tokens
- Reference documents injected into context
- Few-shot examples
- Tool definitions (large sets)

**Cache behavior:**
- TTL: 5 minutes (refreshed on each use)
- Minimum cacheable: 1024 tokens (Haiku), 2048 (Sonnet/Opus)
- Cached tokens cost 90% less

### 3. Batch API (50% savings)

For non-real-time processing:

```typescript
const batch = await client.messages.batches.create({
  requests: items.map((item, i) => ({
    custom_id: `item-${i}`,
    params: {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: item.text }],
    }
  }))
});

// Check status later (up to 24h)
const status = await client.messages.batches.retrieve(batch.id);
```

**Best for:** Content moderation, data extraction, bulk classification, report generation.

### 4. Token Management

**Reduce input tokens:**
- Trim unnecessary whitespace and formatting
- Remove redundant context from conversation history
- Summarize older messages instead of keeping full history
- Only include relevant tool definitions (not all 50)

**Reduce output tokens:**
- Set `max_tokens` appropriately (not 4096 when you need 200)
- Ask for concise responses in the system prompt
- Use structured output (JSON) — typically shorter than prose
- Use `stop_sequences` to cut output early when possible

### 5. Conversation Management

```typescript
// BAD: Growing conversation = growing costs
messages.push(newMessage);  // Eventually hits 200K tokens

// GOOD: Sliding window with summarization
if (messages.length > 20) {
  const summary = await summarizeConversation(messages.slice(0, -10));
  messages = [
    { role: "user", content: `Previous context: ${summary}` },
    { role: "assistant", content: "Understood. I have the context." },
    ...messages.slice(-10),
  ];
}
```

### 6. Token Tracking

Always track token usage for cost visibility:

```typescript
const response = await client.messages.create({ ... });

// Log usage
console.log({
  input_tokens: response.usage.input_tokens,
  output_tokens: response.usage.output_tokens,
  cache_read_tokens: response.usage.cache_read_input_tokens || 0,
  cache_creation_tokens: response.usage.cache_creation_input_tokens || 0,
  model: "claude-sonnet-4-6",
  estimated_cost: calculateCost(response.usage, "claude-sonnet-4-6"),
});
```

## Cost Estimation Worksheet

Before building, estimate your monthly cost:

```
1. Estimate requests per day: ___
2. Average input tokens per request: ___
3. Average output tokens per request: ___
4. Model: ___
5. Monthly cost = requests/day × 30 × ((input_tokens × input_price) + (output_tokens × output_price)) / 1_000_000
```

**Example:** 1000 requests/day, 2000 input tokens, 500 output tokens, Sonnet:
```
= 1000 × 30 × ((2000 × $3) + (500 × $15)) / 1,000,000
= 30,000 × ($6,000 + $7,500) / 1,000,000
= 30,000 × $0.0135
= $405/month
```

Switch to Haiku for the same workload: **~$50/month** (8x cheaper).
