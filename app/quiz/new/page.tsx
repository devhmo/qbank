import { createClient } from "@/lib/supabase/server";
import QuizNewForm from "@/components/quiz/QuizNewForm";
import type { QuizScope, Subject, System, Topic } from "@/types/models";

const VALID_SCOPES: QuizScope[] = ["all", "unanswered", "incorrect", "bookmarked"];

function parseScope(value: string | string[] | undefined): QuizScope {
  const scope = Array.isArray(value) ? value[0] : value;
  return VALID_SCOPES.includes(scope as QuizScope) ? (scope as QuizScope) : "all";
}

export default async function NewQuizPage({
  searchParams,
}: {
  searchParams: { scope?: string | string[] };
}) {
  const supabase = createClient();

  const [{ data: subjects }, { data: systems }, { data: topics }] =
    await Promise.all([
      supabase.from("subjects").select("id, name").order("name"),
      supabase.from("systems").select("id, name, subject_id").order("name"),
      supabase.from("topics").select("id, name, system_id").order("name"),
    ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        New Quiz
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Create a Custom Quiz
      </h1>
      <p className="mt-2 text-slate-600">
        Pick what you want to practice, how many questions, and how you want
        to take it.
      </p>

      <div className="mt-8">
        <QuizNewForm
          catalog={{
            subjects: (subjects as Subject[]) ?? [],
            systems: (systems as System[]) ?? [],
            topics: (topics as Topic[]) ?? [],
          }}
          initialScope={parseScope(searchParams.scope)}
        />
      </div>
    </main>
  );
}
