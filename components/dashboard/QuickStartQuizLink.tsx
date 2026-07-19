"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuiz } from "@/app/quiz/new/actions";
import type { QuizScope } from "@/types/models";

const DEFAULT_QUESTION_COUNT = 20;

export default function QuickStartQuizLink({
  scope,
  label,
}: {
  scope: QuizScope;
  label: string;
}) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setStarting(true);
    setError(null);

    const result = await createQuiz({
      topicIds: [],
      difficulties: [],
      scope,
      numQuestions: DEFAULT_QUESTION_COUNT,
      mode: "tutor",
      timeLimitMinutes: null,
    });

    setStarting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(`/quiz/${result.quizId}`);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={starting}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-700"
      >
        <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>
        <span className="flex-shrink-0 text-primary-700 dark:text-primary-400">
          {starting ? "Starting..." : "Start quiz \u2192"}
        </span>
      </button>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
