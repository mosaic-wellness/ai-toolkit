# PDP Transformation Pipeline

How PDP configs authored via admin-mcp get transformed before reaching the frontend.

---

## Overview

Admin-MCP writes **static JSON configs** to S3. Before the frontend renders them, **middleware performs a 7-step enrichment pipeline** that injects real-time data (pricing, reviews, inventory, delivery info).

```
Admin-MCP → S3 (static JSON) → Middleware (7-step enrichment) → Frontend (fully hydrated)
```

**Key insight:** Admin-MCP only controls the **widget layout and static content**. Dynamic product data (prices, stock, ratings) is injected by middleware at request time — you never need to manually set these fields.

---

## What Admin-MCP Controls vs What Middleware Injects

| Controlled by Admin-MCP (static) | Injected by Middleware (dynamic) |
|---|---|
| Widget types and order (displayOrder) | Product pricing (MRP, discounted price) |
| Widget layout and structure | Stock/inventory status |
| Static content (titles, descriptions, images) | Customer reviews and ratings |
| CTA labels and static URLs | Delivery availability (pincode check) |
| Header/footer configuration | Wallet bonus config |
| SEO meta tags (template) | AI-generated customer testimonials |
| Experiment config | Traffic density metrics |
| Brand-level defaults | Structured data schema (SEO) |

---

## Middleware 7-Step Enrichment Pipeline

**Controller:** `backend/middleware/api/controllers/pages/widgetised-pdp.ts`
**Route:** `GET /page/mwsc/widgetised/product/:product` (cached 10 mins via CDN)

### Step 1: Parallel Data Fetching
Fetches 7 data sources in parallel:
- Widgetized PDP JSON from S3
- Brand-level PDP config
- Organization/brand data
- Product data from OpenSearch
- AI-generated testimonials (Redis)
- Wallet bonus config
- Traffic density metrics (Redis)

### Step 2: Resolve Display Order
Calls `getPDPDisplayOrder()` — see `display-order-guide.md`.

### Step 3: Map Display Order to Widgets
Converts displayOrder array into widget objects via `widgetIDMapping` lookup.

### Step 4: Fetch Dynamic Product Data
For widgets referencing products (carousels, recommendations), fetches from OpenSearch.

### Step 5: Map Dynamic Product Listings
Handles widgets with `config.dynamicProductList = true` (OMS recommendation APIs).

### Step 6: Insert Dynamic Data
Specialized handlers per widget type inject real-time data (pricing, reviews, stock).

### Step 7: Transform Structured Metadata
Builds JSON-LD schema tags for SEO.

---

## Caching Layers

| Layer | TTL | What's Cached |
|---|---|---|
| CDN (route-level) | 10 minutes | Full widgetized PDP response |
| Redis (middleware) | Varies | AI testimonials, traffic density, experiment.json (1 hour) |
| OpenSearch (static-service) | Near real-time | Product metadata, pricing, inventory |

**Implication:** After updating via admin-mcp, changes may take up to **10 minutes** to appear on staging due to CDN caching. The S3 update is immediate.

---

## Practical Implications

1. **Don't set dynamic fields** — Pricing, stock, ratings are injected by middleware. Setting them in admin-mcp has no effect.
2. **Focus on layout and static content** — Widget types, order, titles, images, CTAs.
3. **CDN cache delay** — Changes take up to 10 minutes. Use `?theme={random}` to bypass.
4. **Desktop vs mobile layout** — Middleware resolves platform-specific displayOrder.
5. **Brand config affects all PDPs** — Changes to brand config affect every PDP without a PDP-level override.
