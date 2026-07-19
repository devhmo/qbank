import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SearchPanel from "@/components/search/SearchPanel";
import type { Subject, System, Topic } from "@/types/models";

export default async function SearchPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: subjects }, { data: systems }, { data: topics }] =
    await Promise.all([
      supabase.from("subjects").select("id, name").order("name"),
      supabase.from("systems").select("id, name, subject_id").order("name"),
      supabase.from("topics").select("id, name, system_id").order("name"),
    ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Search
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Search Questions
      </h1>
      <p className="mt-2 text-slate-600">
        Full-text search across question stems and choice explanations.
      </p>

      <div className="mt-8">
        <SearchPanel
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
