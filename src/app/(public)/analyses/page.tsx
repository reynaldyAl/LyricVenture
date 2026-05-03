import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lyric Analyses",
  description:
    "Deep dive into song meanings. Read expert lyric analyses covering metaphor, symbolism, and cultural context.",
  openGraph: {
    title: "Lyric Analyses | LyricVenture",
    description: "Deep dive into song meanings with expert lyric analyses.",
    url: "https://lyricventure.com/analyses",
  },
};

type AnalysisItem = Pick<
  Tables<"lyric_analyses">,
  "id" | "theme" | "intro" | "published_at"
> & {
  songs:
    | (Pick<
        Tables<"songs">,
        "id" | "title" | "slug" | "cover_image" | "language"
      > & {
        artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
      })
    | null;
};

async function getAnalyses(
  page: number,
  pageSize: number,
): Promise<{ items: AnalysisItem[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("lyric_analyses")
    .select(
      `
      id, theme, intro, published_at,
      songs (
        id, title, slug, cover_image, language,
        artists ( id, name, slug )
      )
    `,
      { count: "exact" },
    )
    .eq("status", "published") // ✅ FIX 1 — ganti is_published → status
    .order("published_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("getAnalyses:", error.message);
    return { items: [], total: 0 };
  }
  return { items: (data ?? []) as AnalysisItem[], total: count ?? 0 };
}

async function getLatestPublished(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lyric_analyses")
    .select("published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestPublished:", error.message);
    return null;
  }
  return data?.published_at ?? null;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? "s" : ""} ago`;
}

export default async function AnalysesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params?.page ?? 1));
  const pageSize = 10;
  const [{ items, total }, latestPublished] = await Promise.all([
    getAnalyses(currentPage, pageSize),
    getLatestPublished(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const analyses =
    safePage === currentPage || total === 0
      ? items
      : (await getAnalyses(safePage, pageSize)).items;
  const fromIndex = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIndex = Math.min(total, safePage * pageSize);

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[#E2E0DB] bg-white">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#3B5BDB]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#1A1917]/8 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-14 max-w-5xl">
          <div className="inline-flex items-center gap-3 mb-5 px-3 py-1.5 rounded-full border border-[#E7E4DE] bg-white/70 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3B5BDB]" />
            <p className="text-[10px] tracking-[0.45em] uppercase text-[#8A8680]">
              Issue No. 01 - Song and Lyric Meanings
            </p>
          </div>

          <h1 className="font-serif font-bold text-4xl md:text-[3.25rem] text-[#1A1917] leading-tight">
            Lyric Analyses
          </h1>
          <p className="text-sm text-[#6A665F] mt-3 max-w-2xl">
            Deep dive into song meanings, metaphors, and cultural context. Each
            entry is curated to help you hear the music in a new way.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {total}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Published
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {latestPublished ? timeAgo(latestPublished) : "-"}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Latest Update
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* List */}
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {analyses.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl text-[#C5C2BC] mb-4">✦</p>
            <p className="font-serif text-xl text-[#5A5651]">
              No analyses published yet.
            </p>
            <p className="text-sm text-[#8A8680] italic mt-2">
              Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#8A8680]">
              <span>
                Showing {fromIndex}-{toIndex} of {total}
              </span>
              <span className="text-[10px] uppercase tracking-widest">
                Page {safePage} of {totalPages}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#ECE8E1] bg-white/80 backdrop-blur">
              <table className="w-full text-left">
                <thead className="bg-[#F4F3F0] text-[10px] uppercase tracking-widest text-[#8A8680]">
                  <tr>
                    <th className="py-3 px-4 text-right font-medium">#</th>
                    <th className="py-3 px-4 font-medium">Cover</th>
                    <th className="py-3 px-4 font-medium">Title</th>
                    <th className="py-3 px-4 font-medium hidden md:table-cell">
                      Theme
                    </th>
                    <th className="py-3 px-4 font-medium text-right">
                      Published
                    </th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEAE3]">
                  {analyses.map((analysis, i) => {
                    const song = analysis.songs;
                    const artist = song?.artists;
                    const rowNumber = fromIndex + i;
                    return (
                      <tr
                        key={analysis.id}
                        className="group hover:bg-white transition-colors"
                      >
                        <td className="py-4 px-4 text-right text-xs font-mono tabular-nums text-[#C0B8AE]">
                          {String(rowNumber).padStart(2, "0")}
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-12 h-12 rounded-md bg-[#E2E0DB] overflow-hidden ring-1 ring-black/5">
                            {song?.cover_image ? (
                              <Image
                                src={song.cover_image}
                                alt={song.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-sm">
                                ✦
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="min-w-0">
                            <Link
                              href={`/analyses/${analysis.id}`}
                              className="font-serif font-bold text-sm text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors line-clamp-1"
                            >
                              {song?.title}
                            </Link>
                            <p className="text-[10px] uppercase tracking-widest text-[#8A8680] mt-1">
                              {artist?.name}
                              {song?.language && (
                                <span className="ml-2 font-mono px-1.5 py-0.5 rounded bg-[#F0EDE8] text-[#A8A39D]">
                                  {song.language}
                                </span>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          <p className="text-xs italic text-[#5A5651] line-clamp-1">
                            {analysis.theme ? `"${analysis.theme}"` : "-"}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-[#C0B8AE]">
                          {timeAgo(analysis.published_at)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/analyses/${analysis.id}`}
                            className="text-[10px] uppercase tracking-widest text-[#3B5BDB] hover:underline"
                          >
                            Read
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              {safePage > 1 ? (
                <Link
                  href={`/analyses?page=${safePage - 1}`}
                  className="text-xs text-[#3B5BDB] hover:underline"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="text-xs text-[#C0B8AE]">← Previous</span>
              )}
              {safePage < totalPages ? (
                <Link
                  href={`/analyses?page=${safePage + 1}`}
                  className="text-xs text-[#3B5BDB] hover:underline"
                >
                  Next →
                </Link>
              ) : (
                <span className="text-xs text-[#C0B8AE]">Next →</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
