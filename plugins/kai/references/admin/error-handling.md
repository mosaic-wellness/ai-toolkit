# Error Handling Reference

Common errors when using admin-mcp tools and how to resolve them.

---

## Error Resolution Table

| Error Message | Cause | Resolution |
|---|---|---|
| "Production writes are disabled via MCP" | All write tools are blocked for production environment | Use the admin dashboard UI for production publishing. MCP is staging-only by design. |
| "Rate limit exceeded" | Exceeded 60 writes/min or 10 per 5 sec burst | Wait for the `retryAfterMs` value returned in the error, then retry. Space out write operations. |
| "Lock token is invalid or expired" | Lock expired (15-min TTL) or wrong token was passed | Re-acquire lock with `acquire_page_lock`. Lock tokens are only valid for 15 minutes. |
| "Page is locked by another user" | Someone else holds the lock | Use `check_page_lock` to see who holds it and when it expires. Wait for expiry or contact the lock holder. |
| "Authentication required" | Missing or invalid API key in MCP config | Ensure `x-api-key` header is configured in the MCP server connection settings. |
| "Unknown brand: '{brand}'" | Invalid brand code | Use one of the valid brand codes: mm, mm-in, mm-ae, mm-co, bw, bw-ae, bw-co, bw-us, lj, lj-ae, lj-co, lj-sa, lj-us, rl-in, rl-us, wn-in, as-in, fw. |
| Zeus API 404 | Page does not exist in S3 | Check that the identifier/page_name and brand are correct. Use `list_widget_pages` or `list_pdp_pages` to discover existing pages. |
| Zeus API 500 | Backend service error | Retry once. If persistent, check the admin dashboard or escalate. |
| "Page already exists" | `create_*` tool with an identifier that already exists | Use `force: true` to overwrite, or choose a different identifier/page_name. |
| "Invalid identifier format" | Identifier not in kebab-case | Use kebab-case only: `my-new-page` not `myNewPage` or `my_new_page`. Regex: `/^[a-z0-9]+(-[a-z0-9]+)*$/` |
| "Brand '{brand}' only has pagedata buckets" | Tried to access products bucket for a pagedata-only brand (e.g., `fw`) | Brand `fw` (FitWise) only supports pagedata operations, not PDP/product operations. |
| "Release notes required" | Write operation to production requires release notes | Provide `release_notes` parameter with at least 10 characters. |

---

## Prevention Tips

### Always acquire locks for multi-step edits
If you're making more than one `update_*_section` call in sequence, acquire a lock first:
```
acquire_page_lock(page_type: "widget_page", page_name: "home", brand: "mm")
```
This prevents someone else from making changes between your edits.

### Use diff tools before directing user to publish
Always review changes with `diff_pdp_versions` or `diff_widget_page_versions` before telling the user to publish via the admin dashboard.

### Verify pages exist before editing
If unsure whether a page exists, use `list_widget_pages` or `list_pdp_pages` with a `search` parameter to discover pages.

### Handle 404s gracefully for catch-all URLs
When resolving a `/{slug}` URL, always try widget page first, then PDP. A 404 from one doesn't mean the page doesn't exist — it may be the other type.

### Don't retry on auth errors
If you get an authentication error, don't retry — the credentials need to be fixed in the MCP server configuration.

### Space out bulk operations
When making many edits (e.g., updating multiple pages), space them out to stay within the rate limit (60 writes/min, 10 per 5 sec burst). The error response includes `retryAfterMs` if you hit the limit.
