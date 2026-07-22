"use client";

import { X } from "lucide-react";
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
    <div className="space-y-3">
      {choices.map((choice, index) => {
        const isEliminated = eliminatedIds.includes(choice.id);
        const isSelected = choice.id === selectedChoiceId;
        const isCorrectChoice = showFeedback && choice.is_correct === true;
        const isWrongSelected = showFeedback && isSelected && choice.is_correct === false;

        return (
          <div key={choice.id}>
            <div
              className={`group flex items-start gap-3 rounded-xl border p-3.5 shadow-sm transition ${
                isCorrectChoice
                  ? "border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-900/30"
                  : isWrongSelected
                    ? "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30"
                    : isSelected
                      ? "border-primary-500 bg-primary-50 dark:border-primary-500 dark:bg-primary-900/30"
                      : isEliminated
                        ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                        : "border-slate-200 bg-white hover:border-primary-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-primary-600"
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
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition ${
                    isSelected
                      ? "bg-primary-600 text-white"
                      : isCorrectChoice
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

            {showFeedback && choice.explanation && (
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
