"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ModerationButtons from "@/components/admin/ModerationButtons";
import SubmitForReviewButton from "@/components/admin/SubmitForReviewButton";  
import type { Tables } from "@/lib/types";

type SongRow = Pick<
  Tables<"songs">,
  | "id" | "title" | "slug" | "cover_image" | "language"
  | "duration_sec" | "view_count"
  | "created_at" | "status"
> & {
  artists:   Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
  albums:    Pick<Tables<"albums">,  "id" | "title" | "slug"> | null;
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "color"> | null }[];
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-900/40 text-emerald-400 border-emerald-800/60",
  pending:   "bg-amber-900/40 text-amber-400 border-amber-800/60",
  rejected:  "bg-red-900/40 text-red-400 border-red-800/60",
  draft:     "bg-zinc-800 text-zinc-500 border-zinc-700",
};

function formatDuration(sec: number | null) {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function SongTableClient({
  songs,
  role,
}: {
  songs: SongRow[];
  role: "admin" | "author";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "pending" | "draft" | "rejected">("all");
  const [deleteTarget, setDeleteTarget] = useState<SongRow | null>(null);
  const [isPending, startTransition]    = useTransition();

  const filtered = songs.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      (s.artists?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await fetch(`/api/songs/${deleteTarget.slug}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Song deleted", description: `"${deleteTarget.title}" removed.` });
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
      {/* Filters */}
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
          {search || filterStatus !== "all" ? "No songs match your filter." : "No songs yet. Add the first one!"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 text-left font-medium">Song</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Artist</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Album</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Tags</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">Duration</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((song) => (
                <tr key={song.id} className="hover:bg-zinc-800/30 transition-colors group">

                  {/* Title + cover */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 shrink-0 overflow-hidden rounded">
                        {song.cover_image
                          ? <img src={song.cover_image} alt={song.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">♫</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors truncate max-w-[160px]">
                          {song.title}
                        </p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
                          {song.language ?? "en"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-zinc-400 text-xs">{song.artists?.name ?? "—"}</span>
                  </td>

                  {/* Album */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-zinc-500 text-xs">{song.albums?.title ?? "—"}</span>
                  </td>

                  {/* Tags */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {song.song_tags.slice(0, 2).map((st) =>
                        st.tags ? (
                          <Badge key={st.tags.id} className="text-[9px] h-4 px-1 border"
                            style={{
                              background:  st.tags.color ? `${st.tags.color}20` : undefined,
                              borderColor: st.tags.color ? `${st.tags.color}50` : undefined,
                              color:       st.tags.color ?? "#71717a",
                            }}>
                            {st.tags.name}
                          </Badge>
                        ) : null
                      )}
                      {song.song_tags.length > 2 && (
                        <span className="text-[9px] text-zinc-600">+{song.song_tags.length - 2}</span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge className={`text-[10px] h-5 px-1.5 border capitalize ${
                      STATUS_COLORS[song.status ?? "draft"] ?? STATUS_COLORS.draft
                    }`}>
                      {song.status ?? "draft"}
                    </Badge>
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-zinc-500 text-xs font-mono">
                      {formatDuration(song.duration_sec)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {role === "admin" && (
                        <ModerationButtons
                          table="songs"
                          id={song.id}
                          status={song.status}
                          revalidate="/dashboard/songs"
                        />
                      )}
                      {/* ✅ Author: submit for review */}
                      {role === "author" && (
                        <SubmitForReviewButton
                          table="songs"
                          id={song.id}
                          status={song.status}
                          revalidate="/dashboard/songs"
                        />
                      )}
                      <Button variant="ghost" size="sm" asChild
                        className="h-7 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 px-2">
                        <Link href={`/dashboard/songs/${song.slug}`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={() => setDeleteTarget(song)}
                        className="h-7 text-xs text-zinc-600 hover:text-red-400 hover:bg-red-950/30 px-2">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-zinc-100">Delete Song?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Permanently delete{" "}
              <span className="text-zinc-200 font-medium">&quot;{deleteTarget?.title}&quot;</span>.
              Its lyric analysis will also be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button size="sm" onClick={handleDelete} disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]">
              {isPending ? "Deleting..." : "Delete Song"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}