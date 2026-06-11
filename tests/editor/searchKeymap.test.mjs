import test from 'node:test';
import assert from 'node:assert/strict';

import { searchKeymap } from '@codemirror/search';

import {
  jsonitaSearchKeymap,
  searchPanelToggleAction,
  withoutDefaultSearchOpenBinding,
} from '../../src/editor/searchKeymap.ts';

test('mod-f opens search when the panel is closed and closes it when open', () => {
  assert.equal(searchPanelToggleAction(false), 'open');
  assert.equal(searchPanelToggleAction(true), 'close');
});

test('jsonita search keymap replaces the default mod-f binding', () => {
  const filtered = withoutDefaultSearchOpenBinding(searchKeymap);

  assert.equal(filtered.some((binding) => binding.key === 'Mod-f'), false);
  assert.equal(jsonitaSearchKeymap[0].key, 'Mod-f');
  assert.equal(jsonitaSearchKeymap[0].scope, 'editor search-panel');
  assert.equal(jsonitaSearchKeymap[0].preventDefault, true);
});

test('jsonita search keymap keeps search navigation bindings but does not add mod-r', () => {
  assert.equal(jsonitaSearchKeymap.some((binding) => binding.key === 'F3'), true);
  assert.equal(jsonitaSearchKeymap.some((binding) => binding.key === 'Mod-g'), true);
  assert.equal(jsonitaSearchKeymap.some((binding) => binding.key === 'Mod-r'), false);
});
