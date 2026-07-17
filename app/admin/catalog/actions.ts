"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionResult {
  error?: string;
}

function friendlyError(message: string): string {
  if (message.includes("duplicate key value")) {
    return "That name already exists at this level.";
  }
  if (message.includes("violates foreign key constraint")) {
    return "Can't delete this — it still has items under it. Remove those first.";
  }
  return message;
}

// --- Subjects ---------------------------------------------------------

export async function createSubject(name: string): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required." };
  const supabase = createClient();
  const { error } = await supabase.from("subjects").insert({ name: name.trim() });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

export async function updateSubject(
  id: string,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required." };
  const supabase = createClient();
  const { error } = await supabase
    .from("subjects")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

export async function deleteSubject(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

// --- Systems ------------------------------------------------------------

export async function createSystem(
  subjectId: string,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required." };
  const supabase = createClient();
  const { error } = await supabase
    .from("systems")
    .insert({ name: name.trim(), subject_id: subjectId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

export async function updateSystem(
  id: string,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required." };
  const supabase = createClient();
  const { error } = await supabase
    .from("systems")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

export async function deleteSystem(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("systems").delete().eq("id", id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

// --- Topics ---------------------------------------------------------------

export async function createTopic(
  systemId: string,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required." };
  const supabase = createClient();
  const { error } = await supabase
    .from("topics")
    .insert({ name: name.trim(), system_id: systemId });
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

export async function updateTopic(
  id: string,
  name: string
): Promise<ActionResult> {
  if (!name.trim()) return { error: "Name is required." };
  const supabase = createClient();
  const { error } = await supabase
    .from("topics")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}

export async function deleteTopic(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) return { error: friendlyError(error.message) };
  revalidatePath("/admin/catalog");
  return {};
}
