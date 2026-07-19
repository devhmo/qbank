import { createClient } from "@/lib/supabase/server";
import ReportsTable, { type ReportRow } from "@/components/admin/ReportsTable";

interface RawReport {
  id: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
  questions: { id: string; stem: string } | null;
  users: { email: string | null; full_name: string | null } | null;
}

export default async function AdminReportsPage() {
  const supabase = createClient();

  const { data: reports, error } = await supabase
    .from("question_reports")
    .select(
      `
      id, message, status, created_at,
      questions ( id, stem ),
      users ( email, full_name )
    `
    )
    .order("created_at", { ascending: false })
    .returns<RawReport[]>();

  const rows: ReportRow[] = (reports ?? []).map((r) => ({
    id: r.id,
    message: r.message,
    status: r.status,
    created_at: r.created_at,
    questionId: r.questions?.id ?? "",
    questionStem: r.questions?.stem ?? "",
    reporterName: r.users?.full_name || r.users?.email || "Unknown",
  }));

  const openCount = rows.filter((r) => r.status === "open").length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
        Admin
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Question Reports
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        {openCount} open report{openCount === 1 ? "" : "s"} from students.
      </p>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Couldn&rsquo;t load reports: {error.message}
        </p>
      )}

      <div className="mt-8">
        <ReportsTable initialReports={rows} />
      </div>
    </main>
  );
}
