#!/usr/bin/env bash

set -euo pipefail

readonly RELEASE_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "$RELEASE_LIB_DIR/../.." && pwd)"
readonly RELEASE_ARTIFACT_DIR="${RELEASE_ARTIFACT_DIR:-$REPO_ROOT/release-artifacts}"

log() {
  printf '[release] %s\n' "$*"
}

die() {
  printf '[release:error] %s\n' "$*" >&2
  exit 1
}

host_os() {
  uname -s
}

is_macos() {
  [[ "$(host_os)" == "Darwin" ]]
}

is_windows_shell() {
  case "$(host_os)" in
    MINGW*|MSYS*|CYGWIN*) return 0 ;;
    *) return 1 ;;
  esac
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

require_macos() {
  is_macos || die "This script must run on macOS. Current host: $(host_os)"
}

require_windows_shell() {
  is_windows_shell || die "This script must run from Git Bash/MSYS/Cygwin on Windows. Current host: $(host_os)"
}

prepare_artifact_dir() {
  local name="$1"
  local dir="$RELEASE_ARTIFACT_DIR/$name"
  rm -rf "$dir"
  mkdir -p "$dir"
  printf '%s\n' "$dir"
}

tauri_build() {
  require_command pnpm

  local args=(tauri build "$@")

  if [[ "${TAURI_CI:-}" == "1" || "${CI:-}" == "true" ]]; then
    args+=(--ci)
  fi

  if [[ "${TAURI_NO_SIGN:-}" == "1" || "${TAURI_NO_SIGN:-}" == "true" ]]; then
    args+=(--no-sign)
  fi

  log "Running: pnpm ${args[*]}"
  (cd "$REPO_ROOT" && pnpm "${args[@]}")
}

copy_artifact() {
  local src="$1"
  local dest_dir="$2"
  local dest="$dest_dir/$(basename "$src")"

  if [[ -e "$dest" ]]; then
    rm -rf "$dest"
  fi

  if [[ -d "$src" && "$(host_os)" == "Darwin" ]] && command -v ditto >/dev/null 2>&1; then
    ditto "$src" "$dest"
  elif [[ -d "$src" ]]; then
    cp -R "$src" "$dest_dir/"
  else
    cp "$src" "$dest_dir/"
  fi
}

collect_globs() {
  local dest_dir="$1"
  shift

  local found=0
  local pattern
  for pattern in "$@"; do
    local match
    while IFS= read -r match; do
      [[ -n "$match" ]] || continue
      copy_artifact "$match" "$dest_dir"
      found=1
    done < <(compgen -G "$pattern" || true)
  done

  [[ "$found" == "1" ]] || die "No artifacts matched the expected bundle paths."
}

print_artifacts() {
  local dir="$1"
  log "Artifacts copied to: $dir"
  find "$dir" -mindepth 1 -maxdepth 1 \( -type f -o -type d \) -print | sort
}
