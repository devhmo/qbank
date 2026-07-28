"use client";

import { Strikethrough } from "lucide-react";
import HighlightableText from "@/components/quiz/HighlightableText";
import { choiceExplanationScope, choiceTextScope } from "@/lib/highlightRanges";
import type { HighlightRange, QuizChoice } from "@/types/models";

const LETTERS = "ABCDEFGHIJ";

// If the user just finished dragging out a text selection (e.g. to
// highlight part of a choice), the browser still fires a `click` on
// mouseup/tap-release. Without this guard that click would be read as
// "select this choice," grading it as a side effect of highlighting.
function hasActiveSelection(): boolean {
  const selection = window.getSelection();
  return !!selection && !selection.isCollapsed && selection.toString().length > 0;
}

export default function ChoiceList({
  choices,
  selectedChoiceId,
  eliminatedIds,
  revealedIds,
  expandedIds,
  showFeedback,
  highlightRanges,
  highlightEnabled,
  fontScale,
  onChoiceClick,
  onToggleEliminate,
  onAddHighlight,
  onRemoveHighlight,
}: {
  choices: QuizChoice[];
  selectedChoiceId: string | null;
  eliminatedIds: string[];
  revealedIds: Set<string>;
  expandedIds: Set<string>;
  showFeedback: boolean;
  highlightRanges: HighlightRange[];
  highlightEnabled: boolean;
  fontScale: number;
  onChoiceClick: (choiceId: string) => void;
  onToggleEliminate: (choiceId: string) => void;
  onAddHighlight: (scope: string, start: number, end: number) => void;
  onRemoveHighlight: (rangeIndex: number) => void;
}) {
  return (
    <div className="space-y-2">
      {choices.map((choice, index) => {
        const isEliminated = eliminatedIds.includes(choice.id);
        const isSelected = choice.id === selectedChoiceId;
        const isRevealed = showFeedback && revealedIds.has(choice.id);
        const isExpanded = expandedIds.has(choice.id);
        const isCorrectRevealed = isRevealed && choice.is_correct === true;
        const isWrongRevealed = isRevealed && choice.is_correct === false;

        return (
          <div key={choice.id}>
            <div
              className={`group flex items-start gap-3 rounded-xl border border-l-4 p-3.5 shadow-sm transition ${
                isCorrectRevealed
                  ? "border-slate-200 border-l-green-500 bg-green-50 dark:border-slate-700 dark:border-l-green-500 dark:bg-green-900/20"
                  : isWrongRevealed
                    ? "border-slate-200 border-l-red-500 bg-red-50 dark:border-slate-700 dark:border-l-red-500 dark:bg-red-900/20"
                    : isSelected
                      ? "border-primary-500 border-l-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30"
                      : isEliminated
                        ? "border-slate-200 border-l-slate-200 bg-slate-50 dark:border-slate-700 dark:border-l-slate-700 dark:bg-slate-900"
                        : "border-slate-200 border-l-slate-200 bg-white hover:border-primary-300 hover:border-l-primary-300 hover:shadow-md dark:border-slate-700 dark:border-l-slate-700 dark:bg-slate-800 dark:hover:border-primary-600 dark:hover:border-l-primary-600"
              }`}
            >
              <div
                role="button"
                tabIndex={isEliminated ? -1 : 0}
                aria-disabled={isEliminated}
                onClick={() => {
                  if (isEliminated || hasActiveSelection()) return;
                  onChoiceClick(choice.id);
                }}
                onKeyDown={(e) => {
                  if (isEliminated) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChoiceClick(choice.id);
                  }
                }}
                className={`flex flex-1 items-start gap-3 text-left ${
                  isEliminated ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <span
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                    isCorrectRevealed
                      ? "bg-green-600 text-white"
                      : isWrongRevealed
                        ? "bg-red-600 text-white"
                        : isSelected
                          ? "bg-primary-600 text-white"
                          : "bg-slate-100 text-slate-600 group-hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:group-hover:bg-slate-600"
                  }`}
                >
                  {LETTERS[index] ?? index + 1}
                </span>
                <HighlightableText
                  text={choice.text}
                  scope={choiceTextScope(choice.id)}
                  ranges={highlightRanges}
                  enabled={highlightEnabled && !isEliminated}
                  onAddHighlight={onAddHighlight}
                  onRemoveHighlight={onRemoveHighlight}
                  className={`mt-1 text-sm ${
                    isEliminated ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
                  }`}
                  style={{ fontSize: `calc(0.875rem * ${fontScale})` }}
                />
              </div>

              <button
                type="button"
                onClick={() => onToggleEliminate(choice.id)}
                title={isEliminated ? "Restore this choice" : "Strike out this choice"}
                aria-pressed={isEliminated}
                aria-label={isEliminated ? "Restore this choice" : "Strike out this choice"}
                className={`flex-shrink-0 rounded-full p-1.5 transition ${
                  isEliminated
                    ? "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                    : "text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-400"
                }`}
              >
                <Strikethrough className="h-4 w-4" strokeWidth={isEliminated ? 2.75 : 2} />
              </button>
            </div>

            {isRevealed && isExpanded && choice.explanation && (
              <div className="mt-1.5 px-3.5">
                <HighlightableText
                  text={choice.explanation}
                  scope={choiceExplanationScope(choice.id)}
                  ranges={highlightRanges}
                  enabled={highlightEnabled}
                  onAddHighlight={onAddHighlight}
                  onRemoveHighlight={onRemoveHighlight}
                  className="text-sm leading-relaxed text-slate-600 dark:text-slate-400"
                  style={{ fontSize: `calc(0.875rem * ${fontScale})` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
