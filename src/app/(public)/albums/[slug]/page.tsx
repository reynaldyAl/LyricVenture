import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
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

function fmt(sec: number | null) {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
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
      <div className="border-b border-[#E2E0DB]" style={{ background: "#FFFFFF" }}>
        <div className="container mx-auto px-6 py-12 max-w-5xl">

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
            <div className="w-44 h-44 sm:w-52 sm:h-52 bg-[#E2E0DB] shrink-0 overflow-hidden shadow-lg">
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-[#8A8680]">
                {year && <span>{year}</span>}
                <span>{publishedSongs.length} track{publishedSongs.length !== 1 ? "s" : ""}</span>
                {duration && <span>{duration}</span>}
                {album.description && (
                  <p className="text-sm text-[#5A5651] leading-relaxed mt-4 max-w-lg w-full">
                    {album.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    className="grid grid-cols-[2rem_2.5rem_1fr_6rem_4rem] gap-3 items-center -mx-3 px-3 py-3 hover:bg-white transition-colors group"
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
                      {song.spotify_track_id && (
                        <p className="text-[10px] text-[#1DB954]">● Spotify</p>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="hidden sm:flex gap-1 items-center">
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