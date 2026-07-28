"use client";

import { useEffect, useRef } from "react";
import { splitTextByRanges } from "@/lib/highlightRanges";
import { getSelectionOffsets } from "@/lib/textSelection";
import type { HighlightRange } from "@/types/models";

// How long to wait after the selection stops changing before committing it
// as a highlight. Needed because `selectionchange` fires continuously
// while a selection is being dragged/adjusted, not just once at the end.
const SELECTION_SETTLE_MS = 350;

// Renders `text` with any highlights belonging to `scope` shown as <mark>,
// and (when `enabled`) turns a text selection made inside it into a new
// highlight for that same scope. Multiple instances of this component can
// be mounted at once (stem + each visible choice's text + explanation) —
// each only reacts to selections made inside its own container, via
// `getSelectionOffsets`'s containment check.
export default function HighlightableText({
  text,
  scope,
  ranges,
  enabled,
  onAddHighlight,
  onRemoveHighlight,
  className,
  style,
}: {
  text: string;
  scope: string;
  ranges: HighlightRange[];
  enabled: boolean;
  onAddHighlight: (scope: string, start: number, end: number) => void;
  onRemoveHighlight: (rangeIndex: number) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the latest values in refs so the document-level listener below
  // (registered once) always sees the current ones without re-subscribing.
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const onAddHighlightRef = useRef(onAddHighlight);
  onAddHighlightRef.current = onAddHighlight;

  useEffect(() => {
    function commitSelection() {
      if (!enabledRef.current) return;
      const container = containerRef.current;
      if (!container) return;
      const offsets = getSelectionOffsets(container);
      if (offsets) {
        onAddHighlightRef.current(scopeRef.current, offsets.start, offsets.end);
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
      if (!enabledRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(commitSelection, SELECTION_SETTLE_MS);
    }

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Cancel any in-flight (not-yet-committed) selection if this instance's
  // own text changes — e.g. the student navigated to a different question
  // while a debounce was pending — so it can never be misapplied.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text]);

  const segments = splitTextByRanges(text, ranges, scope);

  return (
    <div ref={containerRef} className={`select-text whitespace-pre-wrap ${className ?? ""}`} style={style}>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              if (seg.rangeIndex !== null) onRemoveHighlight(seg.rangeIndex);
            }}
            title="Tap to remove highlight"
            className="cursor-pointer rounded-sm bg-yellow-200 px-0.5 text-slate-900 dark:bg-yellow-300/90"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}
