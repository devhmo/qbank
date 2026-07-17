import { createClient } from "@/lib/supabase/server";
import DeleteQuestionButton from "@/components/admin/DeleteQuestionButton";
import type { QuestionListRow } from "@/types/models";

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === "published";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isPublished
          ? "bg-primary-50 text-primary-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex items-center justify-between">
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
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Stem
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {questions.map((q) => (
                <tr key={q.id}>
                  <td className="max-w-sm px-4 py-3 text-sm text-slate-900">
                    <p className="truncate">{q.stem}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {q.topics?.systems?.subjects?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(q.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center justify-end gap-4">
                      <a
                        href={`/admin/questions/${q.id}/edit`}
                        className="text-sm font-medium text-primary-700 hover:text-primary-800"
                      >
                        Edit
                      </a>
                      <DeleteQuestionButton id={q.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
