"use client";

import HighlightableText from "@/components/quiz/HighlightableText";
import { STEM_SCOPE } from "@/lib/highlightRanges";
import type { HighlightRange } from "@/types/models";

export default function QuestionStem({
  text,
  ranges,
  fontScale,
  highlightEnabled,
  onAddHighlight,
  onRemoveHighlight,
}: {
  text: string;
  ranges: HighlightRange[];
  fontScale: number;
  highlightEnabled: boolean;
  onAddHighlight: (scope: string, start: number, end: number) => void;
  onRemoveHighlight: (rangeIndex: number) => void;
}) {
  return (
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
  );
}
