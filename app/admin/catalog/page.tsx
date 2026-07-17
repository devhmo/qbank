import { createClient } from "@/lib/supabase/server";
import CatalogManager from "@/components/admin/CatalogManager";
import type { Subject, System, Topic } from "@/types/models";

export default async function CatalogPage() {
  const supabase = createClient();

  const [{ data: subjects }, { data: systems }, { data: topics }] =
    await Promise.all([
      supabase.from("subjects").select("id, name").order("name"),
      supabase.from("systems").select("id, name, subject_id").order("name"),
      supabase.from("topics").select("id, name, system_id").order("name"),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Admin
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Catalog
      </h1>
      <p className="mt-2 text-slate-600">
        Manage the subjects, systems, and topics questions are organized
        under. Select a subject to see its systems, and a system to see its
        topics.
      </p>

      <div className="mt-8">
        <CatalogManager
          subjects={(subjects as Subject[]) ?? []}
          systems={(systems as System[]) ?? []}
          topics={(topics as Topic[]) ?? []}
        />
      </div>
    </main>
  );
}
