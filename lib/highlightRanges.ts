import type { HighlightRange } from "@/types/models";

export const STEM_SCOPE = "stem";

export function choiceTextScope(choiceId: string): string {
  return `choice:${choiceId}`;
}

export function choiceExplanationScope(choiceId: string): string {
  return `explanation:${choiceId}`;
}

function scopeOf(range: HighlightRange): string {
  return range.scope ?? STEM_SCOPE;
}

// Merges overlapping/adjacent ranges and sorts them, so rendering never
// produces zero-length or overlapping <mark> segments. Callers should keep
// state in this merged form, since rendered segment indices (used for
// click-to-remove) are indices into this merged array.
//
// Merging happens independently per scope — a highlight in the stem can
// never be merged with one in a choice's explanation, even if their
// start/end numbers happen to overlap, since those numbers are offsets
// into two different strings.
export function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  const byScope = new Map<string, HighlightRange[]>();
  for (const r of ranges) {
    const scope = scopeOf(r);
    const group = byScope.get(scope);
    if (group) group.push(r);
    else byScope.set(scope, [r]);
  }

  const result: HighlightRange[] = [];
  for (const [scope, group] of byScope) {
    const sorted = [...group]
      .filter((r) => r.end > r.start)
      .sort((a, b) => a.start - b.start);

    const merged: HighlightRange[] = [];
    for (const r of sorted) {
      const last = merged[merged.length - 1];
      if (last && r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
      } else {
        merged.push({ start: r.start, end: r.end, scope });
      }
    }
    result.push(...merged);
  }
  return result;
}

export interface TextSegment {
  text: string;
  highlighted: boolean;
  rangeIndex: number | null;
}

// Splits `text` into alternating plain/highlighted segments based on the
// (already merged) ranges belonging to `scope`. `rangeIndex` on a
// highlighted segment is its index into the *full, unfiltered* `ranges`
// array — pass that back to onRemoveHighlight to remove just that one,
// regardless of which scope it belongs to.
export function splitTextByRanges(
  text: string,
  ranges: HighlightRange[],
  scope: string = STEM_SCOPE
): TextSegment[] {
  const scoped = ranges
    .map((range, index) => ({ range, index }))
    .filter(({ range }) => scopeOf(range) === scope)
    .sort((a, b) => a.range.start - b.range.start);

  const segments: TextSegment[] = [];
  let cursor = 0;

  scoped.forEach(({ range, index }) => {
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
