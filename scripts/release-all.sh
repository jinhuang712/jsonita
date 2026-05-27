#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/release-common.sh
source "$SCRIPT_DIR/lib/release-common.sh"

if is_macos; then
  log "Host is macOS; building macOS release artifacts."
  bash "$SCRIPT_DIR/release-macos-dmg.sh"
  bash "$SCRIPT_DIR/release-macos-app.sh"
  log "Windows .exe artifacts must be built on a Windows/MSVC runner."
elif is_windows_shell; then
  log "Host is Windows shell; building Windows release artifacts."
  bash "$SCRIPT_DIR/release-windows-exe.sh"
  log "macOS .dmg/.app artifacts must be built on a macOS runner."
else
  die "Unsupported release host: $(host_os). Use macOS for dmg/app or Windows Git Bash/MSYS for exe."
fi
