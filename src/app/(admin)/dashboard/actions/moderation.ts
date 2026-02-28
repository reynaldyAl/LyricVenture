"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Table = "songs" | "artists" | "albums" | "lyric_analyses";
type ModerationStatus = "published" | "rejected" | "draft";

const OWNER_FIELD: Record<Table, string> = {
  songs:          "created_by",
  artists:        "created_by",
  albums:         "created_by",
  lyric_analyses: "author_id",
};

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

  //  Fix: select "id" saja untuk validasi exist
  const { data: row } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .single();

  if (!row) return { error: "Content not found" };

  const { error } = await supabase
    .from(table)
    .update({ status: action })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(revalidate);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${table === "lyric_analyses" ? "analyses" : table}`);
  return { success: true };
}

export async function submitForReview(
  table: Table,
  id: string,
  revalidate: string = "/dashboard",
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthenticated" };

  const ownerField = OWNER_FIELD[table];

  //  Fix: select "status" + "id" saja, ownership query terpisah
  const { data: row } = await supabase
    .from(table)
    .select("id, status")
    .eq("id", id)
    .single();

  if (!row) return { error: "Content not found" };

  //  Fix: ownership check dengan query terpisah menggunakan .eq() langsung
  const { data: owned } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq(ownerField, user.id)
    .single();

  if (!owned) return { error: "Unauthorized" };

  const { status } = row as { id: string; status: string | null };

  if (status === "pending")   return { error: "Already submitted for review" };
  if (status === "published") return { error: "Already published" };

  const { error } = await supabase
    .from(table)
    .update({ status: "pending" })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(revalidate);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${table === "lyric_analyses" ? "analyses" : table}`);
  return { success: true };
}