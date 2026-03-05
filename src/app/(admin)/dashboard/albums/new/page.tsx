import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AlbumForm from "@/components/admin/albums/AlbumForm";
import type { Tables } from "@/lib/types";

type ArtistOption = Pick<Tables<"artists">, "id" | "name" | "slug">;

async function getArtistOptions(): Promise<ArtistOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("artists")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");
  return (data ?? []) as ArtistOption[];
}

export default async function NewAlbumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user!.id).single();
  const role = (profile?.role ?? "author") as "admin" | "author";

  const artists = await getArtistOptions();

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 h-8 px-2 text-xs">
          <Link href="/dashboard/albums">← Back</Link>
        </Button>
        <Separator orientation="vertical" className="h-4 bg-zinc-700" />
        <div>
          <h1 className="text-lg font-bold text-zinc-100 font-serif">Add Album</h1>
          <p className="text-xs text-zinc-500">Create a new album</p>
        </div>
      </div>
      <AlbumForm mode="create" artists={artists} role={role} />
    </div>
  );
}