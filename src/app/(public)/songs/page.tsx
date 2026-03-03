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

export default async function SongsPage() {
  const { songs, tags } = await getSongsData();
  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>
      {/* Page header */}
      <div className="border-b border-[#E2E0DB]" style={{ background: "#FFFFFF" }}>
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Library</p>
          <h1 className="font-serif font-bold text-4xl text-[#1A1917]">Songs</h1>
          <p className="text-sm text-[#8A8680] mt-2">
            {songs.length} song{songs.length !== 1 ? "s" : ""} with lyric analyses
          </p>
        </div>
      </div>
      {/* Client: search + filter + list */}
      <SongsClient songs={songs} tags={tags} />
    </div>
  );
}