import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ResultsQuestionReview from "@/components/quiz/ResultsQuestionReview";
import { computeOverallScore, computeSubjectBreakdown } from "@/lib/quizResults";
import type { QuizChoice } from "@/types/models";

interface QuestionWithSubject {
  id: string;
  stem: string;
  image_url: string | null;
  topics: {
    name: string;
    systems: { name: string; subjects: { name: string } | null } | null;
  } | null;
}

export default async function QuizResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, mode, submitted_at, created_at")
    .eq("id", params.id)
    .single();

  if (!quiz) notFound();
  if (!quiz.submitted_at) redirect(`/quiz/${params.id}`);

  const { data: quizQuestions } = await supabase
    .from("quiz_questions")
    .select("id, question_id, selected_choice_id, is_correct, order_index")
    .eq("quiz_id", params.id)
    .order("order_index");

  if (!quizQuestions || quizQuestions.length === 0) notFound();

  const questionIds = quizQuestions.map((qq) => qq.question_id as string);

  const { data: questions } = await supabase
    .from("questions")
    .select(
      `
      id, stem, image_url,
      topics ( name, systems ( name, subjects ( name ) ) )
    `
    )
    .in("id", questionIds)
    .returns<QuestionWithSubject[]>();

  // Safe to fetch the full answer key here — the quiz is over.
  const { data: choices } = await supabase
    .from("choices")
    .select("id, question_id, text, order_index, is_correct, explanation")
    .in("question_id", questionIds)
    .order("order_index");

  const { data: notes } = await supabase
    .from("user_notes")
    .select("question_id, note_text")
    .eq("user_id", user.id)
    .in("question_id", questionIds);

  const notesByQuestion = new Map((notes ?? []).map((n) => [n.question_id as string, n.note_text as string]));

  const questionsById = new Map((questions ?? []).map((q) => [q.id, q]));
  const choicesByQuestion = new Map<string, QuizChoice[]>();
  for (const c of (choices ?? []) as (QuizChoice & { question_id: string })[]) {
    const list = choicesByQuestion.get(c.question_id) ?? [];
    list.push({
      id: c.id,
      text: c.text,
      order_index: c.order_index,
      is_correct: c.is_correct,
      explanation: c.explanation,
    });
    choicesByQuestion.set(c.question_id, list);
  }

  const rows = quizQuestions.map((qq) => {
    const question = questionsById.get(qq.question_id as string);
    return {
      subjectName: question?.topics?.systems?.subjects?.name ?? "Uncategorized",
      isCorrect: qq.is_correct as boolean | null,
    };
  });

  const score = computeOverallScore(rows);
  const breakdown = computeSubjectBreakdown(rows);
  const percent = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Results
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Quiz complete
      </h1>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-center">
        <p className="text-4xl font-semibold text-slate-900">{percent}%</p>
        <p className="mt-1 text-sm text-slate-500">
          {score.correct} of {score.total} correct
          {score.unanswered > 0 && ` — ${score.unanswered} not answered`}
        </p>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="mb-4 text-sm font-medium text-slate-700">Breakdown by subject</p>
          <div className="space-y-3">
            {breakdown.map((b) => {
              const subjectPercent = b.total > 0 ? Math.round((b.correct / b.total) * 100) : 0;
              return (
                <div key={b.subjectName}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{b.subjectName}</span>
                    <span className="text-slate-500">
                      {b.correct}/{b.total} ({subjectPercent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary-600"
                      style={{ width: `${subjectPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        <p className="text-sm font-medium text-slate-700">Review</p>
        {quizQuestions.map((qq, index) => {
          const question = questionsById.get(qq.question_id as string);
          return (
            <ResultsQuestionReview
              key={qq.id}
              index={index}
              questionId={qq.question_id as string}
              stem={question?.stem ?? ""}
              imageUrl={question?.image_url ?? null}
              choices={choicesByQuestion.get(qq.question_id as string) ?? []}
              selectedChoiceId={qq.selected_choice_id as string | null}
              isCorrect={qq.is_correct as boolean | null}
              initialNote={notesByQuestion.get(qq.question_id as string) ?? ""}
            />
          );
        })}
      </div>

      <div className="mt-8 flex justify-center">
        <a
          href="/quiz/new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          Start another quiz
        </a>
      </div>
    </main>
  );
}
