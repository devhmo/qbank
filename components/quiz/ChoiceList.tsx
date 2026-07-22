"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { applyChoiceClick, buildInitialState, type RevealState } from "@/lib/choiceRevealState";
import type { QuizChoice, QuizMode } from "@/types/models";

const LETTERS = "ABCDEFGHIJ";

export default function ChoiceList({
  choices,
  selectedChoiceId,
  eliminatedIds,
  mode,
  onAnswer,
  onToggleEliminate,
}: {
  choices: QuizChoice[];
  selectedChoiceId: string | null;
  eliminatedIds: string[];
  mode: QuizMode;
  onAnswer: (choiceId: string) => void;
  onToggleEliminate: (choiceId: string) => void;
}) {
  const [{ revealed, expanded }, setState] = useState<RevealState>(() =>
    buildInitialState(choices, selectedChoiceId, mode)
  );

  function handleClick(choiceId: string) {
    if (eliminatedIds.includes(choiceId)) return;

    if (mode !== "tutor") {
      // Timed/Exam: no reveal/feedback at all — just a plain, freely
      // re-selectable pick, matching the existing behavior.
      onAnswer(choiceId);
      return;
    }

    const { state: nextState, shouldAnswer } = applyChoiceClick(
      { revealed, expanded },
      choices,
      choiceId,
      selectedChoiceId
    );
    setState(nextState);

    // The first choice ever clicked is the graded answer — later clicks
    // (exploring why other choices are wrong, or finding the correct one
    // after guessing) don't change what was already graded.
    if (shouldAnswer) {
      onAnswer(choiceId);
    }
  }

  return (
    <div className="space-y-2">
      {choices.map((choice, index) => {
        const isEliminated = eliminatedIds.includes(choice.id);
        const isSelected = choice.id === selectedChoiceId;
        const isRevealed = mode === "tutor" && revealed.has(choice.id);
        const isExpanded = expanded.has(choice.id);
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
              <button
                type="button"
                onClick={() => {
                  if (isEliminated) return;
                  handleClick(choice.id);
                }}
                disabled={isEliminated}
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
                <span
                  className={`mt-1 text-sm ${
                    isEliminated ? "text-slate-400 line-through dark:text-slate-500" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {choice.text}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleEliminate(choice.id)}
                title={isEliminated ? "Restore this choice" : "Strike out this choice"}
                className={`flex-shrink-0 rounded-full p-1.5 transition ${
                  isEliminated
                    ? "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-300 dark:hover:bg-slate-500"
                    : "text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-400"
                }`}
              >
                <X className="h-4 w-4" strokeWidth={isEliminated ? 3 : 2} />
              </button>
            </div>

            {isRevealed && isExpanded && choice.explanation && (
              <p className="mt-1.5 px-3.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {choice.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
