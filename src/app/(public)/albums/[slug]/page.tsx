import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import AlbumTracksPager from "@/components/public/AlbumTracksPager";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const album    = await getAlbum(slug);

  if (!album) return { title: "Album Not Found" };

  const artist      = album.artists;
  const year        = album.release_date ? new Date(album.release_date).getFullYear() : null;
  const title       = artist?.name
    ? `${album.title} — ${artist.name}`
    : album.title;
  const description =
    album.description?.slice(0, 160) ??
    `${album.title}${year ? ` (${year})` : ""}${artist?.name ? ` by ${artist.name}` : ""}. Browse tracks and lyric analyses on LyricVenture.`;

  return {
    title,
    description,
    openGraph: {
      title:       `${title} | LyricVenture`,
      description,
      url:         `https://lyricventure.com/albums/${slug}`,
      images:      album.cover_image
        ? [{ url: album.cover_image, alt: album.title }]
        : [],
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${title} | LyricVenture`,
      description,
      images:      album.cover_image ? [album.cover_image] : [],
    },
  };
}

// ── Types ─────────────────────────────────────────────────
type SongInAlbum = Pick<
  Tables<"songs">,
  // ✅ FIX — ganti is_published → status
  "id" | "title" | "slug" | "cover_image" | "duration_sec" | "status" | "view_count" | "spotify_track_id"
> & {
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "slug" | "color"> | null }[];
};

type AlbumDetail = Tables<"albums"> & {
  artists: Pick<Tables<"artists">, "id" | "name" | "slug" | "cover_image"> | null;
  songs:   SongInAlbum[];
};

async function getAlbum(slug: string): Promise<AlbumDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select(`
      *,
      artists ( id, name, slug, cover_image ),
      songs (
        id, title, slug, duration_sec, status,
        view_count, spotify_track_id, cover_image,
        song_tags ( tags ( id, name, slug, color ) )
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")   // ✅ FIX — album harus published
    .single();

  if (error || !data) return null;
  return data as AlbumDetail;
}

function totalDuration(songs: SongInAlbum[]) {
  const total = songs.reduce((acc, s) => acc + (s.duration_sec ?? 0), 0);
  if (!total) return null;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m} min${s > 0 ? ` ${s} sec` : ""}`;
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const album    = await getAlbum(slug);
  if (!album) notFound();

  const artist = album.artists;
  // ✅ FIX — filter pakai status bukan is_published
  const publishedSongs = album.songs.filter((s) => s.status === "published");
  const year           = album.release_date ? new Date(album.release_date).getFullYear() : null;
  const duration       = totalDuration(publishedSongs);

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>

      {/* ══════════════════════════════════════════════
          ALBUM HEADER
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[#E2E0DB] bg-white">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#3B5BDB]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#1A1917]/8 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-12 max-w-5xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#8A8680] mb-8">
            <Link href="/" className="hover:text-[#1A1917] transition-colors">Home</Link>
            <span>·</span>
            {artist && (
              <>
                <Link href={`/artists/${artist.slug}`} className="hover:text-[#1A1917] transition-colors">
                  {artist.name}
                </Link>
                <span>·</span>
              </>
            )}
            <span className="text-[#1A1917] truncate max-w-[180px]">{album.title}</span>
          </nav>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Cover */}
            <div className="w-44 h-44 sm:w-52 sm:h-52 bg-[#E2E0DB] shrink-0 overflow-hidden shadow-lg ring-1 ring-black/5">
              {album.cover_image ? (
                <Image
                  src={album.cover_image}
                  alt={album.title}
                  width={208} height={208}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#A8A39D]">
                  <span className="text-4xl">◎</span>
                  <span className="text-[10px] tracking-widest uppercase">Album</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Album</p>
              {/* Type badge */}
              {album.album_type && album.album_type !== "album" && (
                <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 border border-[#D5D2CB] text-[#8A8680] inline-block mb-3">
                  {album.album_type}
                </span>
              )}

              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1917] leading-tight mb-2">
                {album.title}
              </h1>

              {/* Artist link */}
              {artist && (
                <Link
                  href={`/artists/${artist.slug}`}
                  className="text-base font-medium text-[#5A5651] hover:text-[#3B5BDB] transition-colors flex items-center gap-2"
                >
                  {artist.cover_image && (
                    <Image
                      src={artist.cover_image}
                      alt={artist.name}
                      width={20} height={20}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  )}
                  {artist.name}
                </Link>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-[#8A8680]">
                {year && (
                  <span className="uppercase tracking-widest font-mono text-[10px] px-2 py-1 bg-[#F0EDE8] text-[#8A8680]">
                    {year}
                  </span>
                )}
                <span className="uppercase tracking-widest font-mono text-[10px] px-2 py-1 bg-[#F0EDE8] text-[#8A8680]">
                  {publishedSongs.length} track{publishedSongs.length !== 1 ? "s" : ""}
                </span>
                {duration && (
                  <span className="uppercase tracking-widest font-mono text-[10px] px-2 py-1 bg-[#F0EDE8] text-[#8A8680]">
                    {duration}
                  </span>
                )}
              </div>

              {album.description && (
                <p className="text-sm text-[#5A5651] leading-relaxed mt-4 max-w-2xl">
                  {album.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRACKLIST
      ══════════════════════════════════════════════ */}
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Tracklist</p>
        <h2 className="font-serif font-bold text-2xl text-[#1A1917] mb-6">
          {publishedSongs.length} Track{publishedSongs.length !== 1 ? "s" : ""}
        </h2>

        {publishedSongs.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#D5D2CB]">
            <p className="text-3xl text-[#C5C2BC] mb-3">♫</p>
            <p className="font-serif text-lg text-[#5A5651]">No tracks available yet.</p>
          </div>
        ) : (
          <div>
            <AlbumTracksPager songs={publishedSongs} pageSize={4} />

            {/* Total duration */}
            {duration && (
              <div className="flex justify-end pt-4 border-t border-[#E2E0DB] mt-2">
                <p className="text-xs text-[#8A8680] font-mono">
                  Total · <span className="text-[#1A1917] font-medium">{duration}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Back to artist */}
        {artist && (
          <div className="mt-12 pt-10 border-t border-[#E2E0DB]">
            <Link
              href={`/artists/${artist.slug}`}
              className="inline-flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E2E0DB] ring-2 ring-[#E2E0DB] group-hover:ring-[#3B5BDB] transition-all">
                {artist.cover_image ? (
                  <Image src={artist.cover_image} alt={artist.name} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-sm">♪</div>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#8A8680]">Artist</p>
                <p className="text-sm font-semibold text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors">
                  {artist.name}
                </p>
              </div>
              <span className="text-xs text-[#3B5BDB] opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                View profile →
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}