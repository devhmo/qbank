"use client";

import { useEffect, useRef } from "react";
import { splitTextByRanges } from "@/lib/highlightRanges";
import { getSelectionOffsets } from "@/lib/textSelection";
import type { HighlightRange } from "@/types/models";

// How long to wait after the selection stops changing before committing it
// as a highlight. Needed because `selectionchange` fires continuously
// while a selection is being dragged/adjusted, not just once at the end.
const SELECTION_SETTLE_MS = 350;

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest handler in a ref so the document-level listener below
  // (registered once) always calls the current one without re-subscribing.
  const onAddHighlightRef = useRef(onAddHighlight);
  onAddHighlightRef.current = onAddHighlight;

  useEffect(() => {
    function commitSelection() {
      const container = containerRef.current;
      if (!container) return;
      const offsets = getSelectionOffsets(container);
      if (offsets) {
        onAddHighlightRef.current(offsets.start, offsets.end);
        window.getSelection()?.removeAllRanges();
      }
    }

    // `selectionchange` (fired on `document`) is the one event that
    // reliably covers BOTH mouse drag-selection on desktop AND touch
    // selection on mobile. `mouseup`/`touchend` alone miss mobile: once a
    // long-press starts text selection, dragging the native selection
    // handles is handled entirely by the OS/browser chrome and never
    // dispatches touch or mouse events back to the page.
    function handleSelectionChange() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(commitSelection, SELECTION_SETTLE_MS);
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Cancel any in-flight (not-yet-committed) selection if the stem content
  // itself changes — e.g. the student navigated to a different question
  // while a debounce was pending — so it can never be misapplied.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text]);

  const segments = splitTextByRanges(text, ranges);

  return (
    <div>
      <div
        ref={containerRef}
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
              title="Tap to remove highlight"
              className="cursor-pointer rounded-sm bg-yellow-200 px-0.5"
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Select text to highlight it. Tap a highlight to remove it.
      </p>
    </div>
  );
}
