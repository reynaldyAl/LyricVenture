import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AlbumCard from "@/components/public/AlbumCard";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug }  = await params;
  const artist    = await getArtist(slug);

  if (!artist) return { title: "Artist Not Found" };

  const description =
    artist.bio?.slice(0, 160) ??
    `Explore songs and lyric analyses by ${artist.name} on LyricVenture.`;

  return {
    title:       artist.name,
    description,
    openGraph: {
      title:       `${artist.name} | LyricVenture`,
      description,
      url:         `https://lyricventure.com/artists/${slug}`,
      images:      artist.cover_image
        ? [{ url: artist.cover_image, alt: artist.name }]
        : [],
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${artist.name} | LyricVenture`,
      description,
      images:      artist.cover_image ? [artist.cover_image] : [],
    },
  };
}

// ── Types ─────────────────────────────────────────────────
type SongInArtist = Pick<
  Tables<"songs">,
  // ✅ FIX 2 — ganti is_published → status
  "id" | "title" | "slug" | "cover_image" | "duration_sec" | "status" | "view_count" | "spotify_track_id"
> & {
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "slug" | "color"> | null }[];
};

type AlbumInArtist = Pick<
  Tables<"albums">,
  // ✅ FIX 3 — tambah status
  "id" | "title" | "slug" | "cover_image" | "release_date" | "album_type" | "total_tracks" | "status"
>;

type ArtistDetail = Tables<"artists"> & {
  albums: AlbumInArtist[];
  songs:  SongInArtist[];
};

async function getArtist(slug: string): Promise<ArtistDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select(`
      *,
      albums ( id, title, slug, release_date, cover_image, album_type, total_tracks, status ),
      songs (
        id, title, slug, cover_image,
        duration_sec, status, view_count, spotify_track_id,
        song_tags ( tags ( id, name, slug, color ) )
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")  // ✅ FIX 1 — artist harus published
    .eq("is_active", true)      // ✅ double check aktif
    .single();

  if (error || !data) return null;
  return data as ArtistDetail;
}

function fmt(sec: number | null) {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist   = await getArtist(slug);
  if (!artist) notFound();

  // ✅ FIX 2 — filter songs pakai status bukan is_published
  const publishedSongs = artist.songs.filter((s) => s.status === "published");

  // ✅ FIX 3 — filter albums yang sudah published saja
  const albums = artist.albums
    .filter((a) => a.status === "published")
    .sort(
      (a, b) =>
        new Date(b.release_date ?? 0).getTime() -
        new Date(a.release_date ?? 0).getTime()
    );

  const genre = (artist.genre as string[] | null) ?? [];

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>

      {/* ══════════════════════════════════════════════
          HERO — banner + artist info
      ══════════════════════════════════════════════ */}
      <div style={{ background: "#FFFFFF" }}>
        {/* Banner */}
        <div className="relative h-48 md:h-64 bg-[#E2E0DB] overflow-hidden">
          {artist.banner_image ? (
            <Image
              src={artist.banner_image as string}
              alt={artist.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `repeating-linear-gradient(
                  45deg,
                  #E2E0DB,
                  #E2E0DB 10px,
                  #EAE8E3 10px,
                  #EAE8E3 20px
                )`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
        </div>

        {/* Artist info row */}
        <div className="container mx-auto px-6 max-w-5xl -mt-14 relative pb-10">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-4 border-white bg-[#E2E0DB] shrink-0"
              style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            >
              {artist.cover_image ? (
                <Image
                  src={artist.cover_image}
                  alt={artist.name}
                  width={96} height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl text-[#A8A39D]">
                  ♪
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-xs text-[#8A8680] mb-2">
                <Link href="/" className="hover:text-[#1A1917] transition-colors">Home</Link>
                <span>·</span>
                <Link href="/artists" className="hover:text-[#1A1917] transition-colors">Artists</Link>
                <span>·</span>
                <span className="text-[#1A1917]">{artist.name}</span>
              </nav>

              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1917] leading-tight">
                {artist.name}
              </h1>

              {/* Meta strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-[#8A8680]">
                {artist.origin && <span>📍 {artist.origin}</span>}
                {artist.formed_year && <span>Est. {artist.formed_year}</span>}
                {genre.length > 0 && (
                  <span>{genre.join(" · ")}</span>
                )}
                <span className="text-[#C0B8AE]">
                  {publishedSongs.length} song{publishedSongs.length !== 1 ? "s" : ""}
                  {albums.length > 0 && ` · ${albums.length} album${albums.length !== 1 ? "s" : ""}`}
                </span>
              </div>

              {/* Social links */}
              {artist.social_links && Object.keys(artist.social_links as object).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(artist.social_links as Record<string, string>).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-wider px-2.5 py-1 border border-[#D5D2CB] text-[#5A5651] hover:border-[#1A1917] hover:text-[#1A1917] transition-colors"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {artist.bio && (
            <div className="mt-8 max-w-2xl">
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-3">About</p>
              <p className="text-sm text-[#5A5651] leading-relaxed">{artist.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ALBUMS
      ══════════════════════════════════════════════ */}
      {albums.length > 0 && (
        <section className="border-t border-[#E2E0DB]">
          <div className="container mx-auto px-6 py-12 max-w-5xl">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Discography</p>
            <h2 className="font-serif font-bold text-2xl text-[#1A1917] mb-7">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {albums.map((album) => (
                <AlbumCard
                  key={album.id}
                  title={album.title}
                  slug={album.slug}
                  coverImage={album.cover_image}
                  artistName={artist.name}
                  artistSlug={artist.slug}
                  releaseDate={album.release_date}
                  albumType={album.album_type}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          SONGS — tracklist
      ══════════════════════════════════════════════ */}
      {publishedSongs.length > 0 && (
        <section className="border-t border-[#E2E0DB]" style={{ background: "#FFFFFF" }}>
          <div className="container mx-auto px-6 py-12 max-w-5xl">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Songs</p>
            <h2 className="font-serif font-bold text-2xl text-[#1A1917] mb-6">All Songs</h2>

            {/* Column headers */}
            <div className="grid grid-cols-[2rem_2.5rem_1fr_6rem_4rem] gap-3 items-center px-3 pb-2 border-b border-[#E2E0DB]">
              <span className="text-[9px] text-[#C0B8AE] text-right font-mono">#</span>
              <span />
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE]">Title</span>
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] hidden sm:block">Tags</span>
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] text-right hidden md:block">Time</span>
            </div>

            <div className="divide-y divide-[#E2E0DB]">
              {publishedSongs.map((song, i) => {
                const tags = song.song_tags.map((st) => st.tags).filter(Boolean) as NonNullable<typeof song.song_tags[0]["tags"]>[];
                return (
                  <Link
                    key={song.id}
                    href={`/songs/${song.slug}`}
                    className="grid grid-cols-[2rem_2.5rem_1fr_6rem_4rem] gap-3 items-center -mx-3 px-3 py-3 hover:bg-[#F4F3F0] transition-colors group"
                  >
                    {/* Number / play */}
                    <span className="text-xs text-[#C0B8AE] text-right font-mono group-hover:hidden tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-[#3B5BDB] text-right hidden group-hover:block">▶</span>

                    {/* Cover */}
                    <div className="w-10 h-10 bg-[#E2E0DB] overflow-hidden shrink-0">
                      {song.cover_image ? (
                        <Image src={song.cover_image} alt={song.title} width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-sm">♫</div>
                      )}
                    </div>

                    {/* Title */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1A1917] truncate group-hover:text-[#3B5BDB] transition-colors">
                        {song.title}
                      </p>
                      {(song.view_count ?? 0) > 0 && (
                        <p className="text-[10px] text-[#C0B8AE] font-mono">
                          {(song.view_count ?? 0).toLocaleString()} views
                        </p>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="hidden sm:flex flex-wrap gap-1 items-center">
                      {tags.slice(0, 1).map((tag) => (
                        <span
                          key={tag.id}
                          className="text-[9px] px-1.5 py-0.5 border uppercase tracking-wide"
                          style={{
                            background:  tag.color ? `${tag.color}18` : "#E2E0DB",
                            borderColor: tag.color ? `${tag.color}40` : "#D5D2CB",
                            color:       tag.color ?? "#8A8680",
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    {/* Duration */}
                    <span className="text-[11px] text-[#C0B8AE] text-right font-mono tabular-nums hidden md:block">
                      {fmt(song.duration_sec) ?? "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {publishedSongs.length === 0 && albums.length === 0 && (
        <div className="container mx-auto px-6 py-24 max-w-5xl text-center">
          <p className="text-3xl text-[#C5C2BC] mb-4">♪</p>
          <p className="font-serif text-lg text-[#5A5651]">No content yet for this artist.</p>
        </div>
      )}
    </div>
  );
}