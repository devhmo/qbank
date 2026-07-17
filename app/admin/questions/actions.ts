"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateQuestionInput } from "@/lib/validateQuestion";
import type { QuestionFormInput } from "@/types/models";

export interface ActionResult {
  error?: string;
  questionId?: string;
}

export async function createQuestion(
  input: QuestionFormInput
): Promise<ActionResult> {
  const validationError = validateQuestionInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      stem: input.stem,
      image_url: input.image_url,
      difficulty: input.difficulty,
      high_yield: input.high_yield,
      topic_id: input.topic_id,
      source: input.source || null,
      status: input.status,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (questionError || !question) {
    return { error: questionError?.message ?? "Failed to create question." };
  }

  const { error: choicesError } = await supabase.from("choices").insert(
    input.choices.map((choice, index) => ({
      question_id: question.id,
      text: choice.text,
      is_correct: choice.is_correct,
      explanation: choice.explanation || null,
      order_index: index,
    }))
  );

  if (choicesError) {
    // Supabase-js doesn't support multi-table transactions, so we
    // compensate manually: if the choices failed to save, remove the
    // question we just created rather than leaving it choice-less.
    await supabase.from("questions").delete().eq("id", question.id);
    return { error: choicesError.message };
  }

  revalidatePath("/admin/questions");
  return { questionId: question.id };
}

export async function updateQuestion(
  id: string,
  input: QuestionFormInput
): Promise<ActionResult> {
  const validationError = validateQuestionInput(input);
  if (validationError) {
    return { error: validationError };
  }

  const supabase = createClient();

  const { error: questionError } = await supabase
    .from("questions")
    .update({
      stem: input.stem,
      image_url: input.image_url,
      difficulty: input.difficulty,
      high_yield: input.high_yield,
      topic_id: input.topic_id,
      source: input.source || null,
      status: input.status,
    })
    .eq("id", id);

  if (questionError) {
    return { error: questionError.message };
  }

  // Replace strategy: drop the old choices and insert the current set.
  // Simpler and less error-prone than diffing added/edited/removed rows,
  // and choices have no independent identity that anything else references.
  const { error: deleteError } = await supabase
    .from("choices")
    .delete()
    .eq("question_id", id);

  if (deleteError) {
    return { error: deleteError.message };
  }

  const { error: choicesError } = await supabase.from("choices").insert(
    input.choices.map((choice, index) => ({
      question_id: id,
      text: choice.text,
      is_correct: choice.is_correct,
      explanation: choice.explanation || null,
      order_index: index,
    }))
  );

  if (choicesError) {
    return { error: choicesError.message };
  }

  revalidatePath("/admin/questions");
  return { questionId: id };
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/questions");
  return {};
}
