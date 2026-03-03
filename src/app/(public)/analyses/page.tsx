import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lyric Analyses",
  description: "Deep dive into song meanings. Read expert lyric analyses covering metaphor, symbolism, and cultural context.",
  openGraph: {
    title: "Lyric Analyses | LyricVenture",
    description: "Deep dive into song meanings with expert lyric analyses.",
    url: "https://lyricventure.com/analyses",
  },
};

type AnalysisItem = Pick<Tables<"lyric_analyses">, "id" | "theme" | "intro" | "published_at"> & {
  songs: (Pick<Tables<"songs">, "id" | "title" | "slug" | "cover_image" | "language"> & {
    artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
  }) | null;
};

async function getAnalyses(): Promise<AnalysisItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lyric_analyses")
    .select(`
      id, theme, intro, published_at,
      songs (
        id, title, slug, cover_image, language,
        artists ( id, name, slug )
      )
    `)
    .eq("status", "published")           // ✅ FIX 1 — ganti is_published → status
    .order("published_at", { ascending: false });

  if (error) { console.error("getAnalyses:", error.message); return []; }
  return (data ?? []) as AnalysisItem[];
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30)  return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? "s" : ""} ago`;
}

export default async function AnalysesPage() {
  const analyses = await getAnalyses();

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>

      {/* Header */}
      <div className="border-b border-[#E2E0DB]" style={{ background: "#FFFFFF" }}>
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">Deep Dives</p>
          <h1 className="font-serif font-bold text-4xl text-[#1A1917]">Lyric Analyses</h1>
          <p className="text-sm text-[#8A8680] mt-2">
            {analyses.length} analysis{analyses.length !== 1 ? "s" : ""} published
          </p>
        </div>
      </div>

      {/* List */}
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {analyses.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl text-[#C5C2BC] mb-4">✦</p>
            <p className="font-serif text-xl text-[#5A5651]">No analyses published yet.</p>
            <p className="text-sm text-[#8A8680] italic mt-2">Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-[#E2E0DB]">
            {analyses.map((analysis, i) => {
              const song   = analysis.songs;
              const artist = song?.artists;
              return (
                <Link
                  key={analysis.id}
                  href={`/analyses/${analysis.id}`}  // ✅ FIX 2 — link ke analysis bukan song
                  className="group flex gap-5 py-6 -mx-3 px-3 hover:bg-white transition-colors"
                >
                  {/* Index number */}
                  <span className="text-xs text-[#C0B8AE] font-mono tabular-nums mt-1 shrink-0 w-6 text-right">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  {/* Cover */}
                  <div className="w-16 h-16 bg-[#E2E0DB] shrink-0 overflow-hidden">
                    {song?.cover_image ? (
                      <Image
                        src={song.cover_image}
                        alt={song.title}
                        width={64} height={64}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-xl">✦</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] tracking-widest uppercase text-[#8A8680] mb-0.5">
                          {artist?.name}
                          {song?.language && (
                            <span className="ml-2 font-mono px-1 bg-[#F0EDE8] text-[#A8A39D]">
                              {song.language}
                            </span>
                          )}
                        </p>
                        <p className="font-serif font-bold text-lg text-[#1A1917] leading-snug group-hover:text-[#3B5BDB] transition-colors truncate">
                          {song?.title}
                        </p>
                      </div>

                      {/* Date + arrow */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[#C0B8AE]">
                          {timeAgo(analysis.published_at)}
                        </p>
                        <span className="text-xs text-[#3B5BDB] opacity-0 group-hover:opacity-100 transition-opacity block mt-1">
                          Read →
                        </span>
                      </div>
                    </div>

                    {/* Theme */}
                    {analysis.theme && (
                      <p className="text-sm italic text-[#5A5651] mt-1.5">
                        &ldquo;{analysis.theme}&rdquo;
                      </p>
                    )}

                    {/* Intro preview */}
                    {analysis.intro && (
                      <p className="text-xs text-[#8A8680] mt-2 leading-relaxed line-clamp-2">
                        {analysis.intro}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}