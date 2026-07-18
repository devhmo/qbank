import type { HighlightRange } from "@/types/models";

// Merges overlapping/adjacent ranges and sorts them, so rendering never
// produces zero-length or overlapping <mark> segments. Callers should keep
// state in this merged form, since rendered segment indices (used for
// click-to-remove) are indices into this merged array.
export function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  const sorted = [...ranges]
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);

  const merged: HighlightRange[] = [];
  for (const r of sorted) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end);
    } else {
      merged.push({ ...r });
    }
  }
  return merged;
}

export interface TextSegment {
  text: string;
  highlighted: boolean;
  rangeIndex: number | null;
}

// Splits `text` into alternating plain/highlighted segments based on
// (already merged) ranges. `rangeIndex` on a highlighted segment is its
// index into `ranges` — pass that back to remove just that highlight.
export function splitTextByRanges(
  text: string,
  ranges: HighlightRange[]
): TextSegment[] {
  const segments: TextSegment[] = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    const start = Math.max(0, Math.min(range.start, text.length));
    const end = Math.max(start, Math.min(range.end, text.length));

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlighted: false, rangeIndex: null });
    }
    if (end > start) {
      segments.push({ text: text.slice(start, end), highlighted: true, rangeIndex: index });
    }
    cursor = Math.max(cursor, end);
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false, rangeIndex: null });
  }

  return segments;
}
