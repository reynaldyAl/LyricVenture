import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AlbumForm from "@/components/admin/albums/AlbumForm";
import type { Tables } from "@/lib/types";

type AlbumFull   = Tables<"albums">;
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

export default async function EditAlbumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("slug", slug)
    .single();

  const album = data as AlbumFull | null;
  if (!album || error) notFound();

  // ✅ Fetch role
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
          <h1 className="text-lg font-bold text-zinc-100 font-serif">Edit Album</h1>
          <p className="text-xs text-zinc-500">{album.title}</p>
        </div>
      </div>
      {/* ✅ Pass role */}
      <AlbumForm mode="edit" album={album} artists={artists} role={role} />
    </div>
  );
}