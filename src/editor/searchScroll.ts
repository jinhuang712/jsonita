import type { SelectionRange, StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export const searchScrollOptions = { y: 'center' } as const;

export function centerSearchMatch(
  range: SelectionRange,
  _view: EditorView,
): StateEffect<unknown> {
  return EditorView.scrollIntoView(range, searchScrollOptions);
}
