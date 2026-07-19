"use server";

import { createClient } from "@/lib/supabase/server";

export interface NoteResult {
  error?: string;
}

// Auto-saved from the client after a short debounce. An empty note deletes
// the row rather than storing a blank one.
export async function upsertNote(
  questionId: string,
  noteText: string
): Promise<NoteResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not signed in." };

  const trimmed = noteText.trim();

  if (trimmed === "") {
    const { error } = await supabase
      .from("user_notes")
      .delete()
      .eq("user_id", user.id)
      .eq("question_id", questionId);
    if (error) return { error: error.message };
    return {};
  }

  const { error } = await supabase
    .from("user_notes")
    .upsert(
      { user_id: user.id, question_id: questionId, note_text: trimmed },
      { onConflict: "user_id,question_id" }
    );

  if (error) return { error: error.message };
  return {};
}
