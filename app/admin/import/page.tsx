import { createClient } from "@/lib/supabase/server";
import ImportManager from "@/components/admin/ImportManager";
import type { Subject, System, Topic } from "@/types/models";

export default async function ImportPage() {
  const supabase = createClient();

  const [{ data: subjects }, { data: systems }, { data: topics }] =
    await Promise.all([
      supabase.from("subjects").select("id, name").order("name"),
      supabase.from("systems").select("id, name, subject_id").order("name"),
      supabase.from("topics").select("id, name, system_id").order("name"),
    ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
        Admin
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        Bulk Import
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Import many questions at once from structured text or an Excel
        template. Everything is saved as a draft first, so you can review
        before publishing.
      </p>

      <div className="mt-8">
        <ImportManager
          catalog={{
            subjects: (subjects as Subject[]) ?? [],
            systems: (systems as System[]) ?? [],
            topics: (topics as Topic[]) ?? [],
          }}
        />
      </div>
    </main>
  );
}
