import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldCloseSettingsOnKeyDown } from '../../src/settings/settingsKeymap.ts';

function keyEvent(overrides = {}) {
  return {
    key: 'Escape',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...overrides,
  };
}

test('plain Escape closes the settings page when it is open', () => {
  assert.equal(shouldCloseSettingsOnKeyDown(true, keyEvent()), true);
});

test('Escape does not close settings when the settings page is not open', () => {
  assert.equal(shouldCloseSettingsOnKeyDown(false, keyEvent()), false);
});

test('modified Escape does not close the settings page', () => {
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey']) {
    assert.equal(
      shouldCloseSettingsOnKeyDown(true, keyEvent({ [modifier]: true })),
      false,
      modifier,
    );
  }
});

test('non-Escape keys do not close the settings page', () => {
  assert.equal(shouldCloseSettingsOnKeyDown(true, keyEvent({ key: 'Enter' })), false);
});
