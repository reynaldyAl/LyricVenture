import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import type { Tables } from "@/lib/types";

async function getPendingCounts(role: "admin" | "author", userId: string) {
  const supabase = await createClient();

  if (role === "admin") {
    const [songs, artists, albums, analyses] = await Promise.all([
      supabase.from("songs").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("artists").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("albums").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("lyric_analyses").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    return {
      songs:    songs.count    ?? 0,
      artists:  artists.count  ?? 0,
      albums:   albums.count   ?? 0,
      analyses: analyses.count ?? 0,
    };
  } else {
    const [songs, artists, albums, analyses] = await Promise.all([
      supabase.from("songs").select("*", { count: "exact", head: true }).eq("status", "pending").eq("created_by", userId),
      supabase.from("artists").select("*", { count: "exact", head: true }).eq("status", "pending").eq("created_by", userId),
      supabase.from("albums").select("*", { count: "exact", head: true }).eq("status", "pending").eq("created_by", userId),
      supabase.from("lyric_analyses").select("*", { count: "exact", head: true }).eq("status", "pending").eq("author_id", userId),
    ]);
    return {
      songs:    songs.count    ?? 0,
      artists:  artists.count  ?? 0,
      albums:   albums.count   ?? 0,
      analyses: analyses.count ?? 0,
    };
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = data as Pick<Tables<"profiles">, "role"> | null;

  if (!profile || (profile.role !== "admin" && profile.role !== "author")) {
    redirect("/");
  }

  const role          = profile.role as "admin" | "author";
  const pendingCounts = await getPendingCounts(role, user.id);

  return (
    <AdminShell role={role} pendingCounts={pendingCounts}>
      {children}
    </AdminShell>
  );
}