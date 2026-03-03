import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LyricAnalysis from "@/components/public/LyricAnalysis";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

// ── Dynamic metadata per song ─────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const song = await getSong(slug);

  if (!song) {
    return { title: "Song Not Found" };
  }

  const artist  = song.artists as any;
  const title   = artist?.name
    ? `${song.title} — ${artist.name}`
    : song.title;
  const description =
    (song as any).lyric_analyses?.[0]?.intro?.slice(0, 160) ??
    `Lyric analysis and meaning of "${song.title}"${artist?.name ? ` by ${artist.name}` : ""}.`;

  return {
    title,
    description,
    openGraph: {
      title:       `${title} | LyricVenture`,
      description,
      url:         `https://lyricventure.com/songs/${slug}`,
      images:      song.cover_image
        ? [{ url: song.cover_image, width: 400, height: 400, alt: song.title }]
        : [],
      type: "music.song",
    },
    twitter: {
      card:        "summary_large_image",
      title:       `${title} | LyricVenture`,
      description,
      images:      song.cover_image ? [song.cover_image] : [],
    },
  };
}

// ── Types ──────────────────────────────────────────────────
type Highlight  = Tables<"lyric_highlights">;
type Section    = Tables<"lyric_sections"> & { lyric_highlights: Highlight[] };
type Analysis   = Tables<"lyric_analyses"> & { lyric_sections: Section[] };
type SongDetail = Tables<"songs"> & {
  artists:        Tables<"artists"> | null;
  albums:         Tables<"albums">  | null;
  song_tags:      { tags: Pick<Tables<"tags">, "id" | "name" | "slug" | "color"> | null }[];
  lyric_analyses: Analysis[] | Analysis | null;
};

// ── Data ───────────────────────────────────────────────────
async function getSong(slug: string): Promise<SongDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("songs")
    .select(`
      *,
      artists ( * ),
      albums  ( * ),
      song_tags ( tags ( id, name, slug, color ) ),
      lyric_analyses (
        *,
        lyric_sections (
          *,
          lyric_highlights ( * )
        )
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")           // ✅ FIX 1 — ganti is_published → status
    .single();

  if (error || !data) return null;

  // ✅ FIX 2 — filter lyric_analyses yang sudah published saja
  const raw = data as SongDetail;
  const rawAnalyses = Array.isArray(raw.lyric_analyses)
    ? raw.lyric_analyses
    : raw.lyric_analyses
    ? [raw.lyric_analyses]
    : [];

  const publishedAnalyses = rawAnalyses.filter(
    (a: any) => a.status === "published"
  );

  return {
    ...raw,
    lyric_analyses: publishedAnalyses,
  };
}

async function getRelatedSongs(artistId: string, currentSlug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("songs")
    .select("id, title, slug, cover_image, artists ( name )")
    .eq("artist_id", artistId)
    .eq("status", "published")           // ✅ FIX 3 — ganti is_published → status
    .neq("slug", currentSlug)
    .limit(4);
  return (data ?? []) as any[];
}

async function incrementViewCount(songId: string) {
  const supabase = await createClient();
  (supabase.rpc as any)("increment_song_view", { song_id: songId }).then(() => {});
}

function fmt(sec: number | null) {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// ── Page ───────────────────────────────────────────────────
export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const song     = await getSong(slug);
  if (!song) notFound();

  // increment view, tidak block render
  incrementViewCount(song.id);

  const artist        = song.artists as any;
  const album         = song.albums  as any;
  const tags          = song.song_tags.map((st) => st.tags).filter(Boolean) as any[];
  // ✅ FIX 4 — selalu array sekarang, ambil index 0
  const rawAnalyses   = song.lyric_analyses as Analysis[];
  const analysis      = rawAnalyses?.[0] ?? null;
  const relatedSongs  = artist?.id
    ? await getRelatedSongs(artist.id, slug)
    : [];

  const year = song.release_date ? new Date(song.release_date).getFullYear() : null;

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>

      {/* ══════════════════════════════════════════════
          SONG HEADER
      ══════════════════════════════════════════════ */}
      <div className="border-b border-[#E2E0DB]" style={{ background: "#FFFFFF" }}>
        <div className="container mx-auto px-6 py-12 max-w-3xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#8A8680] mb-8">
            <Link href="/" className="hover:text-[#1A1917] transition-colors">Home</Link>
            <span>·</span>
            <Link href="/songs" className="hover:text-[#1A1917] transition-colors">Songs</Link>
            <span>·</span>
            <span className="text-[#1A1917] truncate max-w-[200px]">{song.title}</span>
          </nav>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Cover */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 bg-[#E2E0DB] shrink-0 overflow-hidden shadow-md">
              {song.cover_image ? (
                <Image
                  src={song.cover_image}
                  alt={song.title}
                  width={176} height={176}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-[#A8A39D]">♫</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((tag: any) => (
                    <Link
                      key={tag.id}
                      href={`/songs?tag=${tag.slug}`}
                      className="text-[10px] px-2 py-0.5 border uppercase tracking-wider transition-opacity hover:opacity-70"
                      style={{
                        background:  tag.color ? `${tag.color}18` : "#E2E0DB",
                        borderColor: tag.color ? `${tag.color}40` : "#D5D2CB",
                        color:       tag.color ?? "#8A8680",
                      }}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}

              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1A1917] leading-tight mb-2">
                {song.title}
              </h1>

              {/* Artist */}
              <Link
                href={`/artists/${artist?.slug}`}
                className="text-base font-medium text-[#5A5651] hover:text-[#3B5BDB] transition-colors"
              >
                {artist?.name}
              </Link>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-[#8A8680]">
                {album && (
                  <Link href={`/albums/${album.slug}`} className="hover:text-[#3B5BDB] transition-colors flex items-center gap-1">
                    <span>◎</span>
                    <span>{album.title}</span>
                  </Link>
                )}
                {year && <span>{year}</span>}
                {fmt(song.duration_sec) && <span>{fmt(song.duration_sec)}</span>}
                {song.language && (
                  <span className="uppercase tracking-widest font-mono text-[10px] px-1.5 py-0.5 bg-[#F0EDE8] text-[#8A8680]">
                    {song.language}
                  </span>
                )}
                {(song.view_count ?? 0) > 0 && (
                  <span>{(song.view_count ?? 0).toLocaleString()} views</span>
                )}
              </div>

              {/* Media links */}
              <div className="flex flex-wrap gap-3 mt-5">
                {song.spotify_track_id && (
                  <a
                    href={`https://open.spotify.com/track/${song.spotify_track_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-1.5 border border-[#E2E0DB] text-[#5A5651] hover:border-[#1DB954] hover:text-[#1DB954] transition-colors"
                  >
                    <span>●</span> Open in Spotify
                  </a>
                )}
                {song.youtube_url && (
                  <a
                    href={song.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs px-3 py-1.5 border border-[#E2E0DB] text-[#5A5651] hover:border-[#FF0000] hover:text-[#FF0000] transition-colors"
                  >
                    <span>▶</span> Watch on YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          MAIN CONTENT — analysis + sections
      ══════════════════════════════════════════════ */}
      <div className="container mx-auto px-6 py-12 max-w-3xl">

        {analysis ? (
          <LyricAnalysis analysis={analysis} />
        ) : (
          <div className="py-16 text-center border border-dashed border-[#D5D2CB]">
            <p className="text-3xl text-[#C5C2BC] mb-3">✦</p>
            <p className="font-serif text-lg text-[#5A5651]">Analysis coming soon.</p>
            <p className="text-sm text-[#8A8680] italic mt-1">
              Our team is working on decoding this song.
            </p>
          </div>
        )}

        {/* ── Artist info strip ── */}
        {artist && (
          <div className="mt-14 pt-10 border-t border-[#E2E0DB]">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-4">About the Artist</p>
            <Link href={`/artists/${artist.slug}`} className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-full bg-[#E2E0DB] overflow-hidden shrink-0 ring-2 ring-[#E2E0DB] group-hover:ring-[#3B5BDB] transition-all">
                {artist.cover_image ? (
                  <Image src={artist.cover_image} alt={artist.name} width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#A8A39D]">♪</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors">
                  {artist.name}
                </p>
                {artist.origin && (
                  <p className="text-xs text-[#8A8680]">{artist.origin}</p>
                )}
              </div>
              <span className="text-xs text-[#3B5BDB] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                View profile →
              </span>
            </Link>
            {artist.bio && (
              <p className="text-sm text-[#5A5651] leading-relaxed mt-4 line-clamp-3">
                {artist.bio}
              </p>
            )}
          </div>
        )}

        {/* ── Related songs ── */}
        {relatedSongs.length > 0 && (
          <div className="mt-14 pt-10 border-t border-[#E2E0DB]">
            <div className="flex items-baseline justify-between mb-5">
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680]">
                More from {artist?.name}
              </p>
              <Link href={`/artists/${artist?.slug}`} className="text-xs text-[#3B5BDB] hover:underline">
                See all →
              </Link>
            </div>
            <div className="divide-y divide-[#E2E0DB]">
              {relatedSongs.map((s: any) => (
                <Link
                  key={s.id}
                  href={`/songs/${s.slug}`}
                  className="flex items-center gap-4 py-3 -mx-3 px-3 hover:bg-white transition-colors group"
                >
                  <div className="w-9 h-9 bg-[#E2E0DB] overflow-hidden shrink-0">
                    {s.cover_image
                      ? <Image src={s.cover_image} alt={s.title} width={36} height={36} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xs text-[#A8A39D]">♫</div>}
                  </div>
                  <p className="flex-1 text-sm font-medium text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors truncate">
                    {s.title}
                  </p>
                  <span className="text-xs text-[#3B5BDB] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}