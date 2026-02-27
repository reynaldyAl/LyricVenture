"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Table = "songs" | "artists" | "albums" | "lyric_analyses";
type Action = "published" | "rejected" | "draft";

export async function moderateContent(
  table: Table,
  id: string,
  action: Action,
  revalidate: string = "/dashboard",
) {
  const supabase = await createClient();

  // Cek role — hanya admin yang boleh
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return { error: "Unauthorized" };

  const { error } = await supabase
    .from(table)
    .update({ status: action })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(revalidate);
  revalidatePath("/dashboard");
  return { success: true };
}