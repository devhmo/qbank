"use client";

import type { QuizItem } from "@/types/models";

export default function QuestionNavigator({
  items,
  currentIndex,
  onJump,
}: {
  items: QuizItem[];
  currentIndex: number;
  onJump: (index: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2">
        {items.map((item, index) => {
          const answered = item.selected_choice_id !== null;
          const isCurrent = index === currentIndex;

          return (
            <button
              key={item.quizQuestionId}
              type="button"
              onClick={() => onJump(index)}
              title={`Question ${index + 1}${item.is_marked ? " (marked)" : ""}${answered ? " — answered" : ""}`}
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition ${
                isCurrent ? "ring-2 ring-offset-1 ring-slate-900 dark:ring-slate-100 dark:ring-offset-slate-900" : ""
              } ${
                answered
                  ? "border-primary-600 bg-primary-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {index + 1}
              {item.is_marked && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-white bg-amber-500 dark:border-slate-800" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-primary-600 bg-primary-600" /> Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800" /> Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Marked for review
        </span>
      </div>
    </div>
  );
}
