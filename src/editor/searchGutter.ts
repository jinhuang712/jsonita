import type { SearchQuery } from '@codemirror/search';
import { getSearchQuery, searchPanelOpen } from '@codemirror/search';
import { EditorState, RangeSetBuilder, StateField } from '@codemirror/state';
import { GutterMarker, lineNumberMarkers } from '@codemirror/view';
import { collectSearchLineMarkers, type SearchRange } from './searchLineMarkers';

const MAX_GUTTER_MATCHES = 5000;

class SearchLineGutterMarker extends GutterMarker {
  override readonly elementClass: string;

  constructor(readonly active: boolean) {
    super();
    this.elementClass = this.active
      ? 'jsonita-search-line-number jsonita-search-line-number-active'
      : 'jsonita-search-line-number';
  }

  override eq(other: GutterMarker): boolean {
    return other instanceof SearchLineGutterMarker && other.active === this.active;
  }
}

const inactiveMarker = new SearchLineGutterMarker(false);
const activeMarker = new SearchLineGutterMarker(true);

export const jsonitaSearchGutter = StateField.define({
  create(state) {
    return buildSearchLineMarkers(state);
  },
  update(_markers, transaction) {
    return buildSearchLineMarkers(transaction.state);
  },
  provide: (field) => lineNumberMarkers.from(field),
});

function buildSearchLineMarkers(state: EditorState) {
  const builder = new RangeSetBuilder<GutterMarker>();
  const query = getSearchQuery(state);
  if (!searchPanelOpen(state) || !query.valid) return builder.finish();

  const markers = collectLineMarkers(state, query);
  for (const marker of markers) {
    const lineFrom = state.doc.line(marker.lineNumber).from;
    builder.add(lineFrom, lineFrom, marker.active ? activeMarker : inactiveMarker);
  }
  return builder.finish();
}

function collectLineMarkers(state: EditorState, query: SearchQuery) {
  const ranges: SearchRange[] = [];
  const activeRanges: SearchRange[] = [];
  const cursor = query.getCursor(state, 0, state.doc.length);
  let matchCount = 0;
  let next = cursor.next();

  while (!next.done && matchCount < MAX_GUTTER_MATCHES) {
    const match = next.value;
    if (match.to > match.from) {
      const range = { from: match.from, to: match.to };
      ranges.push(range);
      if (isActiveMatch(state, range)) activeRanges.push(range);
      matchCount++;
    }
    next = cursor.next();
  }

  return collectSearchLineMarkers(state.doc.toString(), ranges, activeRanges);
}

function isActiveMatch(state: EditorState, match: { from: number; to: number }): boolean {
  return state.selection.ranges.some(
    (range) => range.from === match.from && range.to === match.to,
  );
}
