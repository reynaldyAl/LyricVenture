"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ModerationButtons from "@/components/admin/ModerationButtons";
import SubmitForReviewButton from "@/components/admin/SubmitForReviewButton";
import type { Tables } from "@/lib/types";

type AnalysisRow = Pick<
  Tables<"lyric_analyses">,
  "id" | "theme" | "created_at" | "status" | "author_id"
> & {
  songs: (Pick<Tables<"songs">, "id" | "title" | "slug" | "cover_image"> & {
    artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
  }) | null;
  profiles: Pick<Tables<"profiles">, "id" | "username" | "full_name" | "avatar_url"> | null;
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-900/40 text-emerald-400 border-emerald-800/60",
  pending:   "bg-amber-900/40 text-amber-400 border-amber-800/60",
  rejected:  "bg-red-900/40 text-red-400 border-red-800/60",
  draft:     "bg-zinc-800 text-zinc-500 border-zinc-700",
};

export default function AnalysisTableClient({
  analyses,
  role,
  userId,
}: {
  analyses: AnalysisRow[];
  role: "admin" | "author";
  userId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "pending" | "draft" | "rejected">("all");
  const [deleteTarget, setDeleteTarget] = useState<AnalysisRow | null>(null);
  const [isPending, startTransition]    = useTransition();

  const filtered = analyses.filter((a) => {
    const authorName = (
      a.profiles?.full_name ??
      a.profiles?.username ??
      ""
    ).toLowerCase();
    const matchSearch =
      (a.songs?.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.songs?.artists?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.theme ?? "").toLowerCase().includes(search.toLowerCase()) ||
      authorName.includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const grouped = filtered.reduce((acc, analysis) => {
    const key = analysis.songs?.id ?? analysis.id;
    if (!acc[key]) {
      acc[key] = { song: analysis.songs, analyses: [] as AnalysisRow[] };
    }
    acc[key].analyses.push(analysis);
    return acc;
  }, {} as Record<string, { song: AnalysisRow["songs"]; analyses: AnalysisRow[] }>);

  const groups = Object.values(grouped).sort((a, b) => {
    const aTime = Math.max(...a.analyses.map((x) => new Date(x.created_at).getTime()));
    const bTime = Math.max(...b.analyses.map((x) => new Date(x.created_at).getTime()));
    return bTime - aTime;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await fetch(`/api/lyric-analyses/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Analysis deleted", description: `Analysis for "${deleteTarget.songs?.title}" removed.` });
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Error", description: json.error ?? "Failed to delete", variant: "destructive" });
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      {/* Search + Filter */}
      <div className="px-5 py-3 border-b border-zinc-800 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by song, artist, or theme..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 max-w-xs"
        />
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-300 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
            <SelectItem value="all"       className="text-sm hover:bg-zinc-800 focus:bg-zinc-800">All</SelectItem>
            <SelectItem value="published" className="text-sm hover:bg-zinc-800 focus:bg-zinc-800">Published</SelectItem>
            <SelectItem value="pending"   className="text-sm hover:bg-zinc-800 focus:bg-zinc-800">Pending</SelectItem>
            <SelectItem value="draft"     className="text-sm hover:bg-zinc-800 focus:bg-zinc-800">Draft</SelectItem>
            <SelectItem value="rejected"  className="text-sm hover:bg-zinc-800 focus:bg-zinc-800">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-zinc-600 self-center ml-auto">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-600 text-sm italic">
          {search || filterStatus !== "all" ? "No analyses match your filter." : "No analyses yet. Add the first one!"}
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.song?.id ?? group.analyses[0].id} className="border border-zinc-800/60 rounded-lg overflow-hidden bg-zinc-900/40">
              <div className="px-5 py-4 flex items-center gap-4 border-b border-zinc-800/60">
                <div className="w-10 h-10 bg-zinc-800 shrink-0 overflow-hidden rounded">
                  {group.song?.cover_image
                    ? <img src={group.song.cover_image} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">✦</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-200 truncate">
                    {group.song?.title ?? "Unknown song"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {group.song?.artists?.name ?? "—"}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                  {group.analyses.length} analysis{group.analyses.length !== 1 ? "es" : ""}
                </span>
              </div>

              <div className="divide-y divide-zinc-800/60">
                {group.analyses.map((analysis) => {
                  const authorName = analysis.profiles?.full_name ?? analysis.profiles?.username ?? "Unknown";
                  const isYou = analysis.author_id === userId;
                  return (
                    <div key={analysis.id} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                          {authorName}{isYou ? " · You" : ""}
                        </p>
                        <p className="text-sm text-zinc-200 truncate">
                          {analysis.theme ?? "No theme"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <Badge className={`text-[10px] h-5 px-1.5 border capitalize ${
                          STATUS_COLORS[analysis.status ?? "draft"] ?? STATUS_COLORS.draft
                        }`}>
                          {analysis.status ?? "draft"}
                        </Badge>
                        {role === "admin" && (
                          <ModerationButtons
                            table="lyric_analyses"
                            id={analysis.id}
                            status={analysis.status}
                            revalidate="/dashboard/analyses"
                          />
                        )}
                        {role === "author" && (
                          <SubmitForReviewButton
                            table="lyric_analyses"
                            id={analysis.id}
                            status={analysis.status}
                            revalidate="/dashboard/analyses"
                          />
                        )}
                        <Button variant="ghost" size="sm" asChild
                          className="h-7 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 px-2">
                          <Link href={`/dashboard/analyses/${analysis.id}`}>Edit</Link>
                        </Button>
                        <Button variant="ghost" size="sm"
                          onClick={() => setDeleteTarget(analysis)}
                          className="h-7 text-xs text-zinc-600 hover:text-red-400 hover:bg-red-950/30 px-2">
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-zinc-100">Delete Analysis?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Permanently delete the analysis for{" "}
              <span className="text-zinc-200 font-medium">&quot;{deleteTarget?.songs?.title}&quot;</span>.
              All sections and highlights will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]">
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}