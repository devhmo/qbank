import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizRunner from "@/components/quiz/QuizRunner";
import type { Quiz, QuizChoice, QuizItem } from "@/types/models";

export default async function QuizTakingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quizRow } = await supabase
    .from("quizzes")
    .select(
      "id, user_id, mode, created_at, submitted_at, time_limit_minutes, paused_at, total_paused_seconds"
    )
    .eq("id", params.id)
    .single();

  if (!quizRow) notFound();

  const quiz = quizRow as Quiz;

  if (quiz.submitted_at) {
    redirect(`/quiz/${quiz.id}/results`);
  }

  const { data: quizQuestions } = await supabase
    .from("quiz_questions")
    .select(
      "id, question_id, selected_choice_id, is_correct, time_spent, eliminated_choice_ids, highlighted_ranges, is_marked, order_index"
    )
    .eq("quiz_id", quiz.id)
    .order("order_index");

  if (!quizQuestions || quizQuestions.length === 0) notFound();

  const questionIds = quizQuestions.map((qq) => qq.question_id as string);

  const { data: questions } = await supabase
    .from("questions")
    .select("id, stem, image_url, difficulty, source")
    .in("id", questionIds);

  // Tutor mode can safely reveal the answer key up front (it shows
  // feedback immediately after each question anyway). Timed/Exam mode
  // never fetches is_correct/explanation until the quiz is submitted, so
  // there's nothing to leak via the page's initial data even if someone
  // inspects it directly.
  const choiceColumns =
    quiz.mode === "tutor"
      ? "id, question_id, text, order_index, is_correct, explanation"
      : "id, question_id, text, order_index";

  const { data: choices } = await supabase
    .from("choices")
    .select(choiceColumns)
    .in("question_id", questionIds)
    .order("order_index");

  const { data: bookmarks } = await supabase
    .from("user_bookmarks")
    .select("question_id")
    .eq("user_id", user.id)
    .in("question_id", questionIds);

  const { data: notes } = await supabase
    .from("user_notes")
    .select("question_id, note_text")
    .eq("user_id", user.id)
    .in("question_id", questionIds);

  const notesByQuestion = new Map((notes ?? []).map((n) => [n.question_id as string, n.note_text as string]));
  const bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.question_id as string));
  const questionsById = new Map((questions ?? []).map((q) => [q.id as string, q]));
  const choicesByQuestion = new Map<string, QuizChoice[]>();
  for (const c of (choices ?? []) as unknown as (QuizChoice & { question_id: string })[]) {
    const list = choicesByQuestion.get(c.question_id) ?? [];
    list.push({
      id: c.id,
      text: c.text,
      order_index: c.order_index,
      ...(quiz.mode === "tutor" ? { is_correct: c.is_correct, explanation: c.explanation } : {}),
    });
    choicesByQuestion.set(c.question_id, list);
  }

  const items: QuizItem[] = quizQuestions.map((qq) => {
    const question = questionsById.get(qq.question_id as string);
    return {
      quizQuestionId: qq.id as string,
      question: {
        id: qq.question_id as string,
        stem: question?.stem ?? "",
        image_url: question?.image_url ?? null,
        difficulty: question?.difficulty ?? "medium",
        source: question?.source ?? null,
        choices: choicesByQuestion.get(qq.question_id as string) ?? [],
      },
      selected_choice_id: qq.selected_choice_id,
      is_correct: qq.is_correct,
      time_spent: qq.time_spent ?? 0,
      eliminated_choice_ids: qq.eliminated_choice_ids ?? [],
      highlighted_ranges: qq.highlighted_ranges ?? [],
      is_marked: qq.is_marked,
      is_bookmarked: bookmarkedIds.has(qq.question_id as string),
      note: notesByQuestion.get(qq.question_id as string) ?? "",
    };
  });

  return <QuizRunner quiz={quiz} initialItems={items} />;
}
