import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import VinylCard from "@/components/public/VynilCard";
import AlbumCard from "@/components/public/AlbumCard";
import HeroAnalysisCarousel from "@/components/public/HeroAnalysisCarousel";

// ── Data fetching ─────────────────────────────────────────
async function getHomeData() {
  const supabase = await createClient();
  const [
    { data: artists },
    { data: analyses },
    { data: songs },
    { data: albums },
    { count: totalSongs },
    { count: totalArtists },
    { count: totalAnalyses },
  ] = await Promise.all([
    supabase
      .from("artists")
      .select("id, name, slug, cover_image, genre, origin, is_active")
      .eq("status", "published")   // ✅ tambah filter status
      .eq("is_active", true)
      .order("name")
      .limit(8),
    supabase
      .from("lyric_analyses")
      .select(`id, intro, theme, published_at, songs ( id, title, slug, cover_image, language, artists ( id, name, slug ) )`)
      .eq("status", "published")   // ✅ ganti is_published → status
      .order("published_at", { ascending: false })
      .limit(4),
    supabase
      .from("songs")
      .select(`id, title, slug, cover_image, language, duration_sec, view_count, artists ( id, name, slug ), song_tags ( tags ( id, name, slug, color ) )`)
      .eq("status", "published")   // ✅ ganti is_published → status
      .order("view_count", { ascending: false })  // ✅ order by popular
      .limit(8),
    supabase
      .from("albums")
      .select(`id, title, slug, cover_image, release_date, album_type, artists ( id, name, slug )`)
      .eq("status", "published")   // ✅ tambah filter status (BUG FIX)
      .order("release_date", { ascending: false })
      .limit(6),
    // Stats counters
    supabase.from("songs").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("artists").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("lyric_analyses").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  return {
    artists:       (artists  ?? []) as any[],
    analyses:      (analyses ?? []) as any[],
    songs:         (songs    ?? []) as any[],
    albums:        (albums   ?? []) as any[],
    stats: {
      songs:    totalSongs    ?? 0,
      artists:  totalArtists  ?? 0,
      analyses: totalAnalyses ?? 0,
    },
  };
}

function formatDuration(sec: number | null): string {
  if (!sec) return "";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// ── Page ──────────────────────────────────────────────────
export default async function HomePage() {
  const { artists, analyses, songs, albums, stats } = await getHomeData();
  const heroAnalysis = analyses[0];
  const heroSong     = heroAnalysis?.songs as any;
  const heroArtist   = heroSong?.artists as any;
  const restAnalyses = analyses.slice(1);

  return (
    <div className="bg-[#F5F4F1] text-[#1A1917]">
      {/* ══════════════════════════════════════════════
          HERO — elevated editorial
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-[#3B5BDB]/12 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#1A1917]/10 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 pt-20 pb-16 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

            {/* Left: editorial text */}
            <div>
              <div className="inline-flex items-center gap-3 mb-6 px-3 py-1.5 rounded-full border border-[#E7E4DE] bg-white/60 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3B5BDB]" />
                <p className="text-[10px] tracking-[0.45em] uppercase text-[#8A8680]">
                  Issue No. 01 · Song &amp; Lyric Meanings
                </p>
              </div>

              <h1 className="text-5xl md:text-[4.2rem] font-bold font-serif leading-[1.01] tracking-tight mb-6">
                The words<br />
                <span className="italic text-[#3B5BDB]">behind</span><br />
                the music.
              </h1>

              <p className="text-base text-[#5A5651] leading-relaxed mb-8 max-w-md">
                We decode lyrics — the metaphors, the pain, the joy — so you can
                hear your favorite songs in a completely new way.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/songs"
                  className="px-5 py-2.5 bg-[#1A1917] text-[#F4F3F0] text-sm font-medium hover:bg-[#3B5BDB] transition-colors shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] rounded-md">
                  Browse Songs
                </Link>
                <Link href="/analyses"
                  className="px-5 py-2.5 border border-[#C5C2BC] text-[#5A5651] text-sm hover:border-[#1A1917] hover:text-[#1A1917] transition-colors bg-white/70 backdrop-blur rounded-md">
                  Read Analyses
                </Link>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E2E0DB]">
                {[
                  { value: stats.songs,    label: "Songs" },
                  { value: stats.artists,  label: "Artists" },
                  { value: stats.analyses, label: "Analyses" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-[#E7E4DE] bg-white/60 backdrop-blur px-4 py-3">
                    <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">{s.value}</p>
                    <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: hero analysis carousel */}
            <HeroAnalysisCarousel analyses={analyses as any[]} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          LATEST ANALYSES — premium grid
      ══════════════════════════════════════════════ */}
      {restAnalyses.length > 0 && (
        <section className="border-t border-[#E2E0DB] bg-white">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-1.5">Deep Dives</p>
                <h2 className="font-serif font-bold text-2xl text-[#1A1917]">Latest Analyses</h2>
              </div>
              <Link href="/analyses" className="text-xs text-[#3B5BDB] hover:underline tracking-wide pb-0.5">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {restAnalyses.map((analysis: any) => {
                const song   = analysis.songs as any;
                const artist = song?.artists as any;
                return (
                  <Link key={analysis.id} href={`/songs/${song?.slug}`}
                    className="bg-white p-6 group flex flex-col border border-[#EFEDE8] rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">

                    <div className="flex gap-3 mb-4">
                      <div className="w-12 h-12 bg-[#E8E5E0] shrink-0 overflow-hidden rounded-md">
                        {song?.cover_image
                          ? <Image src={song.cover_image} alt={song.title} width={48} height={48} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-lg">✦</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] tracking-widest uppercase text-[#8A8680] mb-0.5">{artist?.name}</p>
                        <p className="font-serif font-bold text-sm leading-snug text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors truncate">
                          {song?.title}
                        </p>
                      </div>
                    </div>

                    {analysis.theme && (
                      <p className="text-xs text-[#5A5651] italic mb-2 leading-relaxed">
                        &ldquo;{analysis.theme}&rdquo;
                      </p>
                    )}

                    {analysis.intro && (
                      <p className="text-xs text-[#8A8680] leading-relaxed line-clamp-3 flex-1">
                        {analysis.intro}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-4 pt-4 border-t border-[#F0EDE8]">
                      <span className="text-[10px] tracking-wide uppercase text-[#3B5BDB] group-hover:underline">
                        Read analysis
                      </span>
                      <span className="text-[10px] text-[#3B5BDB] group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          ARTISTS — vinyl grid
      ══════════════════════════════════════════════ */}
      {artists.length > 0 && (
        <section className="border-t border-[#E2E0DB] bg-[#F4F3F0]">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-1.5">The Creators</p>
                <h2 className="font-serif font-bold text-2xl text-[#1A1917]">Artists</h2>
                <p className="text-xs text-[#8A8680] mt-1">Hover the vinyl to spin ↻</p>
              </div>
              <Link href="/artists" className="text-xs text-[#3B5BDB] hover:underline">
                All artists →
              </Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-6">
              {artists.map((artist: any) => (
                <VinylCard
                  key={artist.id}
                  name={artist.name}
                  slug={artist.slug}
                  coverImage={artist.cover_image}
                  origin={artist.origin}
                  genre={artist.genre}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          ALBUMS — cover grid
      ══════════════════════════════════════════════ */}
      {albums.length > 0 && (
        <section className="border-t border-[#E2E0DB] bg-white">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-1.5">Discography</p>
                <h2 className="font-serif font-bold text-2xl text-[#1A1917]">Albums</h2>
              </div>
              <Link href="/albums" className="text-xs text-[#3B5BDB] hover:underline">All albums →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
              {albums.map((album: any) => (
                <AlbumCard
                  key={album.id}
                  title={album.title}
                  slug={album.slug}
                  coverImage={album.cover_image}
                  artistName={album.artists?.name}
                  artistSlug={album.artists?.slug}
                  releaseDate={album.release_date}
                  albumType={album.album_type}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          SONGS — numbered tracklist
      ══════════════════════════════════════════════ */}
      {songs.length > 0 && (
        <section className="border-t border-[#E2E0DB] bg-[#F4F3F0]">
          <div className="container mx-auto px-6 py-16 max-w-6xl">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-1.5">Now Playing</p>
                <h2 className="font-serif font-bold text-2xl text-[#1A1917]">Recent Songs</h2>
              </div>
              <Link href="/songs" className="text-xs text-[#3B5BDB] hover:underline">All songs →</Link>
            </div>

            <div className="flex items-center gap-4 px-2 mb-2 border-b border-[#E2E0DB] pb-2">
              <span className="text-[9px] text-[#C0B8AE] w-6 text-right font-mono">#</span>
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] w-10">&nbsp;</span>
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] flex-1">Title</span>
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] hidden sm:block w-24">Tags</span>
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] hidden md:block w-12 text-right">Views</span>
              <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] hidden md:block w-12 text-right">Time</span>
            </div>

            <div className="divide-y divide-[#E2E0DB]">
              {songs.map((song: any, i: number) => {
                const artist = song.artists as any;
                const tags   = song.song_tags?.map((st: any) => st.tags).filter(Boolean) ?? [];
                return (
                  <Link key={song.id} href={`/songs/${song.slug}`}
                    className="flex items-center gap-4 py-2.5 -mx-2 px-2 hover:bg-white transition-colors group rounded-lg">

                    <span className="text-xs text-[#C0B8AE] w-6 text-right shrink-0 font-mono tabular-nums group-hover:hidden">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-xs text-[#3B5BDB] w-6 text-right shrink-0 hidden group-hover:block">
                      ▶
                    </span>

                    <div className="w-10 h-10 bg-[#E2E0DB] shrink-0 overflow-hidden rounded-md">
                      {song.cover_image
                        ? <Image src={song.cover_image} alt={song.title} width={40} height={40} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm text-[#A8A39D]">♫</div>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1917] truncate group-hover:text-[#3B5BDB] transition-colors">
                        {song.title}
                      </p>
                      <p className="text-xs text-[#8A8680] truncate">{artist?.name}</p>
                    </div>

                    <div className="hidden sm:flex items-center gap-1 shrink-0 w-24">
                      {tags.slice(0, 1).map((tag: any) => (
                        <span key={tag.id}
                          className="text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider border"
                          style={{
                            background:  tag.color ? `${tag.color}18` : "#E2E0DB",
                            borderColor: tag.color ? `${tag.color}40` : "#D5D2CB",
                            color:       tag.color ?? "#8A8680",
                          }}>
                          {tag.name}
                        </span>
                      ))}
                    </div>

                    {song.view_count !== null && (
                      <span className="text-[11px] text-[#C0B8AE] shrink-0 hidden md:block w-12 text-right font-mono tabular-nums">
                        {(song.view_count ?? 0).toLocaleString()}
                      </span>
                    )}

                    <span className="text-[11px] text-[#C0B8AE] shrink-0 hidden md:block w-12 text-right font-mono tabular-nums">
                      {formatDuration(song.duration_sec) || "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════════════ */}
      {artists.length === 0 && analyses.length === 0 && songs.length === 0 && (
        <section className="py-32 text-center">
          <p className="text-5xl mb-5">♪</p>
          <p className="font-serif text-xl text-[#5A5651] mb-2">The library is being built.</p>
          <p className="text-sm text-[#8A8680] italic mb-6">Check back soon — great analyses take time.</p>
        </section>
      )}

      {/* ══════════════════════════════════════════════
          FOOTER QUOTE
      ══════════════════════════════════════════════ */}
      <section className="border-t-2 border-[#1A1917] py-20 bg-[#F4F3F0]">
        <div className="container mx-auto px-6 max-w-2xl text-center">
          <span className="text-3xl text-[#C5C2BC] block mb-6">❝</span>
          <blockquote className="text-xl md:text-2xl font-serif italic text-[#5A5651] leading-relaxed">
            Music gives a soul to the universe, wings to the mind,
            flight to the imagination, and life to everything.
          </blockquote>
          <p className="text-xs text-[#8A8680] mt-5 tracking-[0.3em] uppercase">— Plato</p>
          <div className="flex justify-center gap-4 mt-10">
            <Link href="/songs"
              className="text-xs text-[#5A5651] hover:text-[#1A1917] transition-colors border-b border-transparent hover:border-[#1A1917]">
              Browse Songs
            </Link>
            <span className="text-[#C5C2BC]">·</span>
            <Link href="/artists"
              className="text-xs text-[#5A5651] hover:text-[#1A1917] transition-colors border-b border-transparent hover:border-[#1A1917]">
              Explore Artists
            </Link>
            <span className="text-[#C5C2BC]">·</span>
            <Link href="/analyses"
              className="text-xs text-[#5A5651] hover:text-[#1A1917] transition-colors border-b border-transparent hover:border-[#1A1917]">
              Read Analyses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}