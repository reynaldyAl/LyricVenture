import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SongForm from "@/components/admin/songs/SongForm";
import type { Tables } from "@/lib/types";

type ArtistOption = Pick<Tables<"artists">, "id" | "name" | "slug">;
type AlbumOption  = Pick<Tables<"albums">,  "id" | "title" | "slug" | "artist_id">;
type TagOption    = Pick<Tables<"tags">,    "id" | "name" | "color">;

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

export default async function NewSongPage() {
  const supabase = await createClient();

  // ✅ Fetch role
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();
  const role = (profile?.role ?? "author") as "admin" | "author";

  const { artists, albums, tags } = await getFormOptions();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 h-8 px-2 text-xs">
          <Link href="/dashboard/songs">← Back</Link>
        </Button>
        <Separator orientation="vertical" className="h-4 bg-zinc-700" />
        <div>
          <h1 className="text-lg font-bold text-zinc-100 font-serif">Add Song</h1>
          <p className="text-xs text-zinc-500">Create a new song entry</p>
        </div>
      </div>
      {/* ✅ Pass role */}
      <SongForm mode="create" artists={artists} albums={albums} tags={tags} role={role} />
    </div>
  );
}