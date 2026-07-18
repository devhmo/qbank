"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import QuestionStem from "@/components/quiz/QuestionStem";
import ChoiceList from "@/components/quiz/ChoiceList";
import QuestionNavigator from "@/components/quiz/QuestionNavigator";
import QuizTimer from "@/components/quiz/QuizTimer";
import {
  pauseQuiz,
  resumeQuiz,
  saveAnswer,
  submitQuiz,
  toggleBookmark,
  updateQuizQuestionState,
} from "@/app/quiz/[id]/actions";
import { mergeRanges } from "@/lib/highlightRanges";
import type { Quiz, QuizItem } from "@/types/models";

export default function QuizRunner({
  quiz,
  initialItems,
}: {
  quiz: Quiz;
  initialItems: QuizItem[];
}) {
  const router = useRouter();

  const [items, setItems] = useState<QuizItem[]>(initialItems);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = initialItems.findIndex((i) => i.selected_choice_id === null);
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });
  const [quizMeta, setQuizMeta] = useState({
    pausedAt: quiz.paused_at,
    totalPausedSeconds: quiz.total_paused_seconds,
  });
  const [pausing, setPausing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questionStartRef = useRef(Date.now());
  const current = items[currentIndex];
  const isPaused = quizMeta.pausedAt !== null;
  const answeredCount = items.filter((i) => i.selected_choice_id !== null).length;

  function updateItemAt(index: number, patch: Partial<QuizItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  // Computes seconds spent on `index` since the last flush, persists the
  // new total, and resets the clock. Always resets the ref (regardless of
  // caller) so time is never double-counted across an answer-select and a
  // subsequent navigation on the same question.
  function flushTimeSpent(index: number): number {
    const now = Date.now();
    const elapsed = Math.round((now - questionStartRef.current) / 1000);
    questionStartRef.current = now;
    if (elapsed <= 0) return items[index].time_spent;

    const newTotal = items[index].time_spent + elapsed;
    updateItemAt(index, { time_spent: newTotal });
    updateQuizQuestionState(items[index].quizQuestionId, { time_spent: newTotal });
    return newTotal;
  }

  function goToIndex(index: number) {
    if (index === currentIndex || index < 0 || index >= items.length || isPaused) return;
    flushTimeSpent(currentIndex);
    setCurrentIndex(index);
  }

  async function handleSelectChoice(choiceId: string) {
    if (isPaused) return;
    updateItemAt(currentIndex, { selected_choice_id: choiceId });
    const timeSpentTotal = flushTimeSpent(currentIndex);
    const result = await saveAnswer(current.quizQuestionId, choiceId, timeSpentTotal);
    if (result.error) setError(result.error);
  }

  async function handleToggleEliminate(choiceId: string) {
    if (isPaused) return;
    const item = items[currentIndex];
    const next = item.eliminated_choice_ids.includes(choiceId)
      ? item.eliminated_choice_ids.filter((id) => id !== choiceId)
      : [...item.eliminated_choice_ids, choiceId];
    updateItemAt(currentIndex, { eliminated_choice_ids: next });
    const result = await updateQuizQuestionState(item.quizQuestionId, {
      eliminated_choice_ids: next,
    });
    if (result.error) setError(result.error);
  }

  async function handleToggleMark() {
    if (isPaused) return;
    const item = items[currentIndex];
    const next = !item.is_marked;
    updateItemAt(currentIndex, { is_marked: next });
    await updateQuizQuestionState(item.quizQuestionId, { is_marked: next });
  }

  async function handleToggleBookmark() {
    if (isPaused) return;
    const item = items[currentIndex];
    const result = await toggleBookmark(item.question.id);
    if (result.error) {
      setError(result.error);
      return;
    }
    updateItemAt(currentIndex, { is_bookmarked: result.isBookmarked ?? item.is_bookmarked });
  }

  function handleAddHighlight(start: number, end: number) {
    if (isPaused) return;
    const item = items[currentIndex];
    const next = mergeRanges([...item.highlighted_ranges, { start, end }]);
    updateItemAt(currentIndex, { highlighted_ranges: next });
    updateQuizQuestionState(item.quizQuestionId, { highlighted_ranges: next });
  }

  function handleRemoveHighlight(rangeIndex: number) {
    if (isPaused) return;
    const item = items[currentIndex];
    const next = item.highlighted_ranges.filter((_, i) => i !== rangeIndex);
    updateItemAt(currentIndex, { highlighted_ranges: next });
    updateQuizQuestionState(item.quizQuestionId, { highlighted_ranges: next });
  }

  async function handlePause() {
    setPausing(true);
    setQuizMeta((prev) => ({ ...prev, pausedAt: new Date().toISOString() }));
    await pauseQuiz(quiz.id);
    setPausing(false);
  }

  async function handleResume() {
    setPausing(true);
    setQuizMeta((prev) => {
      if (!prev.pausedAt) return prev;
      const pausedSeconds = Math.round((Date.now() - new Date(prev.pausedAt).getTime()) / 1000);
      return {
        pausedAt: null,
        totalPausedSeconds: prev.totalPausedSeconds + Math.max(0, pausedSeconds),
      };
    });
    questionStartRef.current = Date.now();
    await resumeQuiz(quiz.id);
    setPausing(false);
  }

  async function handleSubmit(auto = false) {
    if (submitting) return;
    if (!auto) {
      const confirmed = window.confirm(
        "End quiz now? You won't be able to change your answers after this."
      );
      if (!confirmed) return;
    }

    flushTimeSpent(currentIndex);
    setSubmitting(true);
    const result = await submitQuiz(quiz.id);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push(`/quiz/${quiz.id}/results`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900">
              Question {currentIndex + 1} of {items.length}
            </p>
            <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 sm:w-56">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
              />
            </div>
          </div>

          <QuizTimer
            createdAt={quiz.created_at}
            timeLimitMinutes={quiz.time_limit_minutes}
            totalPausedSeconds={quizMeta.totalPausedSeconds}
            pausedAt={quizMeta.pausedAt}
            pausing={pausing}
            onPause={handlePause}
            onResume={handleResume}
            onExpire={() => handleSubmit(true)}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {isPaused ? (
          <div className="rounded-xl border border-slate-200 bg-white p-16 text-center">
            <p className="text-lg font-semibold text-slate-900">Quiz paused</p>
            <p className="mt-1 text-sm text-slate-500">
              Your timer is frozen. Click Resume when you&rsquo;re ready to continue.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600">
                  {current.question.difficulty}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleToggleBookmark}
                    className={`text-sm font-medium transition ${
                      current.is_bookmarked ? "text-amber-600" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {current.is_bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleMark}
                    className={`text-sm font-medium transition ${
                      current.is_marked ? "text-primary-700" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {current.is_marked ? "🚩 Marked" : "⚑ Mark for review"}
                  </button>
                </div>
              </div>

              {current.question.image_url && (
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-lg border border-slate-200">
                  <Image
                    src={current.question.image_url}
                    alt="Question illustration"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <QuestionStem
                text={current.question.stem}
                ranges={current.highlighted_ranges}
                onAddHighlight={handleAddHighlight}
                onRemoveHighlight={handleRemoveHighlight}
              />

              <div className="mt-6">
                <ChoiceList
                  choices={current.question.choices}
                  selectedChoiceId={current.selected_choice_id}
                  eliminatedIds={current.eliminated_choice_ids}
                  mode={quiz.mode}
                  onSelect={handleSelectChoice}
                  onToggleEliminate={handleToggleEliminate}
                />
              </div>

              {current.question.source && (
                <p className="mt-4 text-xs text-slate-400">Source: {current.question.source}</p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "End Quiz"}
              </button>

              <button
                type="button"
                onClick={() => goToIndex(currentIndex + 1)}
                disabled={currentIndex === items.length - 1}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-sm font-medium text-slate-700">
                Navigator ({answeredCount} of {items.length} answered)
              </p>
              <QuestionNavigator items={items} currentIndex={currentIndex} onJump={goToIndex} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
