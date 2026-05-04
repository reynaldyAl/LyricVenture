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
  const latestYear = artists.reduce((acc, artist) => {
    const year = artist.formed_year ?? 0;
    return year > acc ? year : acc;
  }, 0) || null;
  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[#E2E0DB] bg-white">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#3B5BDB]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#1A1917]/8 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-14 max-w-5xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Creators</p>
          <h1 className="font-serif font-bold text-4xl md:text-[3.25rem] text-[#1A1917]">Artists</h1>
          <p className="text-sm text-[#6A665F] mt-3 max-w-2xl">
            Explore artists, their origins, and the sounds that shape each discography.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {artists.length}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Artists
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {latestYear ?? "-"}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Latest Formed
              </p>
            </div>
          </div>
        </div>
      </section>
      <ArtistsClient artists={artists} />
    </div>
  );
}