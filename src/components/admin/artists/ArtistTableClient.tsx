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
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/lib/types";

// ✅ Sama persis dengan type di page.tsx — konsisten
type ArtistRow = Pick<
  Tables<"artists">,
  "id" | "name" | "slug" | "origin" | "genre" | "is_active" | "formed_year" | "cover_image" | "created_at"
>;

interface Props {
  artists: ArtistRow[];
}

export default function ArtistTableClient({ artists }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch]             = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ArtistRow | null>(null);
  const [isPending, startTransition]    = useTransition();

  const filtered = artists.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.origin ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await fetch(`/api/artists/${deleteTarget.slug}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Artist deleted",
          description: `"${deleteTarget.name}" has been removed.`,
        });
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        toast({
          title: "Error",
          description: json.error ?? "Something went wrong",
          variant: "destructive",
        });
      }
      setDeleteTarget(null);
    });
  }

  return (
    <>
      {/* Search */}
      <div className="px-5 py-3 border-b border-zinc-800">
        <Input
          placeholder="Search by name or origin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-500 max-w-xs"
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-600 text-sm italic">
          {search ? `No artists matching "${search}"` : "No artists yet. Add the first one!"}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 text-left font-medium">Artist</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Origin</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Genre</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((artist) => (
                <tr key={artist.id} className="hover:bg-zinc-800/30 transition-colors group">

                  {/* Name */}
                  <td className="px-5 py-3">
                    <p className="font-medium text-zinc-200 group-hover:text-indigo-300 transition-colors">
                      {artist.name}
                    </p>
                    {artist.formed_year && (
                      <p className="text-xs text-zinc-600">est. {artist.formed_year}</p>
                    )}
                  </td>

                  {/* Origin */}
                  <td className="px-4 py-3 text-zinc-400 text-xs hidden md:table-cell">
                    {artist.origin ?? "—"}
                  </td>

                  {/* Genre */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(artist.genre ?? []).slice(0, 2).map((g: string) => (
                        <Badge
                          key={g}
                          variant="secondary"
                          className="text-[9px] h-4 px-1 bg-zinc-800 text-zinc-400 border-zinc-700"
                        >
                          {g}
                        </Badge>
                      ))}
                      {(artist.genre ?? []).length > 2 && (
                        <span className="text-[9px] text-zinc-600">
                          +{(artist.genre ?? []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge
                      className={`text-[10px] h-5 px-1.5 ${
                        artist.is_active
                          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/40"
                          : "bg-zinc-800 text-zinc-500 border-zinc-700"
                      }`}
                    >
                      {artist.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 px-2"
                      >
                        <Link href={`/dashboard/artists/${artist.slug}`}>Edit</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(artist)}
                        className="h-7 text-xs text-zinc-600 hover:text-red-400 hover:bg-red-950/30 px-2"
                      >
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

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-zinc-100">Delete Artist?</DialogTitle>
            <DialogDescription className="text-zinc-400">
              This will permanently delete{" "}
              <span className="text-zinc-200 font-medium">
                &quot;{deleteTarget?.name}&quot;
              </span>{" "}
              and all related data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
            >
              {isPending ? "Deleting..." : "Delete Artist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}