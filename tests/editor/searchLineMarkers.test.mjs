import test from 'node:test';
import assert from 'node:assert/strict';

import { collectSearchLineMarkers } from '../../src/editor/searchLineMarkers.ts';

test('deduplicates matches by line and marks the active match line', () => {
  const doc = ['offer_id: 1', 'title: "offer"', 'offer_id: 2 offer_id: 3'].join('\n');

  const markers = collectSearchLineMarkers(
    doc,
    [
      { from: 0, to: 8 },
      { from: 22, to: 30 },
      { from: 34, to: 42 },
      { from: 46, to: 54 },
    ],
    [{ from: 34, to: 42 }],
  );

  assert.deepEqual(markers, [
    { lineNumber: 1, active: false },
    { lineNumber: 2, active: false },
    { lineNumber: 3, active: true },
  ]);
});

test('marks every line touched by a multi-line match', () => {
  const doc = ['before', 'multi', 'line', 'after'].join('\n');

  const markers = collectSearchLineMarkers(
    doc,
    [{ from: 7, to: 17 }],
    [{ from: 7, to: 17 }],
  );

  assert.deepEqual(markers, [
    { lineNumber: 2, active: true },
    { lineNumber: 3, active: true },
  ]);
});

test('ignores empty ranges and sorts output by line number', () => {
  const doc = ['a', 'b', 'c'].join('\n');

  const markers = collectSearchLineMarkers(
    doc,
    [
      { from: 4, to: 5 },
      { from: 0, to: 0 },
      { from: 0, to: 1 },
    ],
    [],
  );

  assert.deepEqual(markers, [
    { lineNumber: 1, active: false },
    { lineNumber: 3, active: false },
  ]);
});

test('marks every selected match line active', () => {
  const doc = ['offer', 'offer', 'offer'].join('\n');

  const markers = collectSearchLineMarkers(
    doc,
    [
      { from: 0, to: 5 },
      { from: 6, to: 11 },
      { from: 12, to: 17 },
    ],
    [
      { from: 0, to: 5 },
      { from: 12, to: 17 },
    ],
  );

  assert.deepEqual(markers, [
    { lineNumber: 1, active: true },
    { lineNumber: 2, active: false },
    { lineNumber: 3, active: true },
  ]);
});
