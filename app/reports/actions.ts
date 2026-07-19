"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReportActionResult {
  error?: string;
}

export async function submitQuestionReport(
  questionId: string,
  message: string
): Promise<ReportActionResult> {
  const trimmed = message.trim();
  if (!trimmed) return { error: "Please describe the issue." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("question_reports").insert({
    user_id: user.id,
    question_id: questionId,
    message: trimmed,
  });

  if (error) return { error: error.message };
  return {};
}

export async function resolveReport(reportId: string): Promise<ReportActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("question_reports")
    .update({ status: "resolved" })
    .eq("id", reportId);

  if (error) return { error: error.message };
  revalidatePath("/admin/reports");
  return {};
}

export async function reopenReport(reportId: string): Promise<ReportActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from("question_reports")
    .update({ status: "open" })
    .eq("id", reportId);

  if (error) return { error: error.message };
  revalidatePath("/admin/reports");
  return {};
}
