import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AnalysisTableClient from "@/components/admin/analyses/AnalysisTableClient";
import type { Tables } from "@/lib/types";

type Role = "admin" | "author";

type AnalysisRow = Pick<
  Tables<"lyric_analyses">,
  "id" | "theme" | "is_published" | "created_at" | "status"  // ← tambah status
> & {
  songs: (Pick<Tables<"songs">, "id" | "title" | "slug" | "cover_image"> & {
    artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
  }) | null;
};

async function getAnalyses(role: Role, userId: string): Promise<AnalysisRow[]> {
  const supabase = await createClient();

  const query = supabase
    .from("lyric_analyses")
    .select(`
      id, theme, is_published, created_at, status,
      songs (
        id, title, slug, cover_image,
        artists ( id, name, slug )
      )
    `)
    .order("created_at", { ascending: false });

  const { data, error } = role === "admin"
    ? await query
    : await query.eq("author_id", userId);  // lyric_analyses pakai author_id

  if (error) { console.error("getAnalyses:", error.message); return []; }
  return (data ?? []) as AnalysisRow[];
}

export default async function AnalysesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = ((profileData as { role: Role } | null)?.role ?? "author") as Role;

  const analyses       = await getAnalyses(role, user.id);
  const publishedCount = analyses.filter((a) => a.status === "published").length;
  const pendingCount   = analyses.filter((a) => a.status === "pending").length;
  const draftCount     = analyses.filter((a) => a.status === "draft").length;
  const rejectedCount  = analyses.filter((a) => a.status === "rejected").length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-serif">
            {role === "admin" ? "Lyric Analyses" : "My Analyses"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {analyses.length} total · {publishedCount} published · {pendingCount} pending · {draftCount} draft
          </p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
          <Link href="/dashboard/analyses/new">+ New Analysis</Link>
        </Button>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Published", value: publishedCount, color: "text-emerald-400" },
          { label: "Pending",   value: pendingCount,   color: "text-amber-400" },
          { label: "Draft",     value: draftCount,     color: "text-zinc-400" },
          { label: "Rejected",  value: rejectedCount,  color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-4 py-3">
            <p className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Separator className="bg-zinc-800" />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">
            {role === "admin" ? "All Analyses" : "My Analyses"}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Click an analysis to edit its content, sections, and highlights
          </CardDescription>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="p-0">
          <AnalysisTableClient analyses={analyses} />
        </CardContent>
      </Card>
    </div>
  );
}