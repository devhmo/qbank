"use server";

import { createClient } from "@/lib/supabase/server";

export interface SearchResultRow {
  id: string;
  stem: string;
  difficulty: string;
  subjectName: string;
  systemName: string;
  topicName: string;
}

interface RawSearchQuestion {
  id: string;
  stem: string;
  difficulty: string;
  topics: {
    name: string;
    systems: { name: string; subjects: { name: string } | null } | null;
  } | null;
}

export interface SearchResult {
  results?: SearchResultRow[];
  error?: string;
}

// Full-text search across question stems and choice explanations, via the
// trigger-maintained `search_vector` column (see the migration in
// supabase/migrations). `topicIds` narrows to a subject when provided
// (resolved client-side from the catalog tree, same pattern as quiz
// creation's scope filters).
export async function searchQuestions(
  query: string,
  topicIds: string[]
): Promise<SearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { results: [] };

  const supabase = createClient();

  let q = supabase
    .from("questions")
    .select(
      `
      id, stem, difficulty,
      topics ( name, systems ( name, subjects ( name ) ) )
    `
    )
    .eq("status", "published")
    .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
    .limit(50);

  if (topicIds.length > 0) {
    q = q.in("topic_id", topicIds);
  }

  const { data, error } = await q.returns<RawSearchQuestion[]>();
  if (error) return { error: error.message };

  const results: SearchResultRow[] = (data ?? []).map((r) => ({
    id: r.id,
    stem: r.stem,
    difficulty: r.difficulty,
    subjectName: r.topics?.systems?.subjects?.name ?? "Uncategorized",
    systemName: r.topics?.systems?.name ?? "",
    topicName: r.topics?.name ?? "",
  }));

  return { results };
}

export interface StartQuizResult {
  quizId?: string;
  error?: string;
}

// Starts a focused, single-question Tutor-mode quiz directly from a search
// result — there's no standalone "view question" page, so this is how a
// search result becomes something the student can actually do.
export async function startQuizWithQuestion(questionId: string): Promise<StartQuizResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({ user_id: user.id, mode: "tutor" })
    .select("id")
    .single();

  if (quizError || !quiz) {
    return { error: quizError?.message ?? "Failed to start quiz." };
  }

  const { error: qqError } = await supabase
    .from("quiz_questions")
    .insert({ quiz_id: quiz.id, question_id: questionId, order_index: 0 });

  if (qqError) {
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return { error: qqError.message };
  }

  return { quizId: quiz.id };
}
