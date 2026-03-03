import { createClient } from "@/lib/supabase/server";
import ArtistsClient from "@/components/public/ArtistsClient";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artists",
  description: "Explore artists and their discographies on LyricVenture. Dive deep into the music that shaped culture.",
  openGraph: {
    title: "Artists | LyricVenture",
    description: "Explore artists and their discographies.",
    url: "https://lyricventure.com/artists",
  },
};

type ArtistItem = Pick<
  Tables<"artists">,
  "id" | "name" | "slug" | "cover_image" | "genre" | "origin" | "formed_year" | "is_active" | "status"
>;

async function getArtists(): Promise<ArtistItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("id, name, slug, cover_image, genre, origin, formed_year, is_active, status")
    .eq("status", "published")   // ✅ hanya yang sudah di-approve admin
    .eq("is_active", true)       // ✅ double check aktif
    .order("name", { ascending: true });

  if (error) { console.error("getArtists:", error.message); return []; }
  return (data ?? []) as ArtistItem[];
}

export default async function ArtistsPage() {
  const artists = await getArtists();
  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>
      {/* Page header */}
      <div className="border-b border-[#E2E0DB]" style={{ background: "#FFFFFF" }}>
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Creators</p>
          <h1 className="font-serif font-bold text-4xl text-[#1A1917]">Artists</h1>
          <p className="text-sm text-[#8A8680] mt-2">
            {artists.length} artist{artists.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <ArtistsClient artists={artists} />
    </div>
  );
}