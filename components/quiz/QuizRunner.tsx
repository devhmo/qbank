"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bookmark, ChevronLeft, ChevronRight, Flag, LogOut, Menu, RotateCcw } from "lucide-react";
import QuestionStem from "@/components/quiz/QuestionStem";
import ChoiceList from "@/components/quiz/ChoiceList";
import QuestionNavigatorDrawer from "@/components/quiz/QuestionNavigatorDrawer";
import QuizTimer from "@/components/quiz/QuizTimer";
import NoteEditor from "@/components/notes/NoteEditor";
import ReportIssueButton from "@/components/reports/ReportIssueButton";
import {
  pauseQuiz,
  resetQuizQuestion,
  resumeQuiz,
  saveAnswer,
  submitQuiz,
  toggleBookmark,
  updateQuizQuestionState,
} from "@/app/quiz/[id]/actions";
import { mergeRanges } from "@/lib/highlightRanges";
import {
  applyChoiceClick,
  areAllRevealedExpanded,
  buildInitialState,
  isCorrectRevealed,
} from "@/lib/choiceRevealState";
import type { Quiz, QuizItem } from "@/types/models";

// Extends the server-fetched QuizItem with client-only exploration state:
// which choices have been revealed/expanded in Tutor mode, and whether the
// student has ever navigated to this question ("visited"). None of this is
// persisted as such — only the graded selected_choice_id/is_correct are
// saved to the database; revealed/expanded is reconstructed once per item
// at load time from that same graded state (see buildInitialState), then
// evolves locally as the student clicks around. `visited` starts true only
// for the question shown when the quiz loads, and flips to true for any
// question navigated to afterward.
interface RunnerItem extends QuizItem {
  revealedChoiceIds: string[];
  expandedChoiceIds: string[];
  visited: boolean;
}

function getInitialIndex(items: QuizItem[]): number {
  const firstUnanswered = items.findIndex((i) => i.selected_choice_id === null);
  return firstUnanswered === -1 ? 0 : firstUnanswered;
}

function toRunnerItems(items: QuizItem[], mode: Quiz["mode"], initialIndex: number): RunnerItem[] {
  return items.map((item, index) => {
    const { revealed, expanded } = buildInitialState(item.question.choices, item.selected_choice_id, mode);
    return {
      ...item,
      revealedChoiceIds: [...revealed],
      expandedChoiceIds: [...expanded],
      visited: index === initialIndex,
    };
  });
}

export default function QuizRunner({
  quiz,
  initialItems,
}: {
  quiz: Quiz;
  initialItems: QuizItem[];
}) {
  const router = useRouter();

  const [items, setItems] = useState<RunnerItem[]>(() =>
    toRunnerItems(initialItems, quiz.mode, getInitialIndex(initialItems))
  );
  const [currentIndex, setCurrentIndex] = useState(() => getInitialIndex(initialItems));
  const [quizMeta, setQuizMeta] = useState({
    pausedAt: quiz.paused_at,
    totalPausedSeconds: quiz.total_paused_seconds,
  });
  const [pausing, setPausing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  const questionStartRef = useRef(Date.now());
  const current = items[currentIndex];
  const isPaused = quizMeta.pausedAt !== null;
  const isTutor = quiz.mode === "tutor";

  const revealedSet = new Set(current.revealedChoiceIds);
  const expandedSet = new Set(current.expandedChoiceIds);
  const correctIsRevealed = isCorrectRevealed(current.question.choices, {
    revealed: revealedSet,
    expanded: expandedSet,
  });
  const allExpanded = areAllRevealedExpanded(current.question.choices, {
    revealed: revealedSet,
    expanded: expandedSet,
  });

  function updateItemAt(index: number, patch: Partial<RunnerItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

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
    if (!items[index].visited) {
      updateItemAt(index, { visited: true });
    }
    setCurrentIndex(index);
  }

  // Persists a choice as the graded answer for the current question.
  async function persistAnswer(choiceId: string) {
    updateItemAt(currentIndex, { selected_choice_id: choiceId });
    const timeSpentTotal = flushTimeSpent(currentIndex);
    const result = await saveAnswer(current.quizQuestionId, choiceId, timeSpentTotal);
    if (result.error) setError(result.error);
  }

  // The single entry point for any choice interaction — direct click,
  // or "Show Answer" acting exactly as if the correct choice were clicked.
  async function handleChoiceInteract(choiceId: string) {
    if (isPaused) return;

    if (!isTutor) {
      // Timed/Exam: no reveal/feedback — plain, freely re-selectable pick.
      await persistAnswer(choiceId);
      return;
    }

    const { state: nextState, shouldAnswer } = applyChoiceClick(
      { revealed: revealedSet, expanded: expandedSet },
      current.question.choices,
      choiceId,
      current.selected_choice_id
    );
    updateItemAt(currentIndex, {
      revealedChoiceIds: [...nextState.revealed],
      expandedChoiceIds: [...nextState.expanded],
    });

    if (shouldAnswer) {
      await persistAnswer(choiceId);
    }
  }

  function handleShowAnswer() {
    if (isPaused) return;
    const correctChoice = current.question.choices.find((c) => c.is_correct);
    if (!correctChoice) return;
    handleChoiceInteract(correctChoice.id);
  }

  function handleToggleAllExplanations() {
    if (isPaused) return;
    if (allExpanded) {
      updateItemAt(currentIndex, { expandedChoiceIds: [] });
    } else {
      updateItemAt(currentIndex, { expandedChoiceIds: [...revealedSet] });
    }
  }

  async function handleResetQuestion() {
    if (isPaused || resetting) return;
    const confirmed = window.confirm(
      "Reset this question? Your answer and any revealed explanations will be cleared."
    );
    if (!confirmed) return;

    setResetting(true);
    updateItemAt(currentIndex, {
      selected_choice_id: null,
      is_correct: null,
      revealedChoiceIds: [],
      expandedChoiceIds: [],
    });
    const result = await resetQuizQuestion(current.quizQuestionId);
    setResetting(false);
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

  let explanationButtonLabel = "Show Answer";
  let explanationButtonAction = handleShowAnswer;
  if (correctIsRevealed) {
    explanationButtonLabel = allExpanded ? "Hide All Explanations" : "Show All Explanations";
    explanationButtonAction = handleToggleAllExplanations;
  }

  const toolsPanel = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-700">
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
            current.is_bookmarked
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Bookmark className="h-4 w-4" fill={current.is_bookmarked ? "currentColor" : "none"} />
          {current.is_bookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        <button
          type="button"
          onClick={handleToggleMark}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
            current.is_marked
              ? "text-primary-700 dark:text-primary-400"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <Flag className="h-4 w-4" fill={current.is_marked ? "currentColor" : "none"} />
          {current.is_marked ? "Marked" : "Mark for review"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-3">
        <NoteEditor questionId={current.question.id} initialNote={current.note} />
        <ReportIssueButton questionId={current.question.id} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              Question {currentIndex + 1} of {items.length}
            </p>
            <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 sm:w-56 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-primary-600 transition-all"
                style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setNavigatorOpen(true)}
              aria-label="Open question navigator"
              title="Question navigator"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <QuestionNavigatorDrawer
        items={items}
        currentIndex={currentIndex}
        open={navigatorOpen}
        onClose={() => setNavigatorOpen(false)}
        onJump={goToIndex}
      />

      {error && (
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        </div>
      )}

      {isPaused ? (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Quiz paused</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your timer is frozen. Click Resume when you&rsquo;re ready to continue.
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6 lg:py-10">
          <main className="min-w-0">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-800">
              {current.selected_choice_id !== null && (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                    {current.question.difficulty}
                  </span>
                </div>
              )}

              {current.question.image_url && (
                <div className="relative mb-4 h-64 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
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
                  revealedIds={revealedSet}
                  expandedIds={expandedSet}
                  showFeedback={isTutor}
                  onChoiceClick={handleChoiceInteract}
                  onToggleEliminate={handleToggleEliminate}
                />
              </div>

              {isTutor && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={explanationButtonAction}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {explanationButtonLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetQuestion}
                    disabled={current.revealedChoiceIds.length === 0 || resetting}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {resetting ? "Resetting..." : "Reset Question"}
                  </button>
                </div>
              )}

              {current.question.source && (
                <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                  Source: {current.question.source}
                </p>
              )}
            </div>

            {/* Tools panel: inline on mobile/tablet, moved into the sidebar at lg+ */}
            <div className="mt-4 lg:hidden">{toolsPanel}</div>

            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => goToIndex(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <LogOut className="h-4 w-4" />
                {submitting ? "Submitting..." : "End Quiz"}
              </button>

              <button
                type="button"
                onClick={() => goToIndex(currentIndex + 1)}
                disabled={currentIndex === items.length - 1}
                className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </main>

          <aside className="mt-6 hidden lg:sticky lg:top-24 lg:mt-0 lg:block">{toolsPanel}</aside>
        </div>
      )}
    </div>
  );
}
