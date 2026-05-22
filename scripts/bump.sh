#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
# bump.sh — bump a plugin version, sync marketplace, log it
#
# Usage:
#   scripts/bump.sh <plugin> <patch|minor|major> [--commit]
#   scripts/bump.sh <patch|minor|major> [--commit]
#     (auto-detects plugin if cwd is inside plugins/<name>/)
#
# Examples:
#   scripts/bump.sh mosaic-buddy patch
#   scripts/bump.sh mosaic-buddy minor --commit
#   cd plugins/mosaic-admin && ../../scripts/bump.sh major
# ──────────────────────────────────────────────────────────

REPO_ROOT="$(git rev-parse --show-toplevel)"
MARKETPLACE="$REPO_ROOT/.claude-plugin/marketplace.json"
CHANGELOG="$REPO_ROOT/CHANGELOG.md"
COMMIT=false
PLUGIN=""
BUMP_TYPE=""

# --- helpers ---

usage() {
  echo "Usage: $0 [--commit] <plugin-name> <patch|minor|major>"
  echo "       $0 [--commit] <patch|minor|major>  (auto-detect plugin from cwd)"
  exit 1
}

die() { echo "Error: $1" >&2; exit 1; }

list_plugins() {
  for d in "$REPO_ROOT"/plugins/*/; do
    [ -f "$d/.claude-plugin/plugin.json" ] && basename "$d"
  done
}

auto_detect_plugin() {
  local cwd="$PWD"
  local plugins_dir="$REPO_ROOT/plugins"
  if [[ "$cwd" == "$plugins_dir/"* ]]; then
    local relative="${cwd#$plugins_dir/}"
    echo "${relative%%/*}"
  fi
}

# --- parse args ---

POSITIONAL=()
for arg in "$@"; do
  case "$arg" in
    --commit) COMMIT=true ;;
    --help|-h) usage ;;
    *) POSITIONAL+=("$arg") ;;
  esac
done

case ${#POSITIONAL[@]} in
  2)
    PLUGIN="${POSITIONAL[0]}"
    BUMP_TYPE="${POSITIONAL[1]}"
    ;;
  1)
    BUMP_TYPE="${POSITIONAL[0]}"
    PLUGIN="$(auto_detect_plugin)"
    [ -z "$PLUGIN" ] && die "Could not auto-detect plugin from cwd. Pass the plugin name explicitly."
    ;;
  *)
    usage
    ;;
esac

# --- validate ---

[[ "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]] || die "Bump type must be patch, minor, or major. Got: $BUMP_TYPE"

PLUGIN_JSON="$REPO_ROOT/plugins/$PLUGIN/.claude-plugin/plugin.json"
[ -f "$PLUGIN_JSON" ] || die "Plugin '$PLUGIN' not found. Available plugins: $(list_plugins | tr '\n' ', ')"
[ -f "$MARKETPLACE" ] || die "Marketplace file not found at $MARKETPLACE"

command -v jq >/dev/null 2>&1 || die "jq is required. Install with: brew install jq"

# --- read current version ---

OLD_VERSION="$(jq -r .version "$PLUGIN_JSON")"
[[ "$OLD_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "Invalid version in plugin.json: $OLD_VERSION"

IFS='.' read -r MAJOR MINOR PATCH <<< "$OLD_VERSION"

# --- compute new version ---

case "$BUMP_TYPE" in
  patch) NEW_VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
  minor) NEW_VERSION="$MAJOR.$((MINOR + 1)).0" ;;
  major) NEW_VERSION="$((MAJOR + 1)).0.0" ;;
esac

# --- update plugin.json ---

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

jq --arg v "$NEW_VERSION" '.version = $v' "$PLUGIN_JSON" > "$TMP" && mv "$TMP" "$PLUGIN_JSON"

# --- update marketplace.json ---

MARKET_OLD_VERSION="$(jq -r --arg name "$PLUGIN" '.plugins[] | select(.name == $name) | .version' "$MARKETPLACE")"

if [ -n "$MARKET_OLD_VERSION" ]; then
  TMP="$(mktemp)"
  jq --arg name "$PLUGIN" --arg v "$NEW_VERSION" \
    '(.plugins[] | select(.name == $name)).version = $v' \
    "$MARKETPLACE" > "$TMP" && mv "$TMP" "$MARKETPLACE"
else
  echo "Warning: '$PLUGIN' not found in marketplace.json — skipped marketplace update." >&2
fi

# --- update changelog ---

DATE="$(date +%Y-%m-%d)"
ENTRY="## [$PLUGIN@$NEW_VERSION] - $DATE
- Bumped from $OLD_VERSION to $NEW_VERSION ($BUMP_TYPE)"

if [ ! -f "$CHANGELOG" ]; then
  cat > "$CHANGELOG" <<HEADER
# Changelog

All notable version changes to plugins in this repository.

$ENTRY
HEADER
else
  # Insert entry after the header block (first blank line after line 1)
  TMP="$(mktemp)"
  {
    head -3 "$CHANGELOG"
    echo ""
    echo "$ENTRY"
    echo ""
    tail -n +4 "$CHANGELOG"
  } > "$TMP" && mv "$TMP" "$CHANGELOG"
fi

# --- summary ---

echo ""
echo "  $PLUGIN: $OLD_VERSION → $NEW_VERSION ($BUMP_TYPE)"
echo ""
echo "  Updated:"
echo "    plugins/$PLUGIN/.claude-plugin/plugin.json"
[ -n "$MARKET_OLD_VERSION" ] && echo "    .claude-plugin/marketplace.json"
echo "    CHANGELOG.md"
echo ""

# --- optional commit ---

if [ "$COMMIT" = true ]; then
  git add "$PLUGIN_JSON" "$MARKETPLACE" "$CHANGELOG"
  git commit -m "chore($PLUGIN): bump version to $NEW_VERSION

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
  echo "  Committed."
fi
