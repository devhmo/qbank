"use server";

import { createClient } from "@/lib/supabase/server";
import type { HighlightRange } from "@/types/models";

export interface ActionResult {
  error?: string;
}

// Records the student's answer. Correctness is looked up server-side from
// the `choices` table rather than trusted from the client, and is never
// returned here — Tutor-mode clients already have `is_correct` for every
// choice from the initial page load (safe, since Tutor mode reveals
// feedback immediately anyway) and can show it themselves; Timed/Exam
// clients never fetch it at all until the quiz is submitted. Either way,
// this action's response carries no answer-key information.
export async function saveAnswer(
  quizQuestionId: string,
  choiceId: string,
  timeSpentTotal: number
): Promise<ActionResult> {
  const supabase = createClient();

  const { data: choice, error: choiceError } = await supabase
    .from("choices")
    .select("is_correct")
    .eq("id", choiceId)
    .single();

  if (choiceError || !choice) {
    return { error: choiceError?.message ?? "Couldn't find that choice." };
  }

  const { error } = await supabase
    .from("quiz_questions")
    .update({
      selected_choice_id: choiceId,
      is_correct: choice.is_correct,
      time_spent: timeSpentTotal,
    })
    .eq("id", quizQuestionId);

  if (error) return { error: error.message };
  return {};
}

// General-purpose update for the per-session tools that don't involve
// grading: strikeout state, highlights, the "mark for review" flag, and
// time-on-question bookkeeping when the student navigates away without
// changing their answer.
export async function updateQuizQuestionState(
  quizQuestionId: string,
  patch: {
    eliminated_choice_ids?: string[];
    highlighted_ranges?: HighlightRange[];
    is_marked?: boolean;
    time_spent?: number;
  }
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("quiz_questions")
    .update(patch)
    .eq("id", quizQuestionId);

  if (error) return { error: error.message };
  return {};
}

export interface ToggleBookmarkResult {
  isBookmarked?: boolean;
  error?: string;
}

// The persistent bookmark (separate from the in-session "mark for review").
export async function toggleBookmark(
  questionId: string
): Promise<ToggleBookmarkResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in." };

  const { data: existing } = await supabase
    .from("user_bookmarks")
    .select("question_id")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);
    if (error) return { error: error.message };
    return { isBookmarked: false };
  }

  const { error } = await supabase
    .from("user_bookmarks")
    .insert({ user_id: user.id, question_id: questionId });
  if (error) return { error: error.message };
  return { isBookmarked: true };
}

export async function pauseQuiz(quizId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({ paused_at: new Date().toISOString() })
    .eq("id", quizId);

  if (error) return { error: error.message };
  return {};
}

export async function resumeQuiz(quizId: string): Promise<ActionResult> {
  const supabase = createClient();

  const { data: quiz, error: fetchError } = await supabase
    .from("quizzes")
    .select("paused_at, total_paused_seconds")
    .eq("id", quizId)
    .single();

  if (fetchError || !quiz) {
    return { error: fetchError?.message ?? "Quiz not found." };
  }
  if (!quiz.paused_at) return {}; // already running, nothing to do

  const pausedSeconds = Math.round(
    (Date.now() - new Date(quiz.paused_at).getTime()) / 1000
  );

  const { error } = await supabase
    .from("quizzes")
    .update({
      paused_at: null,
      total_paused_seconds: quiz.total_paused_seconds + Math.max(0, pausedSeconds),
    })
    .eq("id", quizId);

  if (error) return { error: error.message };
  return {};
}

export async function submitQuiz(quizId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("quizzes")
    .update({ submitted_at: new Date().toISOString() })
    .eq("id", quizId);

  if (error) return { error: error.message };
  return {};
}
