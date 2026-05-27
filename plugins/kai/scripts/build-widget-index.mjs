#!/usr/bin/env node
// Build a flat JSON lookup of every PDP-relevant widget from the bundled
// pdp-widget-specs/ directory. Idempotent — re-run after a sync to refresh.
//
// Usage:  node scripts/build-widget-index.mjs
//
// Reads:  references/admin/pdp-widget-specs/{widget-catalog.md, narrative-index.md,
//                                            _provenance.md, widgets/*.md}
// Writes: references/admin/pdp-widget-specs/widget-index.json

import { readFileSync, readdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PLUGIN_ROOT = resolve(__dirname, "..");
const SPEC_DIR = join(PLUGIN_ROOT, "references", "admin", "pdp-widget-specs");
const WIDGETS_DIR = join(SPEC_DIR, "widgets");
const OUTPUT = join(SPEC_DIR, "widget-index.json");

// ---------- guard: spec dir must exist ----------
if (!existsSync(SPEC_DIR) || !statSync(SPEC_DIR).isDirectory()) {
  console.error(`fatal: spec dir not found at ${SPEC_DIR}`);
  process.exit(1);
}
if (!existsSync(WIDGETS_DIR) || !statSync(WIDGETS_DIR).isDirectory()) {
  console.error(`fatal: widgets dir not found at ${WIDGETS_DIR}`);
  process.exit(1);
}

// ---------- helpers ----------
function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

// Parse the master widget-catalog.md table. Each row looks like:
//   | `WIDGET_TYPE` | ✓ | ...fields... | [widgets/WIDGET_TYPE.md](...) |
// Returns Map<type, relevance>.
function parseCatalog(md) {
  const out = new Map();
  if (!md) return out;
  const rowRe = /^\|\s*`([A-Z][A-Z0-9_]*)`\s*\|\s*(✓|○|—)\s*\|/gm;
  let m;
  while ((m = rowRe.exec(md)) !== null) {
    out.set(m[1], m[2]);
  }
  return out;
}

// Parse narrative-index.md. Section headers look like:
//   ## 🎯 HERO — first impression...
// followed by a markdown table whose first column contains [`WIDGET_TYPE`](...).
function parseNarrative(md) {
  const byWidget = new Map();
  if (!md) return byWidget;

  const lines = md.split(/\r?\n/);
  let currentRole = null;
  const sectionRe = /^##\s+(.*)$/;
  const widgetCellRe = /\[`([A-Z][A-Z0-9_]*)`\]/g;

  for (const line of lines) {
    const sm = sectionRe.exec(line);
    if (sm) {
      const stripped = sm[1].replace(/[^A-Za-z\s—-]/g, " ");
      const tokenMatch = stripped.match(/\b([A-Z]{2,})\b/);
      currentRole = tokenMatch ? tokenMatch[1] : null;
      continue;
    }
    if (!currentRole) continue;
    if (!line.includes("[`")) continue;
    let wm;
    while ((wm = widgetCellRe.exec(line)) !== null) {
      const widget = wm[1];
      const arr = byWidget.get(widget) || [];
      if (!arr.includes(currentRole)) arr.push(currentRole);
      byWidget.set(widget, arr);
    }
  }
  return byWidget;
}

// Extract the SHA line from _provenance.md.
function parseProvenance(md) {
  if (!md) return null;
  const m = md.match(/Source SHA[:*\s]+`?([0-9a-f]{7,40})`?/i);
  if (m) return m[1];
  return null;
}

// Parse a single widget spec file.
function parseWidgetSpec(type, path) {
  const md = readIfExists(path);
  if (!md) return null;

  // summary: the first "> ..." blockquote line.
  let summary = null;
  const lines = md.split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith("> ")) {
      summary = line.replace(/^>\s?/, "").trim();
      break;
    }
  }

  // headerSupported / layoutSupported — robust to "- **key** — true",
  // "- key — true", "key: true", etc.
  function lookupBool(key) {
    const flat = md.replace(/\*\*/g, "");
    const re = new RegExp(`${key}\\s*(?:—|–|-|:)\\s*(true|false)\\b`, "i");
    const m = flat.match(re);
    if (!m) return null;
    return m[1].toLowerCase() === "true";
  }
  const headerSupported = lookupBool("headerSupported");
  const layoutSupported = lookupBool("layoutSupported");

  // edit_safety_summary — try options A → C → B → D fallback.
  let editSafety = null;

  // A: explicit "Edit-safety: ..." per-widget line (NOT the boilerplate
  // "Edit-safety legend: ..." that explains the emoji legend on most specs).
  const aMatch = md.match(/^Edit-safety:\s+(.*)$/m);
  if (aMatch && !/^legend\b/i.test(aMatch[1])) {
    editSafety = aMatch[1].trim();
  }

  // C: "### Edit-safety" (or "### Edit-safety summary") subsection — capture
  // the first non-blank content lines, preferring bullets / emoji-prefixed lines.
  if (!editSafety) {
    const cMatch = md.match(/^###\s+Edit[- ]safety[^\n]*\n([\s\S]*?)(?=^##\s|^###\s|\Z)/m);
    if (cMatch) {
      const body = cMatch[1];
      const bodyLines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      // Prefer emoji-prefixed lines (🟢/🟡/🔴 ...) — those are the per-class
      // summaries. Fall back to plain bullet content.
      const emojiLines = bodyLines.filter((l) => /^[🟢🟡🔴]/.test(l));
      const bulletLines = bodyLines
        .filter((l) => /^[-*]\s+/.test(l))
        .map((l) => l.replace(/^[-*]\s+/, ""));
      const pick = emojiLines.length ? emojiLines : bulletLines;
      if (pick.length) editSafety = pick.slice(0, 3).join(" · ");
      else if (bodyLines.length) editSafety = bodyLines[0]; // first prose line
    }
  }

  // B: tally 🟢 / 🟡 / 🔴 in table-row lines
  if (!editSafety) {
    let green = 0, yellow = 0, red = 0;
    for (const line of lines) {
      if (!line.startsWith("|")) continue;
      if (/^\|\s*[- ]+\|/.test(line)) continue;
      green += (line.match(/🟢/g) || []).length;
      yellow += (line.match(/🟡/g) || []).length;
      red += (line.match(/🔴/g) || []).length;
    }
    if (green + yellow + red > 0) {
      const parts = [];
      if (green) parts.push(`${green}🟢`);
      if (yellow) parts.push(`${yellow}🟡`);
      if (red) parts.push(`${red}🔴`);
      editSafety = `${parts.join(" · ")} fields`;
    }
  }

  if (!editSafety) editSafety = "(see spec)";

  return {
    summary: summary || "(no summary)",
    headerSupported,
    layoutSupported,
    editSafetySummary: editSafety,
  };
}

// ---------- main ----------
const catalogMd = readIfExists(join(SPEC_DIR, "widget-catalog.md"));
const narrativeMd = readIfExists(join(SPEC_DIR, "narrative-index.md"));
const provenanceMd = readIfExists(join(SPEC_DIR, "_provenance.md"));

if (!catalogMd) console.warn("warn: widget-catalog.md not found — pdp_relevance will be missing");
if (!narrativeMd) console.warn("warn: narrative-index.md not found — narrative_roles will be empty");

const catalog = parseCatalog(catalogMd);
const narrativeMap = parseNarrative(narrativeMd);
const sourceSha = parseProvenance(provenanceMd);

const sourceCount = catalog.size;
let pdpRelevantCount = 0;
let renderableCount = 0;
for (const v of catalog.values()) {
  if (v === "✓") {
    pdpRelevantCount++;
    renderableCount++;
  } else if (v === "○") {
    renderableCount++;
  }
}

const specFiles = readdirSync(WIDGETS_DIR)
  .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
  .filter((f) => /^[A-Z][A-Z0-9_]*\.md$/.test(f));

const specTypes = new Set(specFiles.map((f) => f.replace(/\.md$/, "")));

// Sanity-check narrative-index references that have no spec & no catalog row.
const narrativeOrphans = [];
for (const widget of narrativeMap.keys()) {
  if (!catalog.has(widget) && !specTypes.has(widget)) {
    narrativeOrphans.push(widget);
  }
}
if (narrativeOrphans.length) {
  console.warn(
    `warn: narrative-index references unknown widget(s) absent from catalog & specs: ${narrativeOrphans.join(", ")}`,
  );
}

const widgets = {};

// Pass 1: every spec file gets considered.
for (const type of specTypes) {
  const relevance = catalog.get(type);
  if (!relevance) {
    console.warn(`warn: spec ${type}.md has no entry in widget-catalog.md — skipping`);
    continue;
  }
  if (relevance === "—") continue; // not PDP-relevant
  const parsed = parseWidgetSpec(type, join(WIDGETS_DIR, `${type}.md`));
  if (!parsed) {
    console.warn(`warn: failed to read spec for ${type}`);
    continue;
  }
  const roles = narrativeMap.get(type) || [];
  if (roles.length === 0) {
    console.warn(`warn: ${type} is PDP-relevant (${relevance}) but has no narrative-index role`);
  }
  widgets[type] = {
    type,
    pdp_relevance: relevance,
    narrative_roles: roles,
    primary_role: roles[0] || null,
    header_supported: parsed.headerSupported,
    layout_supported: parsed.layoutSupported,
    spec_path: `widgets/${type}.md`,
    summary: parsed.summary,
    edit_safety_summary: parsed.editSafetySummary,
  };
}

// Pass 2: ✓ catalog entries without a spec file get a stub.
const checkmarkWithoutSpec = [];
for (const [type, relevance] of catalog.entries()) {
  if (relevance !== "✓") continue;
  if (widgets[type]) continue;
  if (specTypes.has(type)) continue;
  checkmarkWithoutSpec.push(type);
  widgets[type] = {
    type,
    pdp_relevance: relevance,
    narrative_roles: narrativeMap.get(type) || [],
    primary_role: (narrativeMap.get(type) || [])[0] || null,
    header_supported: null,
    layout_supported: null,
    spec_path: null,
    summary: "(no spec)",
    edit_safety_summary: "(no spec)",
  };
}
if (checkmarkWithoutSpec.length) {
  console.warn(
    `warn: ${checkmarkWithoutSpec.length} ✓ widget(s) have catalog entry but no spec file: ${checkmarkWithoutSpec.join(", ")}`,
  );
}

const sortedWidgets = Object.fromEntries(
  Object.entries(widgets).sort(([a], [b]) => a.localeCompare(b)),
);

const payload = {
  generated_at: new Date().toISOString(),
  source_provenance: sourceSha,
  source_count: sourceCount,
  pdp_relevant_count: pdpRelevantCount,
  renderable_count: renderableCount,
  widgets: sortedWidgets,
};

writeFileSync(OUTPUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

console.log(
  `widget-index.json: ${Object.keys(sortedWidgets).length} widgets · ${pdpRelevantCount} ✓ · ${renderableCount - pdpRelevantCount} ○ · written to ${OUTPUT}`,
);
