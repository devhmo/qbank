import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = createClient();

  const [
    { count: questionCount },
    { count: draftCount },
    { count: subjectCount },
  ] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }),
    supabase
      .from("questions")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase.from("subjects").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total questions", value: questionCount ?? 0 },
    { label: "Drafts", value: draftCount ?? 0 },
    { label: "Subjects", value: subjectCount ?? 0 },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Admin
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Admin Panel
      </h1>
      <p className="mt-2 max-w-xl text-slate-600">
        Manage questions and the subject/system/topic catalog.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-2xl font-semibold text-slate-900">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-4">
        <a
          href="/admin/questions/new"
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-700"
        >
          + Add New Question
        </a>
        <a
          href="/admin/questions"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          View all questions
        </a>
        <a
          href="/admin/import"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Bulk import
        </a>
      </div>
    </main>
  );
}
