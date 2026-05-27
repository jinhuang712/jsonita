#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/release-common.sh
source "$SCRIPT_DIR/lib/release-common.sh"

require_macos

readonly TARGET="${TAURI_MAC_TARGET:-universal-apple-darwin}"
readonly ARTIFACT_DIR="$(prepare_artifact_dir macos-app)"

log "Building macOS .app for target: $TARGET"
tauri_build --target "$TARGET" --bundles app

collect_globs "$ARTIFACT_DIR" \
  "$REPO_ROOT/src-tauri/target/$TARGET/release/bundle/macos/*.app" \
  "$REPO_ROOT/src-tauri/target/release/bundle/macos/*.app"

print_artifacts "$ARTIFACT_DIR"
