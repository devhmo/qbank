"use client";

import type { QuizChoice, QuizMode } from "@/types/models";

const LETTERS = "ABCDEFGHIJ";

export default function ChoiceList({
  choices,
  selectedChoiceId,
  eliminatedIds,
  mode,
  onSelect,
  onToggleEliminate,
}: {
  choices: QuizChoice[];
  selectedChoiceId: string | null;
  eliminatedIds: string[];
  mode: QuizMode;
  onSelect: (choiceId: string) => void;
  onToggleEliminate: (choiceId: string) => void;
}) {
  const answered = selectedChoiceId !== null;
  // Tutor mode locks the answer in once submitted, matching how immediate
  // feedback is meant to work — Timed/Exam mode shows no feedback, so
  // there's no reason to lock the answer and every reason to let the
  // student change their mind before time runs out.
  const locked = mode === "tutor" && answered;
  const showFeedback = mode === "tutor" && answered;

  return (
    <div className="space-y-2">
      {choices.map((choice, index) => {
        const isEliminated = eliminatedIds.includes(choice.id);
        const isSelected = choice.id === selectedChoiceId;
        const isCorrectChoice = showFeedback && choice.is_correct === true;
        const isWrongSelected = showFeedback && isSelected && choice.is_correct === false;

        return (
          <div key={choice.id}>
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 transition ${
                isCorrectChoice
                  ? "border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/30"
                  : isWrongSelected
                    ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                    : isSelected
                      ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (isEliminated || locked) return;
                  onSelect(choice.id);
                }}
                disabled={isEliminated || locked}
                className={`flex flex-1 items-start gap-3 text-left ${
                  isEliminated || locked ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                    isSelected
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400"
                  }`}
                >
                  {LETTERS[index] ?? index + 1}
                </span>
                <span
                  className={`text-sm ${
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
                className="flex-shrink-0 rounded px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-400"
              >
                {isEliminated ? "Undo" : "Strike"}
              </button>
            </div>

            {showFeedback && choice.explanation && (
              <p className="mt-1 px-3 text-sm text-slate-600 dark:text-slate-400">{choice.explanation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
