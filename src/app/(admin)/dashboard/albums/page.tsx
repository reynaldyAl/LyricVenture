import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AlbumTableClient from "@/components/admin/albums/AlbumTableClient";
import type { Tables } from "@/lib/types";

type Role = "admin" | "author";

type AlbumRow = Pick<
  Tables<"albums">,
  | "id" | "title" | "slug" | "cover_image"
  | "release_date" | "album_type" | "total_tracks"
  | "created_at" | "status"  // ← tambah status
> & {
  artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
};

async function getAlbums(role: Role, userId: string): Promise<AlbumRow[]> {
  const supabase = await createClient();

  const query = supabase
    .from("albums")
    .select("id, title, slug, cover_image, release_date, album_type, total_tracks, created_at, status, artists ( id, name, slug )") // ← tambah status
    .order("release_date", { ascending: false });

  const { data, error } = role === "admin"
    ? await query
    : await query.eq("created_by", userId);

  if (error) { console.error("getAlbums error:", error.message); return []; }
  return (data ?? []) as AlbumRow[];
}

export default async function AlbumsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = ((profileData as { role: Role } | null)?.role ?? "author") as Role;

  const albums = await getAlbums(role, user.id);

  const stats = {
    total:     albums.length,
    albums:    albums.filter((a) => a.album_type === "album").length,
    eps:       albums.filter((a) => a.album_type === "ep").length,
    singles:   albums.filter((a) => a.album_type === "single").length,
    published: albums.filter((a) => a.status === "published").length,
    pending:   albums.filter((a) => a.status === "pending").length,
    draft:     albums.filter((a) => a.status === "draft").length,
    rejected:  albums.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-serif">
            {role === "admin" ? "Albums" : "My Albums"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {stats.total} total · {stats.albums} albums · {stats.eps} EPs · {stats.singles} singles
          </p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
          <Link href="/dashboard/albums/new">+ Add Album</Link>
        </Button>
      </div>

      {/* Type stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",   value: stats.total,   color: "text-zinc-200" },
          { label: "Albums",  value: stats.albums,  color: "text-indigo-400" },
          { label: "EPs",     value: stats.eps,     color: "text-sky-400" },
          { label: "Singles", value: stats.singles, color: "text-violet-400" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-4 py-3">
            <p className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Published", value: stats.published, color: "text-emerald-400" },
          { label: "Pending",   value: stats.pending,   color: "text-amber-400" },
          { label: "Draft",     value: stats.draft,     color: "text-zinc-400" },
          { label: "Rejected",  value: stats.rejected,  color: "text-red-400" },
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
            {role === "admin" ? "All Albums" : "My Albums"}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Search, edit, or delete albums
          </CardDescription>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="p-0">
          <AlbumTableClient albums={albums} role={role} />
        </CardContent>
      </Card>
    </div>
  );
}