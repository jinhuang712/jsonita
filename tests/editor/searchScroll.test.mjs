import test from 'node:test';
import assert from 'node:assert/strict';

import { searchScrollOptions } from '../../src/editor/searchScroll.ts';

test('search matches are vertically centered after navigation', () => {
  assert.deepEqual(searchScrollOptions, { y: 'center' });
});
