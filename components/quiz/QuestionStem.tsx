"use client";

import { useEffect, useRef, useState } from "react";
import { Highlighter } from "lucide-react";
import HighlightableText from "@/components/quiz/HighlightableText";
import { STEM_SCOPE } from "@/lib/highlightRanges";
import type { HighlightRange } from "@/types/models";

const TOOLTIP_TEXT = "Select text to highlight it. Tap a highlight to remove it.";
const AUTO_DISMISS_MS = 4000;

export default function QuestionStem({
  text,
  ranges,
  fontScale,
  highlightEnabled,
  onToggleHighlight,
  onAddHighlight,
  onRemoveHighlight,
}: {
  text: string;
  ranges: HighlightRange[];
  fontScale: number;
  highlightEnabled: boolean;
  onToggleHighlight: () => void;
  onAddHighlight: (scope: string, start: number, end: number) => void;
  onRemoveHighlight: (rangeIndex: number) => void;
}) {
  const [showTip, setShowTip] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Briefly surface the instructional tip whenever highlighting is turned
  // on, instead of showing it permanently under the stem.
  useEffect(() => {
    if (!highlightEnabled) {
      setShowTip(false);
      return;
    }
    setShowTip(true);
    dismissTimer.current = setTimeout(() => setShowTip(false), AUTO_DISMISS_MS);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [highlightEnabled]);

  return (
    <div>
      <HighlightableText
        text={text}
        scope={STEM_SCOPE}
        ranges={ranges}
        enabled={highlightEnabled}
        onAddHighlight={onAddHighlight}
        onRemoveHighlight={onRemoveHighlight}
        className="font-medium leading-relaxed text-slate-900 dark:text-slate-100"
        style={{ fontSize: `calc(1.05rem * ${fontScale})` }}
      />

      <div className="relative mt-2 inline-block">
        <button
          type="button"
          onClick={onToggleHighlight}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          aria-pressed={highlightEnabled}
          aria-label={highlightEnabled ? "Turn off highlighting" : "Turn on highlighting"}
          title="Highlight text"
          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${
            highlightEnabled
              ? "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
              : "border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <Highlighter className="h-3.5 w-3.5" />
        </button>

        {showTip && (
          <div
            role="tooltip"
            className="absolute left-0 top-full z-20 mt-1.5 w-60 rounded-lg border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-600 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {TOOLTIP_TEXT}
          </div>
        )}
      </div>
    </div>
  );
}
