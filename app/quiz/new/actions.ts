"use server";

import { createClient } from "@/lib/supabase/server";
import type { QuizCreateFilters } from "@/types/models";

type SupabaseServerClient = ReturnType<typeof createClient>;

export interface CreateQuizResult {
  quizId?: string;
  error?: string;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Resolves a student's filters into the list of matching, published
// question ids. Shared by countMatchingQuestions (live count on the form)
// and createQuiz (the actual quiz assembly), so they can never disagree.
async function resolveMatchingQuestionIds(
  supabase: SupabaseServerClient,
  userId: string,
  filters: QuizCreateFilters
): Promise<{ ids?: string[]; error?: string }> {
  let excludeIds: string[] = [];
  let restrictToIds: string[] | null = null;

  if (filters.scope === "unanswered" || filters.scope === "incorrect") {
    const { data: userQuizzes } = await supabase
      .from("quizzes")
      .select("id")
      .eq("user_id", userId);
    const quizIds = (userQuizzes ?? []).map((q) => q.id as string);

    if (quizIds.length > 0) {
      if (filters.scope === "unanswered") {
        const { data } = await supabase
          .from("quiz_questions")
          .select("question_id")
          .in("quiz_id", quizIds)
          .not("selected_choice_id", "is", null);
        excludeIds = [...new Set((data ?? []).map((r) => r.question_id as string))];
      } else {
        const { data } = await supabase
          .from("quiz_questions")
          .select("question_id")
          .in("quiz_id", quizIds)
          .eq("is_correct", false);
        restrictToIds = [...new Set((data ?? []).map((r) => r.question_id as string))];
      }
    } else if (filters.scope === "incorrect") {
      restrictToIds = [];
    }
  } else if (filters.scope === "bookmarked") {
    const { data } = await supabase
      .from("user_bookmarks")
      .select("question_id")
      .eq("user_id", userId);
    restrictToIds = (data ?? []).map((r) => r.question_id as string);
  }

  if (restrictToIds !== null && restrictToIds.length === 0) {
    return { ids: [] };
  }

  let query = supabase
    .from("questions")
    .select("id")
    .eq("status", "published")
    .limit(1000);

  if (filters.topicIds.length > 0) {
    query = query.in("topic_id", filters.topicIds);
  }
  if (filters.difficulties.length > 0) {
    query = query.in("difficulty", filters.difficulties);
  }
  if (restrictToIds !== null) {
    query = query.in("id", restrictToIds);
  }
  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { ids: (data ?? []).map((m) => m.id as string) };
}

export interface CountResult {
  count?: number;
  error?: string;
}

export async function countMatchingQuestions(
  filters: QuizCreateFilters
): Promise<CountResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in." };

  const result = await resolveMatchingQuestionIds(supabase, user.id, filters);
  if (result.error) return { error: result.error };
  return { count: result.ids?.length ?? 0 };
}

export async function createQuiz(
  filters: QuizCreateFilters
): Promise<CreateQuizResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to start a quiz." };
  }

  if (filters.numQuestions < 1) {
    return { error: "Choose at least 1 question." };
  }
  if (filters.mode === "timed" && (!filters.timeLimitMinutes || filters.timeLimitMinutes < 1)) {
    return { error: "Set a time limit of at least 1 minute for Timed mode." };
  }

  const matchResult = await resolveMatchingQuestionIds(supabase, user.id, filters);
  if (matchResult.error) {
    return { error: matchResult.error };
  }
  const matches = matchResult.ids ?? [];
  if (matches.length === 0) {
    return { error: "No questions match those filters. Try broadening them." };
  }

  const selected = shuffle(matches).slice(0, filters.numQuestions);

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      user_id: user.id,
      mode: filters.mode,
      time_limit_minutes: filters.mode === "timed" ? filters.timeLimitMinutes : null,
    })
    .select("id")
    .single();

  if (quizError || !quiz) {
    return { error: quizError?.message ?? "Failed to create quiz." };
  }

  const { error: qqError } = await supabase.from("quiz_questions").insert(
    selected.map((questionId, index) => ({
      quiz_id: quiz.id,
      question_id: questionId,
      order_index: index,
    }))
  );

  if (qqError) {
    // Compensating cleanup, same pattern used elsewhere in the app: don't
    // leave a quiz with zero questions behind.
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return { error: qqError.message };
  }

  return { quizId: quiz.id };
}
