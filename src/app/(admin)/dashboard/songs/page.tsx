import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SongTableClient from "@/components/admin/songs/SongTableClient";
import type { Tables } from "@/lib/types";

type Role = "admin" | "author";

type SongRow = Pick<
  Tables<"songs">,
  | "id" | "title" | "slug" | "cover_image" | "language"
  | "duration_sec" | "view_count" | "created_at" | "status"
> & {
  artists:   Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
  albums:    Pick<Tables<"albums">,  "id" | "title" | "slug"> | null;
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "color"> | null }[];
};

export default async function SongsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // ✅ Fetch profile dulu untuk dapat role
  const { data: profileData } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = ((profileData as { role: Role } | null)?.role ?? "author") as Role;

  // ✅ Query dengan limit
  const baseQuery = supabase
    .from("songs")
    .select(`
      id, title, slug, cover_image, language,
      duration_sec, view_count, created_at, status,
      artists ( id, name, slug ),
      albums  ( id, title, slug ),
      song_tags ( tags ( id, name, color ) )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data, error } = role === "admin"
    ? await baseQuery
    : await baseQuery.eq("created_by", user.id);

  if (error) console.error("getSongs:", error.message);
  const songs = (data ?? []) as SongRow[];

  const publishedCount = songs.filter((s) => s.status === "published").length;
  const pendingCount   = songs.filter((s) => s.status === "pending").length;
  const draftCount     = songs.filter((s) => s.status === "draft").length;
  const rejectedCount  = songs.filter((s) => s.status === "rejected").length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-serif">
            {role === "admin" ? "Songs" : "My Songs"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {songs.length} total · {publishedCount} published · {pendingCount} pending · {draftCount} draft
          </p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
          <Link href="/dashboard/songs/new">+ Add Song</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Published", value: publishedCount, color: "text-emerald-400" },
          { label: "Pending",   value: pendingCount,   color: "text-amber-400" },
          { label: "Draft",     value: draftCount,     color: "text-zinc-400" },
          { label: "Rejected",  value: rejectedCount,  color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-4 py-3">
            <p className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Separator className="bg-zinc-800" />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">
            {role === "admin" ? "All Songs" : "My Songs"}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Search, filter, edit, or delete songs
          </CardDescription>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="p-0">
          <SongTableClient songs={songs} role={role} />
        </CardContent>
      </Card>
    </div>
  );
}