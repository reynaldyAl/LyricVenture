"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Table = "songs" | "artists" | "albums" | "lyric_analyses";
type ModerationStatus = "published" | "rejected" | "draft";

export async function moderateContent(
  table: Table,
  id: string,
  action: ModerationStatus,
  revalidate: string = "/dashboard",
) {
  const supabase = await createClient();

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

// ✅ Baru: author submit konten untuk direview admin
export async function submitForReview(
  table: Table,
  id: string,
  revalidate: string = "/dashboard",
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  // Cek status sekarang — hanya draft/rejected yang boleh submit
  const { data: row } = await supabase
    .from(table)
    .select("status")
    .eq("id", id)
    .single();

  if (!row) return { error: "Content not found" };

  if (row.status === "pending") return { error: "Already submitted for review" };
  if (row.status === "published") return { error: "Already published" };

  const { error } = await supabase
    .from(table)
    .update({ status: "pending" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(revalidate);
  revalidatePath("/dashboard");
  return { success: true };
}