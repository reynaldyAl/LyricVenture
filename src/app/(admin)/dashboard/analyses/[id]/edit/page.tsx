import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AnalysisForm from "@/components/admin/analyses/AnalysisForm";
import SectionsEditor from "@/components/admin/analyses/SectionsEditor";
import type { Tables } from "@/lib/types";

type Highlight    = Tables<"lyric_highlights">;
type Section      = Tables<"lyric_sections"> & { lyric_highlights: Highlight[] };
type AnalysisFull = Tables<"lyric_analyses"> & {
  songs: (Pick<Tables<"songs">, "id" | "title" | "slug" | "cover_image"> & {
    artists: Pick<Tables<"artists">, "name"> | null;
  }) | null;
  lyric_sections: Section[];
};

async function getAnalysis(id: string): Promise<AnalysisFull | null> {
  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from("lyric_analyses")
    .select(`
      *,
      songs ( id, title, slug, cover_image, artists ( name ) ),
      lyric_sections (
        *,
        lyric_highlights ( * )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const raw = data as AnalysisFull;

  const sorted: AnalysisFull = {
    ...raw,
    lyric_sections: [...(raw.lyric_sections ?? [])].sort(
      (a, b) => a.order_index - b.order_index
    ).map((s) => ({
      ...s,
      lyric_highlights: [...(s.lyric_highlights ?? [])].sort(
        (a, b) => a.order_index - b.order_index
      ),
    })),
  };

  return sorted;
}

export default async function EditAnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = await getAnalysis(id);
  if (!analysis) notFound();

  const song = analysis.songs;

  // ✅ Fix: helper untuk status badge
  const statusStyle =
    analysis.status === "published" ? "border-emerald-800 bg-emerald-900/30 text-emerald-400"
    : analysis.status === "pending" ? "border-amber-800 bg-amber-900/30 text-amber-400"
    : analysis.status === "rejected" ? "border-red-800 bg-red-900/30 text-red-400"
    : "border-zinc-700 bg-zinc-800 text-zinc-500";

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild
          className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 h-8 px-2 text-xs">
          <Link href="/dashboard/analyses">← Back</Link>
        </Button>
        <Separator orientation="vertical" className="h-4 bg-zinc-700" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-zinc-100 font-serif">Edit Analysis</h1>
          <p className="text-xs text-zinc-500 truncate">
            {song?.title}
            {song?.artists?.name && ` — ${song.artists.name}`}
          </p>
        </div>

        {/* ✅ Fix: pakai status bukan is_published */}
        <span className={`text-[10px] px-2 py-0.5 border capitalize ${statusStyle}`}>
          {analysis.status ?? "draft"}
        </span>
      </div>

      {/* ── Part 1: Analysis metadata ── */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 space-y-3">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Overview
        </p>
        <Separator className="bg-zinc-800" />
        <AnalysisForm mode="edit" analysis={analysis as any} />
      </div>

      {/* ── Part 2: Sections & Highlights ── */}
      <div className="bg-zinc-900 border border-zinc-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Lyric Sections
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              Add sections (verse, chorus…) then highlight phrases with meanings
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {analysis.lyric_sections.length} section{analysis.lyric_sections.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Separator className="bg-zinc-800" />
        <SectionsEditor
          analysisId={analysis.id}
          initialSections={analysis.lyric_sections}
        />
      </div>
    </div>
  );
}