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

type AlbumRow = Pick<
  Tables<"albums">,
  | "id" | "title" | "slug" | "cover_image"
  | "release_date" | "album_type" | "total_tracks"
  | "created_at" | "status"
> & {
  artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
};

const TYPE_COLORS: Record<string, string> = {
  album:       "bg-indigo-900/40 text-indigo-400 border-indigo-800/60",
  ep:          "bg-sky-900/40 text-sky-400 border-sky-800/60",
  single:      "bg-violet-900/40 text-violet-400 border-violet-800/60",
  compilation: "bg-amber-900/40 text-amber-400 border-amber-800/60",
  live:        "bg-rose-900/40 text-rose-400 border-rose-800/60",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-900/40 text-emerald-400 border-emerald-800/60",
  pending:   "bg-amber-900/40 text-amber-400 border-amber-800/60",
  rejected:  "bg-red-900/40 text-red-400 border-red-800/60",
  draft:     "bg-zinc-800 text-zinc-500 border-zinc-700",
};

export default function AlbumTableClient({
  albums,
  role,
}: {
  albums: AlbumRow[];
  role: "admin" | "author";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "pending" | "draft" | "rejected">("all");
  const [deleteTarget, setDeleteTarget] = useState<AlbumRow | null>(null);
  const [isPending, startTransition]    = useTransition();

  const filtered = albums.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.artists?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await fetch(`/api/albums/${deleteTarget.slug}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Album deleted", description: `"${deleteTarget.title}" has been removed.` });
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Error", description: json.error ?? "Something went wrong", variant: "destructive" });
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      {/* Search + Filter */}
      <div className="px-5 py-3 border-b border-zinc-800 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by title or artist..."
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
          {search || filterStatus !== "all" ? "No albums match your filter." : "No albums yet. Add the first one!"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 text-left font-medium">Album</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Artist</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Tracks</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Year</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((album) => {
                const year = album.release_date
                  ? new Date(album.release_date).getFullYear()
                  : null;
                return (
                  <tr key={album.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 shrink-0 overflow-hidden rounded">
                          {album.cover_image
                            ? <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">◎</div>}
                        </div>
                        <p className="font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors truncate max-w-[180px]">
                          {album.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-zinc-400 text-xs">{album.artists?.name ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge className={`text-[10px] h-5 px-1.5 border capitalize ${
                        TYPE_COLORS[album.album_type] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        {album.album_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                      {album.total_tracks ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                      {year ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge className={`text-[10px] h-5 px-1.5 border capitalize ${
                        STATUS_COLORS[album.status ?? "draft"] ?? STATUS_COLORS.draft
                      }`}>
                        {album.status ?? "draft"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {role === "admin" && (
                          <ModerationButtons
                            table="albums"
                            id={album.id}
                            status={album.status}
                            revalidate="/dashboard/albums"
                          />
                        )}
                        {role === "author" && (
                          <SubmitForReviewButton
                            table="albums"
                            id={album.id}
                            status={album.status}
                            revalidate="/dashboard/albums"
                          />
                        )}
                        <Button variant="ghost" size="sm" asChild
                          className="h-7 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 px-2">
                          <Link href={`/dashboard/albums/${album.slug}`}>Edit</Link>
                        </Button>
                        <Button variant="ghost" size="sm"
                          onClick={() => setDeleteTarget(album)}
                          className="h-7 text-xs text-zinc-600 hover:text-red-400 hover:bg-red-950/30 px-2">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-zinc-100">Delete Album?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This will permanently delete{" "}
              <span className="text-zinc-200 font-medium">&quot;{deleteTarget?.title}&quot;</span>.
              Songs in this album will NOT be deleted, but they will be unlinked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]">
              {isPending ? "Deleting..." : "Delete Album"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}