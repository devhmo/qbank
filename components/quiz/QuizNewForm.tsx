"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CatalogTreeSelect from "@/components/quiz/CatalogTreeSelect";
import { countMatchingQuestions, createQuiz } from "@/app/quiz/new/actions";
import type { CatalogLookup, DifficultyLevel, QuizScope } from "@/types/models";

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const SCOPE_OPTIONS: { value: QuizScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unanswered", label: "Unanswered" },
  { value: "incorrect", label: "Previously incorrect" },
  { value: "bookmarked", label: "Flagged / Bookmarked" },
];

const inputClasses =
  "block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

export default function QuizNewForm({
  catalog,
  initialScope = "all",
}: {
  catalog: CatalogLookup;
  initialScope?: QuizScope;
}) {
  const router = useRouter();

  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());
  const [difficulties, setDifficulties] = useState<Set<DifficultyLevel>>(new Set());
  const [scope, setScope] = useState<QuizScope>(initialScope);
  const [numQuestions, setNumQuestions] = useState(10);
  const [mode, setMode] = useState<"tutor" | "timed">("tutor");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);

  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCountLoading(true);

    const timeout = setTimeout(async () => {
      const result = await countMatchingQuestions({
        topicIds: [...selectedTopicIds],
        difficulties: [...difficulties],
        scope,
        numQuestions: 1, // irrelevant for a count
        mode: "tutor",
        timeLimitMinutes: null,
      });
      if (!cancelled) {
        setAvailableCount(result.error ? null : result.count ?? 0);
        setCountLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [selectedTopicIds, difficulties, scope]);

  function toggleDifficulty(value: DifficultyLevel) {
    setDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);

    if (numQuestions < 1) {
      setError("Choose at least 1 question.");
      return;
    }
    if (mode === "timed" && timeLimitMinutes < 1) {
      setError("Set a time limit of at least 1 minute.");
      return;
    }

    setSubmitting(true);
    const result = await createQuiz({
      topicIds: [...selectedTopicIds],
      difficulties: [...difficulties],
      scope,
      numQuestions,
      mode,
      timeLimitMinutes: mode === "timed" ? timeLimitMinutes : null,
    });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(`/quiz/${result.quizId}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="block text-sm font-medium text-slate-700">
          Subjects, systems &amp; topics{" "}
          <span className="font-normal text-slate-400">(leave empty for all)</span>
        </p>
        <div className="mt-1">
          <CatalogTreeSelect
            catalog={catalog}
            selectedTopicIds={selectedTopicIds}
            onChange={setSelectedTopicIds}
          />
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium text-slate-700">
          Difficulty <span className="font-normal text-slate-400">(leave empty for all)</span>
        </p>
        <div className="mt-2 flex gap-4">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={difficulties.has(opt.value)}
                onChange={() => toggleDifficulty(opt.value)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium text-slate-700">Scope</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SCOPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-lg border px-3 py-2 text-center text-sm transition ${
                scope === opt.value
                  ? "border-primary-500 bg-primary-50 font-medium text-primary-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="scope"
                value={opt.value}
                checked={scope === opt.value}
                onChange={() => setScope(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {countLoading
          ? "Checking how many questions match..."
          : availableCount === null
            ? ""
            : `${availableCount} question${availableCount === 1 ? "" : "s"} match${availableCount === 1 ? "es" : ""} these filters.`}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="numQuestions" className="block text-sm font-medium text-slate-700">
            Number of questions
          </label>
          <input
            id="numQuestions"
            type="number"
            min={1}
            max={availableCount ?? undefined}
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value, 10) || 0)}
            className={`mt-1 ${inputClasses}`}
          />
        </div>
      </div>

      <div>
        <p className="block text-sm font-medium text-slate-700">Mode</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label
            className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
              mode === "tutor"
                ? "border-primary-500 bg-primary-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="mode"
              className="sr-only"
              checked={mode === "tutor"}
              onChange={() => setMode("tutor")}
            />
            <p className="font-medium text-slate-900">Tutor</p>
            <p className="mt-0.5 text-xs text-slate-500">
              See correct/incorrect and explanations right after each question.
            </p>
          </label>
          <label
            className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
              mode === "timed"
                ? "border-primary-500 bg-primary-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="mode"
              className="sr-only"
              checked={mode === "timed"}
              onChange={() => setMode("timed")}
            />
            <p className="font-medium text-slate-900">Timed / Exam</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Explanations are held back until you finish the quiz.
            </p>
          </label>
        </div>

        {mode === "timed" && (
          <div className="mt-3">
            <label htmlFor="timeLimit" className="block text-sm font-medium text-slate-700">
              Time limit (minutes)
            </label>
            <input
              id="timeLimit"
              type="number"
              min={1}
              value={timeLimitMinutes}
              onChange={(e) => setTimeLimitMinutes(parseInt(e.target.value, 10) || 0)}
              className={`mt-1 max-w-[10rem] ${inputClasses}`}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Starting..." : "Start Quiz"}
      </button>
    </div>
  );
}
