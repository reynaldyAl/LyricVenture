import { createClient } from "@/lib/supabase/server";
import SongsClient from "@/components/public/SongsClient";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Songs",
  description: "Browse all songs with lyric analyses on LyricVenture. Discover the meaning behind your favorite music.",
  openGraph: {
    title: "Songs | LyricVenture",
    description: "Browse all songs with lyric analyses.",
    url: "https://lyricventure.com/songs",
  },
};

type SongItem = Pick<
  Tables<"songs">,
  "id" | "title" | "slug" | "cover_image" | "language" | "duration_sec" | "view_count"
> & {
  artists:   Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
  albums:    Pick<Tables<"albums">,  "id" | "title" | "slug"> | null;
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "slug" | "color"> | null }[];
};

type TagItem = Pick<Tables<"tags">, "id" | "name" | "slug" | "color">;

async function getSongsData() {
  const supabase = await createClient();
  const [{ data: songs }, { data: tags }] = await Promise.all([
    supabase
      .from("songs")
      .select(`
        id, title, slug, cover_image, language, duration_sec, view_count,
        artists ( id, name, slug ),
        albums  ( id, title, slug ),
        song_tags ( tags ( id, name, slug, color ) )
      `)
      .eq("status", "published")           // ✅ FIX — ganti is_published → status
      .order("published_at", { ascending: false }),
    supabase
      .from("tags")
      .select("id, name, slug, color")
      .order("name"),
  ]);
  return {
    songs: (songs ?? []) as SongItem[],
    tags:  (tags  ?? []) as TagItem[],
  };
}

async function getLatestReleaseYear(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("songs")
    .select("release_date")
    .eq("status", "published")
    .order("release_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestReleaseYear:", error.message);
    return null;
  }

  return data?.release_date ? new Date(data.release_date).getFullYear() : null;
}

export default async function SongsPage() {
  const [{ songs, tags }, latestYear] = await Promise.all([
    getSongsData(),
    getLatestReleaseYear(),
  ]);
  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[#E2E0DB] bg-white">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#3B5BDB]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#1A1917]/8 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-14 max-w-5xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Library</p>
          <h1 className="font-serif font-bold text-4xl md:text-[3.25rem] text-[#1A1917]">Songs</h1>
          <p className="text-sm text-[#6A665F] mt-3 max-w-2xl">
            Browse songs with lyric analyses, explore tags, and jump to related artists and albums.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {songs.length}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Songs
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {latestYear ?? "-"}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Latest Year
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Client: search + filter + list */}
      <SongsClient songs={songs} tags={tags} />
    </div>
  );
}