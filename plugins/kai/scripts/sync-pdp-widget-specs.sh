#!/usr/bin/env bash
# sync-pdp-widget-specs.sh
#
# Re-bundles PDP widget specs from mosaic-meta-repo into the kai plugin's
# bundled reference snapshot. Invoke after spec updates land in
# mosaic-meta-repo to refresh the plugin's copy.
#
# Source:  $META_REPO/docs/specs/pdp-widgets/
# Target:  <plugin-root>/references/admin/pdp-widget-specs/
#
# Override the meta-repo location with $MOSAIC_META_REPO. Default resolves
# to ../../mosaic-meta-repo relative to the plugin root.

set -euo pipefail

# ---------- Pretty-print helpers ----------
YELLOW=$'\033[33m'
GREEN=$'\033[32m'
RED=$'\033[31m'
RESET=$'\033[0m'

log()  { printf '[sync] %s\n' "$*"; }
warn() { printf '%s[sync] %s%s\n' "$YELLOW" "$*" "$RESET"; }
ok()   { printf '%s[sync] %s%s\n' "$GREEN"  "$*" "$RESET"; }
die()  { printf '%s[sync] ERROR: %s%s\n' "$RED" "$*" "$RESET" >&2; exit 1; }

# ---------- Resolve paths ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

DEFAULT_META_REPO="$(cd "$PLUGIN_ROOT/../.." && pwd)/mosaic-meta-repo"
META_REPO="${MOSAIC_META_REPO:-$DEFAULT_META_REPO}"

SOURCE_DIR="$META_REPO/docs/specs/pdp-widgets"
TARGET_DIR="$PLUGIN_ROOT/references/admin/pdp-widget-specs"

log "Plugin root:  $PLUGIN_ROOT"
log "Meta-repo:    $META_REPO"
log "Source:       $SOURCE_DIR"
log "Target:       $TARGET_DIR"

# ---------- Step 1: Verify source exists ----------
if [[ ! -d "$SOURCE_DIR" ]]; then
  die "Source spec dir not found: $SOURCE_DIR (is MOSAIC_META_REPO set correctly?)"
fi
if [[ ! -d "$SOURCE_DIR/widgets" ]]; then
  die "Source widgets/ dir not found: $SOURCE_DIR/widgets"
fi

# ---------- Step 2: Capture meta-repo HEAD SHA ----------
if ! SHA="$(git -C "$META_REPO" rev-parse HEAD 2>/dev/null)"; then
  die "Could not read git SHA from $META_REPO — is it a git repo?"
fi
log "Meta-repo HEAD: $SHA"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
log "Timestamp:    $TIMESTAMP"

# ---------- Step 3: Recreate target dir cleanly ----------
log "Recreating target directory..."
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/widgets"

# ---------- Step 4: Copy filtered file set ----------
# Top-level files we DO want.
TOP_LEVEL_KEEP=(
  "narrative-index.md"
  "widget-catalog.md"
  "actions.md"
  "architecture.md"
  "pipeline.md"
)

# Top-level files we explicitly skip (documented for clarity).
# SKIP: authoring.md, routes.md, section-catalog.md, README.md

log "Copying top-level spec files..."
TOP_COUNT=0
for f in "${TOP_LEVEL_KEEP[@]}"; do
  src="$SOURCE_DIR/$f"
  if [[ -f "$src" ]]; then
    cp "$src" "$TARGET_DIR/$f"
    TOP_COUNT=$((TOP_COUNT + 1))
    log "  + $f"
  else
    warn "  missing (skipped): $f"
  fi
done

# widgets/: keep _conventions.md, _common.md, and every UPPER_SNAKE.md.
# Skip _template.md.
log "Copying widgets/ files..."
WIDGET_COUNT=0
shopt -s nullglob
for src in "$SOURCE_DIR/widgets/"*.md; do
  base="$(basename "$src")"
  case "$base" in
    _template.md)
      continue
      ;;
    _conventions.md|_common.md)
      cp "$src" "$TARGET_DIR/widgets/$base"
      WIDGET_COUNT=$((WIDGET_COUNT + 1))
      log "  + widgets/$base"
      ;;
    *)
      # UPPER_SNAKE.md only: starts with A-Z, contains only A-Z 0-9 _ before .md
      if [[ "$base" =~ ^[A-Z][A-Z0-9_]*\.md$ ]]; then
        cp "$src" "$TARGET_DIR/widgets/$base"
        WIDGET_COUNT=$((WIDGET_COUNT + 1))
        log "  + widgets/$base"
      fi
      ;;
  esac
done
shopt -u nullglob

# ---------- Step 5: Regenerate _provenance.md ----------
PROVENANCE="$TARGET_DIR/_provenance.md"
log "Writing provenance: $PROVENANCE"
cat > "$PROVENANCE" <<EOF
# PDP Widget Specs — Provenance

This directory is a **bundled snapshot** of PDP widget specs sourced from
\`mosaic-meta-repo/docs/specs/pdp-widgets/\`. Do not edit files here by hand —
edit the canonical specs in the meta-repo, then re-run
\`scripts/sync-pdp-widget-specs.sh\` to refresh this snapshot.

## Snapshot info

- **Source repo:** mosaic-meta-repo
- **Source path:** docs/specs/pdp-widgets/
- **Source SHA:** \`$SHA\`
- **Synced at (UTC):** $TIMESTAMP

## File counts

- Top-level spec files: $TOP_COUNT
- Widget spec files (widgets/): $WIDGET_COUNT

## Next step

Commit the regenerated snapshot so the plugin ships the latest specs:

\`\`\`
git add references/admin/pdp-widget-specs
git commit -m "chore: refresh bundled PDP widget specs (meta-repo @ ${SHA:0:7})"
\`\`\`
EOF

# ---------- Step 6: Trigger widget-index.json regeneration ----------
BUILD_SCRIPT="$PLUGIN_ROOT/scripts/build-widget-index.mjs"
if [[ -f "$BUILD_SCRIPT" ]]; then
  log "Regenerating widget-index.json via build-widget-index.mjs..."
  if node "$BUILD_SCRIPT"; then
    ok "widget-index.json regenerated"
  else
    warn "build-widget-index.mjs exited non-zero — widget-index.json may be stale"
  fi
else
  warn "build-widget-index.mjs not found — widget-index.json NOT regenerated. Generate it separately or add the script."
fi

# ---------- Step 7: Final summary ----------
echo ""
ok "Sync complete."
echo "  Top-level files copied:  $TOP_COUNT"
echo "  Widget files copied:     $WIDGET_COUNT"
echo "  Total files copied:      $((TOP_COUNT + WIDGET_COUNT))"
echo "  Meta-repo SHA:           $SHA"
echo "  Timestamp (UTC):         $TIMESTAMP"
echo "  Target path:             $TARGET_DIR"
echo ""
echo "  Next step: review and commit the changes under references/admin/pdp-widget-specs/"

exit 0
