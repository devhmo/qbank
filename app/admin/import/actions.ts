"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateQuestionInput } from "@/lib/validateQuestion";
import type { QuestionFormInput } from "@/types/models";

export interface BulkImportResult {
  error?: string;
  created: number;
}

// Inserts questions one at a time (supabase-js has no multi-table
// transaction support). If one fails partway through, everything before it
// has already been saved as a draft — the returned `created` count reflects
// that, and the caller shows exactly which entry stopped the import so nothing
// is silently lost or duplicated on retry.
export async function bulkCreateQuestions(
  inputs: QuestionFormInput[]
): Promise<BulkImportResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let created = 0;

  for (const [index, input] of inputs.entries()) {
    const validationError = validateQuestionInput(input);
    if (validationError) {
      return { error: `Question ${index + 1}: ${validationError}`, created };
    }

    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        stem: input.stem,
        image_url: null,
        difficulty: input.difficulty,
        high_yield: input.high_yield,
        topic_id: input.topic_id,
        source: input.source || null,
        status: "draft", // bulk-imported questions are always drafts for review
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();

    if (questionError || !question) {
      return {
        error: `Question ${index + 1}: ${questionError?.message ?? "failed to save"}`,
        created,
      };
    }

    const { error: choicesError } = await supabase.from("choices").insert(
      input.choices.map((choice, choiceIndex) => ({
        question_id: question.id,
        text: choice.text,
        is_correct: choice.is_correct,
        explanation: choice.explanation || null,
        order_index: choiceIndex,
      }))
    );

    if (choicesError) {
      await supabase.from("questions").delete().eq("id", question.id);
      return { error: `Question ${index + 1}: ${choicesError.message}`, created };
    }

    created++;
  }

  revalidatePath("/admin/questions");
  return { created };
}
