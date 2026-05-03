import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LyricAnalysis from "@/components/public/LyricAnalysis";
import type { Tables } from "@/lib/types";

type Highlight    = Tables<"lyric_highlights">;
type Section      = Tables<"lyric_sections"> & { lyric_highlights: Highlight[] };
type AnalysisFull = Tables<"lyric_analyses"> & {
  lyric_sections: Section[];
  songs: (Tables<"songs"> & {
    artists: Tables<"artists"> | null;
    albums:  Tables<"albums">  | null;
  }) | null;
};

async function getAnalysis(id: string): Promise<AnalysisFull | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lyric_analyses")
    .select(`
      *,
      songs (
        *,
        artists ( * ),
        albums  ( * )
      ),
      lyric_sections (
        *,
        lyric_highlights ( * )
      )
    `)
    .eq("id", id)
    .eq("status", "published")    // ✅ FIX 3 — ganti is_published → status
    .single();

  if (error || !data) return null;

  const raw = data as AnalysisFull;
  return {
    ...raw,
    lyric_sections: [...(raw.lyric_sections ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => ({
        ...s,
        lyric_highlights: [...(s.lyric_highlights ?? [])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      })),
  };
}

    function formatDate(dateStr: string | null): string {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

// ── SEO ───────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id }   = await params;
  const analysis = await getAnalysis(id);
  if (!analysis) return { title: "Analysis Not Found" };

  const song   = analysis.songs as any;
  const artist = song?.artists;
  const title  = song?.title
    ? `${song.title}${artist?.name ? ` — ${artist.name}` : ""} · Lyric Analysis`
    : "Lyric Analysis";
  const description =
    analysis.intro?.slice(0, 160) ??
    `Deep dive into the meaning of "${song?.title}".`;

  return {
    title,
    description,
    openGraph: {
      title:       `${title} | LyricVenture`,
      description,
      images:      song?.cover_image ? [{ url: song.cover_image }] : [],
    },
  };
}

// ── Page ──────────────────────────────────────────────────
export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = await params;
  const analysis = await getAnalysis(id);
  if (!analysis) notFound();

  const song   = analysis.songs as any;
  const artist = song?.artists  as any;
  const album  = song?.albums   as any;
  const year   = song?.release_date
    ? new Date(song.release_date).getFullYear()
    : null;
  const publishedLabel = formatDate(analysis.published_at ?? null);

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>

      {/* ── Header ── */}
      <section className="relative overflow-hidden border-b border-[#E2E0DB] bg-white">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#3B5BDB]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#1A1917]/8 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-12 max-w-3xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#A8A39D] mb-6">
            <Link href="/" className="hover:text-[#1A1917] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/analyses" className="hover:text-[#1A1917] transition-colors">Analyses</Link>
            <span>/</span>
            <span className="text-[#5A5651] truncate max-w-[200px]">{song?.title}</span>
          </nav>

          <div className="flex gap-6 items-start">
            {/* Cover */}
            {song?.cover_image && (
              <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 rounded-md shadow-md overflow-hidden ring-1 ring-black/5">
                <Image
                  src={song.cover_image}
                  alt={song.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                  priority
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">
                Lyric Analysis
              </p>
              <h1 className="font-serif font-bold text-3xl md:text-[2.6rem] text-[#1A1917] leading-tight">
                {song?.title ?? "Untitled"}
              </h1>

              {/* Artist + album */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {artist && (
                  <Link
                    href={`/artists/${artist.slug}`}
                    className="text-sm font-medium text-[#3B5BDB] hover:underline"
                  >
                    {artist.name}
                  </Link>
                )}
                {album && (
                  <>
                    <span className="text-[#C5C2BC] text-xs">·</span>
                    <Link
                      href={`/albums/${album.slug}`}
                      className="text-xs text-[#8A8680] hover:text-[#1A1917] transition-colors"
                    >
                      {album.title}{year && ` (${year})`}
                    </Link>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {song?.language && (
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A8680] bg-[#F0EDE8] px-2 py-1 rounded">
                    {song.language}
                  </span>
                )}
                {publishedLabel && (
                  <span className="text-[10px] tracking-widest uppercase text-[#8A8680] bg-[#F0EDE8] px-2 py-1 rounded">
                    Published {publishedLabel}
                  </span>
                )}
              </div>

              {/* Theme */}
              {analysis.theme && (
                <p className="mt-4 text-sm text-[#5A5651] italic border-l-2 border-[#C5C2BC] pl-3">
                  Theme: {analysis.theme}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container mx-auto px-6 py-12 max-w-3xl space-y-10">

        {/* Intro */}
        {analysis.intro && (
          <section>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8A39D] font-semibold mb-3">
              Introduction
            </p>
            <p className="text-sm text-[#3A3633] leading-relaxed font-serif">
              {analysis.intro}
            </p>
          </section>
        )}

        {/* Background */}
        {analysis.background && (
          <section>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8A39D] font-semibold mb-3">
              Background
            </p>
            <p className="text-sm text-[#3A3633] leading-relaxed font-serif">
              {analysis.background}
            </p>
          </section>
        )}

        {/* Lyric sections */}
        {analysis.lyric_sections.length > 0 && (
          <section>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8A39D] font-semibold mb-5">
              Lyric Breakdown
            </p>
            <LyricAnalysis analysis={analysis} />
          </section>
        )}

        {/* Conclusion */}
        {analysis.conclusion && (
          <section className="border-t border-[#E2E0DB] pt-8">
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8A39D] font-semibold mb-3">
              Conclusion
            </p>
            <p className="text-sm text-[#3A3633] leading-relaxed font-serif">
              {analysis.conclusion}
            </p>
          </section>
        )}

        {/* Back to song */}
        {song?.slug && (
          <div className="border-t border-[#E2E0DB] pt-6 flex items-center justify-between">
            <Link
              href={`/songs/${song.slug}`}
              className="inline-flex items-center gap-2 text-sm text-[#3B5BDB] hover:underline"
            >
              ← Back to song page
            </Link>
            <Link
              href="/analyses"
              className="text-xs text-[#8A8680] hover:text-[#1A1917] transition-colors"
            >
              All analyses →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}