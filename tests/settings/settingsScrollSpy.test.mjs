import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampSettingsScrollTarget,
  resolveSettingsActiveGroup,
  shouldReleaseSettingsScrollLock,
} from '../../src/settings/settingsScrollSpy.ts';

test('programmatic scroll keeps the clicked nav item active across intermediate sections', () => {
  const intermediateGroups = ['shortcuts', 'ai', 'history', 'jsonTransform'];

  assert.deepEqual(
    intermediateGroups.map((group) => resolveSettingsActiveGroup(group, 'about')),
    ['about', 'about', 'about', 'about'],
  );
});

test('scrollspy controls the active nav item when there is no programmatic target', () => {
  assert.equal(resolveSettingsActiveGroup('history', null), 'history');
});

test('programmatic scroll lock releases when the target scroll position is reached', () => {
  assert.equal(shouldReleaseSettingsScrollLock(498.5, 500), true);
  assert.equal(shouldReleaseSettingsScrollLock(440, 500), false);
});

test('programmatic scroll target is clamped to the reachable scroll range', () => {
  assert.equal(clampSettingsScrollTarget(1200, 980), 980);
  assert.equal(clampSettingsScrollTarget(-20, 980), 0);
  assert.equal(clampSettingsScrollTarget(500, 980), 500);
});
