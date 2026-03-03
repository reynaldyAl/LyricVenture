import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AlbumCard from "@/components/public/AlbumCard";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Albums",
  description: "Browse album discographies on LyricVenture. Explore track lists and lyric analyses by album.",
  openGraph: {
    title: "Albums | LyricVenture",
    description: "Browse album discographies and lyric analyses.",
    url: "https://lyricventure.com/albums",
  },
};

type AlbumItem = Pick<
  Tables<"albums">,
  "id" | "title" | "slug" | "cover_image" | "release_date" | "album_type"
> & {
  artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
};

async function getAlbums(): Promise<AlbumItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select(`
      id, title, slug, cover_image, release_date, album_type,
      artists ( id, name, slug )
    `)
    .eq("status", "published")   // ✅ FIX — hanya album yang sudah di-approve
    .order("release_date", { ascending: false });

  if (error) { console.error("getAlbums:", error.message); return []; }
  return (data ?? []) as AlbumItem[];
}

export default async function AlbumsPage() {
  const albums = await getAlbums();

  // Group by year untuk tampilan editorial
  const grouped = albums.reduce<Record<string, AlbumItem[]>>((acc, album) => {
    const year = album.release_date
      ? new Date(album.release_date).getFullYear().toString()
      : "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(album);
    return acc;
  }, {});

  // Sort years descending
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>

      {/* Header */}
      <div className="border-b border-[#E2E0DB]" style={{ background: "#FFFFFF" }}>
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">
            Discography
          </p>
          <h1 className="font-serif font-bold text-4xl text-[#1A1917]">Albums</h1>
          <p className="text-sm text-[#8A8680] mt-2">
            {albums.length} album{albums.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {albums.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl text-[#C5C2BC] mb-4">◎</p>
            <p className="font-serif text-xl text-[#5A5651]">No albums yet.</p>
            <p className="text-sm text-[#8A8680] italic mt-2">Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {years.map((year) => (
              <div key={year}>
                {/* Year divider */}
                <div className="flex items-center gap-4 mb-7">
                  <h2 className="font-serif font-bold text-xl text-[#1A1917] shrink-0">
                    {year}
                  </h2>
                  <div className="flex-1 h-px bg-[#E2E0DB]" />
                  <span className="text-xs text-[#C0B8AE] shrink-0">
                    {grouped[year].length} release{grouped[year].length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Album grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                  {grouped[year].map((album) => (
                    <AlbumCard
                      key={album.id}
                      title={album.title}
                      slug={album.slug}
                      coverImage={album.cover_image}
                      artistName={album.artists?.name ?? ""}
                      artistSlug={album.artists?.slug ?? ""}
                      releaseDate={album.release_date}
                      albumType={album.album_type}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}