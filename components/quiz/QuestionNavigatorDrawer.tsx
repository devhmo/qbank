"use client";

import { useEffect } from "react";
import { Circle, CircleCheck, CircleX, X } from "lucide-react";
import type { QuizItem } from "@/types/models";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-600 dark:text-green-400",
  medium: "text-amber-600 dark:text-amber-400",
  hard: "text-red-600 dark:text-red-400",
};

export default function QuestionNavigatorDrawer({
  items,
  currentIndex,
  open,
  onClose,
  onJump,
}: {
  items: QuizItem[];
  currentIndex: number;
  open: boolean;
  onClose: () => void;
  onJump: (index: number) => void;
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const answeredCount = items.filter((i) => i.selected_choice_id !== null).length;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Question navigator"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-200 dark:bg-slate-800 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Questions ({answeredCount} of {items.length} answered)
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.map((item, index) => {
            const answered = item.selected_choice_id !== null;
            const isCurrent = index === currentIndex;

            return (
              <button
                key={item.quizQuestionId}
                type="button"
                onClick={() => {
                  onJump(index);
                  onClose();
                }}
                className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700 ${
                  isCurrent ? "bg-primary-50 dark:bg-primary-900/20" : ""
                }`}
              >
                <span className="mt-0.5 flex-shrink-0">
                  {!answered ? (
                    <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                  ) : item.is_correct ? (
                    <CircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <CircleX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    Question {index + 1}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                    {item.question.stem}
                  </span>
                  {answered && (
                    <span
                      className={`mt-0.5 block text-xs font-medium capitalize ${
                        DIFFICULTY_COLORS[item.question.difficulty] ?? "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {item.question.difficulty}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
