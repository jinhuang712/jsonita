export interface SearchRange {
  from: number;
  to: number;
}

export interface SearchLineMarker {
  lineNumber: number;
  active: boolean;
}

export function collectSearchLineMarkers(
  doc: string,
  ranges: readonly SearchRange[],
  activeRanges: readonly SearchRange[],
): SearchLineMarker[] {
  const lineStarts = collectLineStarts(doc);
  const byLine = new Map<number, boolean>();

  for (const range of ranges) {
    if (range.to <= range.from) continue;

    const startLine = lineNumberAt(lineStarts, clamp(range.from, 0, doc.length));
    const endLine = lineNumberAt(lineStarts, clamp(range.to - 1, 0, doc.length));
    const active = activeRanges.some((activeRange) => rangeTouchesActive(range, activeRange));

    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
      byLine.set(lineNumber, (byLine.get(lineNumber) ?? false) || active);
    }
  }

  return [...byLine.entries()]
    .sort(([a], [b]) => a - b)
    .map(([lineNumber, active]) => ({ lineNumber, active }));
}

function collectLineStarts(doc: string): number[] {
  const starts = [0];
  for (let i = 0; i < doc.length; i++) {
    if (doc.charCodeAt(i) === 10) starts.push(i + 1);
  }
  return starts;
}

function lineNumberAt(lineStarts: readonly number[], pos: number): number {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const start = lineStarts[mid];
    const next = lineStarts[mid + 1] ?? Number.POSITIVE_INFINITY;
    if (pos < start) high = mid - 1;
    else if (pos >= next) low = mid + 1;
    else return mid + 1;
  }

  return lineStarts.length;
}

function rangeTouchesActive(range: SearchRange, activeRange: SearchRange): boolean {
  return range.from === activeRange.from && range.to === activeRange.to;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
