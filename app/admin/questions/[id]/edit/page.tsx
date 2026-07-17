import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuestionForm from "@/components/admin/QuestionForm";
import type { QuestionFormInput, Subject, System, Topic } from "@/types/models";

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [
    { data: question },
    { data: choices },
    { data: subjects },
    { data: systems },
    { data: topics },
  ] = await Promise.all([
    supabase.from("questions").select("*").eq("id", params.id).single(),
    supabase
      .from("choices")
      .select("id, text, is_correct, explanation, order_index")
      .eq("question_id", params.id)
      .order("order_index"),
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("systems").select("id, name, subject_id").order("name"),
    supabase.from("topics").select("id, name, system_id").order("name"),
  ]);

  if (!question) {
    notFound();
  }

  const initial: QuestionFormInput = {
    stem: question.stem,
    image_url: question.image_url,
    difficulty: question.difficulty,
    high_yield: question.high_yield,
    topic_id: question.topic_id,
    source: question.source ?? "",
    status: question.status,
    choices: (choices ?? []).map((c) => ({
      text: c.text,
      is_correct: c.is_correct,
      explanation: c.explanation ?? "",
      order_index: c.order_index,
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary-700">
        Admin
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Edit Question
      </h1>

      <div className="mt-8">
        <QuestionForm
          mode="edit"
          questionId={params.id}
          catalog={{
            subjects: (subjects as Subject[]) ?? [],
            systems: (systems as System[]) ?? [],
            topics: (topics as Topic[]) ?? [],
          }}
          initial={initial}
        />
      </div>
    </main>
  );
}
