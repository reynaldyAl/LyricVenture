import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SongForm from "@/components/admin/songs/SongForm";
import type { Tables } from "@/lib/types";

type SongFull     = Tables<"songs">;
type ArtistOption = Pick<Tables<"artists">, "id" | "name" | "slug">;
type AlbumOption  = Pick<Tables<"albums">,  "id" | "title" | "slug" | "artist_id">;
type TagOption    = Pick<Tables<"tags">,    "id" | "name" | "color">;
type SongWithTags = SongFull & { current_tag_ids: string[] };

async function getFormOptions() {
  const supabase = await createClient();
  const [{ data: artists }, { data: albums }, { data: tags }] = await Promise.all([
    supabase.from("artists").select("id, name, slug").eq("is_active", true).order("name"),
    supabase.from("albums").select("id, title, slug, artist_id").order("title"),
    supabase.from("tags").select("id, name, color").order("name"),
  ]);
  return {
    artists: (artists ?? []) as ArtistOption[],
    albums:  (albums  ?? []) as AlbumOption[],
    tags:    (tags    ?? []) as TagOption[],
  };
}

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: songRaw, error } = await supabase
    .from("songs")
    .select("*")
    .eq("slug", slug)
    .single();

  const song = songRaw as SongFull | null;
  if (!song || error) notFound();

  // ✅ Fetch role + tags — parallel
  const [{ data: currentTags }, formOptions, { data: { user } }] = await Promise.all([
    supabase.from("song_tags").select("tag_id").eq("song_id", song.id),
    getFormOptions(),
    supabase.auth.getUser(),
  ]);

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();
  const role = (profile?.role ?? "author") as "admin" | "author";

  const current_tag_ids = (currentTags ?? []).map(
    (t: { tag_id: string }) => t.tag_id
  );
  const songWithTags: SongWithTags = { ...song, current_tag_ids };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 h-8 px-2 text-xs">
          <Link href="/dashboard/songs">← Back</Link>
        </Button>
        <Separator orientation="vertical" className="h-4 bg-zinc-700" />
        <div>
          <h1 className="text-lg font-bold text-zinc-100 font-serif">Edit Song</h1>
          <p className="text-xs text-zinc-500">{song.title}</p>
        </div>
      </div>
      {/* ✅ Pass role */}
      <SongForm
        mode="edit"
        song={songWithTags}
        artists={formOptions.artists}
        albums={formOptions.albums}
        tags={formOptions.tags}
        role={role}
      />
    </div>
  );
}