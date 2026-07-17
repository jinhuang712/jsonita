#!/usr/bin/env bash
# Sync the app's design-token source into the GitHub Pages site.
#
# Why: docs/ is served raw by GitHub Pages (no build step), but the landing
# site must stay visually identical to the running app. Rather than hand-mirror
# the tokens (which drifts), we copy the single source of truth —
# src/styles/tokens.css — into docs/assets/css/app-tokens.css and the site
# @imports it. Color / spacing / radius / motion / type can never drift from
# the app, because they ARE the app's tokens.
#
# The window-shell markup + component CSS in docs/assets/css/site.css is still
# authored by hand (the real components also rely on inline TSX styles that are
# not shareable without shipping the React runtime); only the token layer is
# shared. Run this whenever src/styles/tokens.css changes.
#
# Usage: bash scripts/sync-docs-assets.sh
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
src="$repo_root/src/styles/tokens.css"
dst="$repo_root/docs/assets/css/app-tokens.css"

if [[ ! -f "$src" ]]; then
  echo "sync-docs-assets: source not found: $src" >&2
  exit 1
fi

{
  echo "/* ==========================================================="
  echo "   GENERATED — do not edit by hand."
  echo "   Source: src/styles/tokens.css  ·  Regenerate: scripts/sync-docs-assets.sh"
  echo "   The GitHub Pages site @imports this so its tokens are identical"
  echo "   to the running app (no hand-mirrored copy that drifts)."
  echo "   =========================================================== */"
  echo ""
  cat "$src"
} > "$dst"

echo "synced tokens → $dst"
