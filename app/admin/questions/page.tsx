import { createClient } from "@/lib/supabase/server";
import QuestionsTable from "@/components/admin/QuestionsTable";
import type { QuestionListRow } from "@/types/models";

export default async function QuestionsListPage() {
  const supabase = createClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select(
      `
      id, stem, status, difficulty, created_at,
      topics ( name, systems ( name, subjects ( name ) ) )
    `
    )
    .order("created_at", { ascending: false })
    .returns<QuestionListRow[]>();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
            Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Questions
          </h1>
        </div>
        <a
          href="/admin/questions/new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          + Add New Question
        </a>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Couldn&rsquo;t load questions: {error.message}
        </p>
      )}

      {!error && (!questions || questions.length === 0) && (
        <p className="mt-8 text-sm text-slate-500">
          No questions yet.{" "}
          <a
            href="/admin/questions/new"
            className="font-medium text-primary-700 hover:text-primary-800"
          >
            Add your first one
          </a>
          .
        </p>
      )}

      {questions && questions.length > 0 && (
        <QuestionsTable questions={questions} />
      )}
    </main>
  );
}
