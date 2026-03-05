"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; // ✅ tambah
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/admin/ImageUpload";
import type { Tables } from "@/lib/types";

type AlbumFull    = Tables<"albums">;
type ArtistOption = Pick<Tables<"artists">, "id" | "name" | "slug">;

interface AlbumFormProps {
  mode:    "create" | "edit";
  album?:  AlbumFull;
  artists: ArtistOption[];
  role?:   "admin" | "author"; // ✅ tambah
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

const ALBUM_TYPES = ["album", "ep", "single", "compilation", "live"] as const;

export default function AlbumForm({ mode, album, artists, role = "author" }: AlbumFormProps) {
  const router    = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    artist_id:    album?.artist_id    ?? "",
    title:        album?.title        ?? "",
    slug:         album?.slug         ?? "",
    description:  album?.description  ?? "",
    release_date: album?.release_date ?? "",
    album_type:   album?.album_type   ?? "album",
    total_tracks: album?.total_tracks?.toString() ?? "",
    cover_image:  album?.cover_image  ?? "",
    status:       album?.status       ?? "draft", // ✅ tambah
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      ...(mode === "create" ? { slug: slugify(value) } : {}),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.artist_id) {
      toast({ title: "Error", description: "Please select an artist", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const payload = {
        artist_id:    form.artist_id,
        title:        form.title.trim(),
        slug:         form.slug.trim(),
        description:  form.description || null,
        release_date: form.release_date || null,
        album_type:   form.album_type,
        total_tracks: form.total_tracks ? Number(form.total_tracks) : null,
        cover_image:  form.cover_image || null,
        status:       form.status, // ✅ tambah
      };

      const url    = mode === "create" ? "/api/albums" : `/api/albums/${album!.slug}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok) {
        toast({
          title:       mode === "create" ? "Album created!" : "Album updated!",
          description: payload.title,
        });
        router.push("/dashboard/albums");
        router.refresh();
      } else {
        toast({ title: "Error", description: json.error ?? "Something went wrong", variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Basic Info ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Basic Info</p>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">
              Artist <span className="text-red-400">*</span>
            </Label>
            <Select value={form.artist_id} onValueChange={(v) => set("artist_id", v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 h-9 text-sm">
                <SelectValue placeholder="Select an artist..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                {artists.map((a) => (
                  <SelectItem key={a.id} value={a.id}
                    className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-200 text-sm">
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Title <span className="text-red-400">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Abbey Road"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Slug <span className="text-red-400">*</span></Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="e.g. abbey-road"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Short description of the album..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Type</Label>
              <Select value={form.album_type} onValueChange={(v) => set("album_type", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 h-9 text-sm capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {ALBUM_TYPES.map((t) => (
                    <SelectItem key={t} value={t}
                      className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-200 text-sm capitalize">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Release Date</Label>
              <Input
                type="date"
                value={form.release_date}
                onChange={(e) => set("release_date", e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Total Tracks</Label>
              <Input
                type="number"
                value={form.total_tracks}
                onChange={(e) => set("total_tracks", e.target.value)}
                placeholder="e.g. 17"
                min={1} max={999}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cover Image ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Cover Image</p>
          <ImageUpload
            value={form.cover_image}
            onChange={(url) => set("cover_image", url)}
            bucket="albums"
            label="Cover Image"
            aspectRatio="square"
          />
        </CardContent>
      </Card>

      {/* ✅ Publish toggle — hanya untuk admin */}
      {role === "admin" && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Published</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {form.status === "published"
                    ? "Visible to public"
                    : "Draft — not visible to public"}
                </p>
              </div>
              <Switch
                checked={form.status === "published"}
                onCheckedChange={(v) => set("status", v ? "published" : "draft")}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="bg-zinc-800" />

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 min-w-[110px]">
          {isPending
            ? (mode === "create" ? "Creating..." : "Saving...")
            : (mode === "create" ? "Create Album" : "Save Changes")}
        </Button>
      </div>
    </form>
  );
}