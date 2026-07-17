import { createClient } from "@/lib/supabase/server";
import QuestionForm from "@/components/admin/QuestionForm";
import type { Subject, System, Topic } from "@/types/models";

export default async function NewQuestionPage() {
  const supabase = createClient();

  const [{ data: subjects }, { data: systems }, { data: topics }] =
    await Promise.all([
      supabase.from("subjects").select("id, name").order("name"),
      supabase.from("systems").select("id, name, subject_id").order("name"),
      supabase.from("topics").select("id, name, system_id").order("name"),
    ]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Admin
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Add New Question
      </h1>
      <p className="mt-2 text-slate-600">
        Fill this out, then save it as a draft or publish it right away.
      </p>

      <div className="mt-8">
        <QuestionForm
          mode="create"
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
