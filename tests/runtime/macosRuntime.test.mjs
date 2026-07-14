import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('macOS activation moves Jsonita to the active Space instead of relying on all-Spaces visibility', () => {
  const panel = read('src-tauri/src/window/nspanel.rs');

  assert.match(panel, /NSWindowCollectionBehaviorMoveToActiveSpace/);
  assert.doesNotMatch(panel, /NSWindowCollectionBehaviorCanJoinAllSpaces/);
  assert.match(panel, /NSWindowCollectionBehaviorStationary/);
  assert.match(panel, /NSWindowCollectionBehaviorFullScreenAuxiliary/);
});

test('local macOS deployment waits for the installed app process to exit before replacing its bundle', () => {
  const deploy = read('scripts/deploy-local-macos-app.sh');

  assert.match(deploy, /running_app_pids\(\)/);
  assert.match(deploy, /wait_for_app_exit\(\)/);
  assert.match(deploy, /kill -TERM/);
  assert.match(deploy, /wait_for_app_exit 5 \|\| die/);
  assert.doesNotMatch(deploy, /osascript[^\n]+\n\s*sleep 1\n\s*remove_existing_app/);
});
