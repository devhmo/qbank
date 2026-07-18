"use client";

import { useRef } from "react";
import { splitTextByRanges } from "@/lib/highlightRanges";
import { getSelectionOffsets } from "@/lib/textSelection";
import type { HighlightRange } from "@/types/models";

export default function QuestionStem({
  text,
  ranges,
  onAddHighlight,
  onRemoveHighlight,
}: {
  text: string;
  ranges: HighlightRange[];
  onAddHighlight: (start: number, end: number) => void;
  onRemoveHighlight: (rangeIndex: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleMouseUp() {
    if (!containerRef.current) return;
    const offsets = getSelectionOffsets(containerRef.current);
    if (offsets) {
      onAddHighlight(offsets.start, offsets.end);
      window.getSelection()?.removeAllRanges();
    }
  }

  const segments = splitTextByRanges(text, ranges);

  return (
    <div>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="select-text whitespace-pre-wrap text-base leading-relaxed text-slate-800"
      >
        {segments.map((seg, i) =>
          seg.highlighted ? (
            <mark
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                if (seg.rangeIndex !== null) onRemoveHighlight(seg.rangeIndex);
              }}
              title="Click to remove highlight"
              className="cursor-pointer bg-yellow-200"
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Select text to highlight it. Click a highlight to remove it.
      </p>
    </div>
  );
}
