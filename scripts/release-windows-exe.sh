#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/release-common.sh
source "$SCRIPT_DIR/lib/release-common.sh"

require_windows_shell

readonly TARGET="${TAURI_WINDOWS_TARGET:-x86_64-pc-windows-msvc}"
readonly ARTIFACT_DIR="$(prepare_artifact_dir windows-exe)"

log "Building Windows installer .exe with NSIS for target: $TARGET"
tauri_build --target "$TARGET" --bundles nsis

collect_globs "$ARTIFACT_DIR" \
  "$REPO_ROOT/src-tauri/target/$TARGET/release/bundle/nsis/*.exe" \
  "$REPO_ROOT/src-tauri/target/release/bundle/nsis/*.exe"

print_artifacts "$ARTIFACT_DIR"
