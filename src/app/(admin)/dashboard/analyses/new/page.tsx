import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AnalysisForm from "@/components/admin/analyses/AnalysisForm";
import type { Tables } from "@/lib/types";

type SongOption = Pick<Tables<"songs">, "id" | "title" | "slug"> & {
  artists: Pick<Tables<"artists">, "name"> | null;
  existing_analysis_id?: string | null;
};

async function getSongsForUser(userId: string): Promise<SongOption[]> {
  const supabase = await createClient();

  const [{ data: existingAnalyses }, { data: songs }] = await Promise.all([
    supabase
      .from("lyric_analyses")
      .select("id, song_id")
      .eq("author_id", userId),
    supabase
      .from("songs")
      .select("id, title, slug, artists ( name )")
      .order("title"),
  ]);

  const existingMap = new Map(
    (existingAnalyses ?? []).map((a: { id: string; song_id: string }) => [a.song_id, a.id])
  );

  return (songs ?? []).map((song) => ({
    ...song,
    existing_analysis_id: existingMap.get(song.id) ?? null,
  })) as SongOption[];
}

export default async function NewAnalysisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const songs = await getSongsForUser(user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 h-8 px-2 text-xs">
          <Link href="/dashboard/analyses">← Back</Link>
        </Button>
        <Separator orientation="vertical" className="h-4 bg-zinc-700" />
        <div>
          <h1 className="text-lg font-bold text-zinc-100 font-serif">New Analysis</h1>
          <p className="text-xs text-zinc-500">Create a lyric analysis for a song</p>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <p className="text-zinc-400 text-sm">No songs available for analysis.</p>
          <p className="text-zinc-600 text-xs mt-1">Add songs first, then create an analysis.</p>
          <Button asChild size="sm" variant="outline"
            className="mt-4 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <Link href="/dashboard/songs/new">+ Add Song</Link>
          </Button>
        </div>
      ) : (
        <AnalysisForm mode="create" songs={songs} />
      )}
    </div>
  );
}