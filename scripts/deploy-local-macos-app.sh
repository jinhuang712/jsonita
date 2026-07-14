#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/release-common.sh
source "$SCRIPT_DIR/lib/release-common.sh"

readonly APP_NAME="Jsonita.app"
readonly BUNDLE_ID="com.jsonita.app"
readonly INSTALL_DIR="${JSONITA_INSTALL_DIR:-/Applications}"
readonly INSTALL_PATH="$INSTALL_DIR/$APP_NAME"
readonly APP_EXECUTABLE="$INSTALL_PATH/Contents/MacOS/jsonita"

OPEN_AFTER_INSTALL=1
TARGET="${TAURI_MAC_TARGET:-}"

usage() {
  cat <<'USAGE'
Usage: scripts/deploy-local-macos-app.sh [--target <triple>] [--no-open]

Builds a local macOS .app, removes the old /Applications/Jsonita.app app bundle,
installs the new bundle, and launches it by default.

Options:
  --target <triple>  Override Rust target triple. Defaults to host architecture.
  --no-open          Install without launching the app.
  -h, --help         Show this help.

Environment:
  JSONITA_INSTALL_DIR  Install directory, default: /Applications
  TAURI_MAC_TARGET     Target triple, used when --target is not passed
USAGE
}

host_target() {
  case "$(uname -m)" in
    arm64) printf 'aarch64-apple-darwin\n' ;;
    x86_64) printf 'x86_64-apple-darwin\n' ;;
    *) die "Unsupported macOS architecture: $(uname -m)" ;;
  esac
}

plist_value() {
  local plist="$1"
  local key="$2"
  /usr/libexec/PlistBuddy -c "Print :$key" "$plist" 2>/dev/null || true
}

validate_app_bundle() {
  local app_path="$1"
  local plist="$app_path/Contents/Info.plist"

  [[ -d "$app_path" ]] || die "Missing app bundle: $app_path"
  [[ -f "$plist" ]] || die "Missing Info.plist in app bundle: $app_path"

  local bundle_id
  bundle_id="$(plist_value "$plist" CFBundleIdentifier)"
  [[ "$bundle_id" == "$BUNDLE_ID" ]] || die "Unexpected bundle id for $app_path: $bundle_id"
}

remove_existing_app() {
  if [[ ! -e "$INSTALL_PATH" ]]; then
    return
  fi

  validate_app_bundle "$INSTALL_PATH"
  log "Removing old local app: $INSTALL_PATH"
  rm -rf "$INSTALL_PATH"
}

running_app_pids() {
  pgrep -f "^$APP_EXECUTABLE$" || true
}

wait_for_app_exit() {
  local timeout_seconds="$1"
  local deadline=$((SECONDS + timeout_seconds))
  local pids

  while :; do
    pids="$(running_app_pids)"
    [[ -z "$pids" ]] && return 0
    if (( SECONDS >= deadline )); then
      return 1
    fi
    # Poll for the actual process exit; a fixed sleep can replace the bundle
    # while the old executable still owns its web assets.
    sleep 0.1
  done
}

quit_existing_app() {
  local pids
  pids="$(running_app_pids)"
  [[ -z "$pids" ]] && return

  log "Quitting existing Jsonita process: $pids"
  osascript -e "tell application id \"$BUNDLE_ID\" to quit" >/dev/null 2>&1 || true
  if wait_for_app_exit 3; then
    return
  fi

  pids="$(running_app_pids)"
  log "Graceful quit timed out; terminating lingering Jsonita process: $pids"
  kill -TERM $pids || true
  wait_for_app_exit 5 || die "Jsonita did not exit; refusing to replace a bundle still in use."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target)
      [[ $# -ge 2 ]] || die "Missing value for --target"
      TARGET="$2"
      shift 2
      ;;
    --no-open)
      OPEN_AFTER_INSTALL=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

require_macos
require_command ditto
require_command osascript
require_command pgrep

if [[ -z "$TARGET" ]]; then
  TARGET="$(host_target)"
fi

log "Building local macOS app for target: $TARGET"
TAURI_MAC_TARGET="$TARGET" "$SCRIPT_DIR/release-macos-app.sh"

readonly BUILT_APP="$REPO_ROOT/release-artifacts/macos-app/$APP_NAME"
validate_app_bundle "$BUILT_APP"

quit_existing_app
remove_existing_app

log "Installing new local app: $INSTALL_PATH"
mkdir -p "$INSTALL_DIR"
ditto "$BUILT_APP" "$INSTALL_PATH"
validate_app_bundle "$INSTALL_PATH"

local_version="$(plist_value "$INSTALL_PATH/Contents/Info.plist" CFBundleShortVersionString)"
log "Installed $APP_NAME $local_version at $INSTALL_PATH"

if [[ "$OPEN_AFTER_INSTALL" == "1" ]]; then
  log "Launching Jsonita"
  open -a "$INSTALL_PATH"
fi
