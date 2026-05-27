#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/release-common.sh
source "$SCRIPT_DIR/lib/release-common.sh"

require_macos

readonly TARGET="${TAURI_MAC_TARGET:-universal-apple-darwin}"
readonly ARTIFACT_DIR="$(prepare_artifact_dir macos-dmg)"

log "Building macOS DMG for target: $TARGET"
tauri_build --target "$TARGET" --bundles dmg

collect_globs "$ARTIFACT_DIR" \
  "$REPO_ROOT/src-tauri/target/$TARGET/release/bundle/dmg/*.dmg" \
  "$REPO_ROOT/src-tauri/target/release/bundle/dmg/*.dmg"

print_artifacts "$ARTIFACT_DIR"
