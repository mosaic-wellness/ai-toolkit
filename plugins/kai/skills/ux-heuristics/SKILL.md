---
name: ux-heuristics
description: >
  UX patterns and heuristics for internal tools. Covers data tables, forms,
  navigation, progressive disclosure, loading states, error states, empty states,
  and accessibility basics. Auto-activates when reviewing frontend code, discussing
  UI patterns, auditing user experience, building dashboards, or working on
  pages/components/layouts.
---

# UX Heuristics for Internal Tools

## Nielsen's 10 — Prioritized for Internal Tools

| Priority | Heuristic | What It Means in Practice |
|---|---|---|
| 1 — CRITICAL | Visibility of system status | Show loading spinners, progress bars, success/error messages. Never blank screen while loading. |
| 2 — CRITICAL | Match between system and real world | Business terminology, human date formats. Not column names. |
| 3 — CRITICAL | Aesthetic and minimalist design | Progressive disclosure. Don't show 50 columns. Show what matters. |
| 4 — IMPORTANT | Error prevention + recovery | Confirm destructive actions. Useful error messages in plain English. |
| 5 — IMPORTANT | User control and freedom | Cancel on every form. Undo where possible. Back without losing work. |
| 6 — MODERATE | Consistency and standards | Same patterns everywhere. Same button colors, same filter placement. |
| 7 — MODERATE | Recognition vs recall | Dropdowns over free text. Autocomplete. Recent items. |
| LOW | Flexibility/efficiency | Keyboard shortcuts — nice-to-have, not V1. |
| LOW | Help and documentation | Slack > docs for 15-person tools. |
| LOW | Match real world (jargon) | Internal tools CAN use domain jargon everyone knows. |

---

## Data Table Patterns

### Pagination

- ALWAYS paginate if data could exceed 50 rows.
- Default page size: 25.
- Show total: "Showing 1-25 of 1,247 orders".
- Server-side pagination for >1,000 rows.
- Page size options: 25, 50, 100.
- Remember preference in localStorage.

### Search / Filter

- Every table with >20 rows needs a search box.
- Debounced 300ms.
- Filters above table.
- Active filters show "Clear all".
- Filter state in URL params (shareable).
- Date presets: today, this week, this month, last 30 days.

### Sorting

- Click column header to sort, click again to reverse.
- Arrow indicator shows current sort direction.
- Default: newest first for timestamps, alphabetical for names.

### Inline Actions

- Max 3 visible buttons per row — overflow into "..." menu.
- Destructive actions visually distinct (red, separated).
- Most common action leftmost.

### Empty States

- NEVER show a blank table with just headers.
- Message + icon + primary action CTA.
- Different empty states for: no data ever vs filter matches nothing.

### Loading States

- Skeleton/shimmer for table rows.
- Keep headers visible during load.
- If >3s show "Still loading..." reassurance message.

---

## Progressive Disclosure Rules

### When to Hide

- Advanced settings
- Technical details
- Historical data
- Secondary actions
- Full error details

### When to Show

- Primary actions
- Status
- Required fields
- Navigation
- Error states

### Patterns

| Pattern | Use Case | Rules |
|---|---|---|
| Accordion | Settings pages, grouped forms | Single-expand by default |
| Drawer | Detail views | 400-600px, right-side, click-outside-to-close |
| Tabs | Multiple views of same context | Max 5-7 tabs, active tab in URL, no content jump |

---

## Component Patterns

### Forms

- Validate on blur not keystroke.
- Errors inline below field + summary at top for multi-error scenarios.
- Disable submit button during submission with spinner.
- Success: toast notification, redirect, or clear form (pick one consistently).
- Mark optional fields if most fields are required.
- Single column layout for most forms.

### Navigation

| Pattern | When to Use |
|---|---|
| Sidebar | 5+ sections — collapsible, icons + labels |
| Tabs | 2-7 views of the same resource |
| Breadcrumbs | Depth >2 levels |
| Top bar | App name + user info + global actions |

---

## Accessibility Basics

| Area | Rule |
|---|---|
| Contrast | 4.5:1 minimum. No light gray on white. |
| Keyboard | All interactive elements reachable via Tab. Visible focus ring. Enter/Space activates. |
| Labels | Every input MUST have a visible label (not just placeholder). `htmlFor`/`id` must match. |
| Focus management | Modal open = focus into modal. Modal close = focus returns to trigger. |

---

## Internal Tool Anti-Patterns

Quick checklist of the most common UX mistakes in internal tools. For detailed patterns with code examples and fixes, see `${CLAUDE_PLUGIN_ROOT}/references/anti-patterns.md` (frontend section).

1. Showing too much data (50 columns) — use progressive disclosure
2. No pagination (all records at once) — paginate at 25 rows
3. Raw error messages (`ER_DUP_ENTRY`) — translate to plain English
4. No loading states (blank screen) — add spinner or skeleton
5. Broken responsive layout (test at 1280px!) — set viewport meta
6. No empty states (blank table with headers only) — add message + CTA
7. Form submissions without feedback — disable button + show spinner
8. Destructive actions without confirmation — add confirm dialog
9. Inconsistent patterns across pages — standardize buttons, spacing, colors
10. No keyboard support for data entry tools — ensure Tab navigation works
