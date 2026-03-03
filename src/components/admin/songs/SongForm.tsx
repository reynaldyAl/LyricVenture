"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/admin/ImageUpload"; // ✅ tambah import
import type { Tables } from "@/lib/types";

// ── Types ──────────────────────────────────────────────────
type SongFull     = Tables<"songs"> & { current_tag_ids: string[] };
type ArtistOption = Pick<Tables<"artists">, "id" | "name" | "slug">;
type AlbumOption  = Pick<Tables<"albums">,  "id" | "title" | "slug" | "artist_id">;
type TagOption    = Pick<Tables<"tags">,    "id" | "name" | "color">;

interface SongFormProps {
  mode:    "create" | "edit";
  song?:   SongFull;
  artists: ArtistOption[];
  albums:  AlbumOption[];
  tags:    TagOption[];
}

const NO_ALBUM = "__none__";

const LANGUAGES = [
  { value: "en",    label: "English" },
  { value: "id",    label: "Indonesian" },
  { value: "ja",    label: "Japanese" },
  { value: "ko",    label: "Korean" },
  { value: "es",    label: "Spanish" },
  { value: "fr",    label: "French" },
  { value: "pt",    label: "Portuguese" },
  { value: "other", label: "Other" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SongForm({ mode, song, artists, albums, tags }: SongFormProps) {
  const router    = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    artist_id:        song?.artist_id          ?? "",
    album_id:         song?.album_id           ?? NO_ALBUM,
    title:            song?.title              ?? "",
    slug:             song?.slug               ?? "",
    spotify_track_id: song?.spotify_track_id   ?? "",
    youtube_url:      song?.youtube_url        ?? "",
    release_date:     song?.release_date       ?? "",
    duration_sec:     song?.duration_sec?.toString() ?? "",
    cover_image:      song?.cover_image        ?? "",
    language:         song?.language           ?? "en",
    status:           song?.status       ?? "draft",
  });

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    song?.current_tag_ids ?? []
  );

  const filteredAlbums = form.artist_id
    ? albums.filter((a) => a.artist_id === form.artist_id)
    : albums;

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

  function handleArtistChange(artistId: string) {
    setForm((f) => ({ ...f, artist_id: artistId, album_id: NO_ALBUM }));
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.artist_id) {
      toast({ title: "Error", description: "Please select an artist", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const resolvedAlbumId = form.album_id === NO_ALBUM ? null : form.album_id;

      const payload: Record<string, unknown> = {
        title:            form.title.trim(),
        slug:             form.slug.trim(),
        album_id:         resolvedAlbumId,
        spotify_track_id: form.spotify_track_id || null,
        youtube_url:      form.youtube_url      || null,
        release_date:     form.release_date     || null,
        duration_sec:     form.duration_sec ? Number(form.duration_sec) : null,
        cover_image:      form.cover_image      || null,
        language:         form.language         || "en",
        status:           form.status,
        tag_ids:          selectedTagIds,
      };

      if (mode === "create") {
        payload.artist_id = form.artist_id;
      }

      const url    = mode === "create" ? "/api/songs" : `/api/songs/${song!.slug}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok) {
        toast({
          title:       mode === "create" ? "Song created!" : "Song updated!",
          description: form.title,
        });
        router.push("/dashboard/songs");
        router.refresh();
      } else {
        toast({
          title:       "Error",
          description: json.error ?? "Something went wrong",
          variant:     "destructive",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Basic Info — tidak berubah ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Basic Info</p>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">
              Artist <span className="text-red-400">*</span>
              {mode === "edit" && (
                <span className="ml-2 text-zinc-600 font-normal">(cannot be changed)</span>
              )}
            </Label>
            <Select value={form.artist_id} onValueChange={handleArtistChange} disabled={mode === "edit"}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 h-9 text-sm disabled:opacity-60">
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
                placeholder="e.g. Let It Be"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Slug <span className="text-red-400">*</span></Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="e.g. let-it-be"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Album</Label>
              <Select value={form.album_id} onValueChange={(v) => set("album_id", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 h-9 text-sm">
                  <SelectValue placeholder="No album (single)" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  <SelectItem value={NO_ALBUM}
                    className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-400 text-sm italic">
                    No album (single)
                  </SelectItem>
                  {filteredAlbums.map((a) => (
                    <SelectItem key={a.id} value={a.id}
                      className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-200 text-sm">
                      {a.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.artist_id && filteredAlbums.length === 0 && (
                <p className="text-[10px] text-zinc-600 italic">No albums for this artist yet.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Language</Label>
              <Select value={form.language} onValueChange={(v) => set("language", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}
                      className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-200 text-sm">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label className="text-xs text-zinc-400">
                Duration <span className="text-zinc-600 font-normal">(seconds)</span>
              </Label>
              <Input
                type="number"
                value={form.duration_sec}
                onChange={(e) => set("duration_sec", e.target.value)}
                placeholder="e.g. 243"
                min={1}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
              />
              {form.duration_sec && Number(form.duration_sec) > 0 && (
                <p className="text-[10px] text-zinc-600">
                  = {Math.floor(Number(form.duration_sec) / 60)}:{String(Number(form.duration_sec) % 60).padStart(2, "0")} min
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Media Links — tidak berubah ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Media Links</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Spotify Track ID</Label>
              <Input
                value={form.spotify_track_id}
                onChange={(e) => set("spotify_track_id", e.target.value)}
                placeholder="e.g. 4iV5W9uYEdYUVa79Axb7Rh"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">YouTube URL</Label>
              <Input
                value={form.youtube_url}
                onChange={(e) => set("youtube_url", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Cover Image — DIGANTI dengan ImageUpload ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Cover Image</p>
          <ImageUpload
            value={form.cover_image}
            onChange={(url) => set("cover_image", url)}
            bucket="songs"
            label="Cover Image"
            aspectRatio="square"
          />
        </CardContent>
      </Card>

      {/* ── Tags — tidak berubah ── */}
      {tags.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Tags</p>
              {selectedTagIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTagIds([])}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                    }`}
                    style={
                      isSelected && tag.color
                        ? { borderColor: tag.color, background: `${tag.color}25`, color: tag.color }
                        : {}
                    }
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {selectedTagIds.length > 0 && (
              <p className="text-[10px] text-zinc-600">
                {selectedTagIds.length} tag{selectedTagIds.length > 1 ? "s" : ""} selected
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Publish toggle — tidak berubah ── */}
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

      <Separator className="bg-zinc-800" />

      {/* ── Actions — tidak berubah ── */}
      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 min-w-[110px]">
          {isPending
            ? (mode === "create" ? "Creating..." : "Saving...")
            : (mode === "create" ? "Create Song" : "Save Changes")}
        </Button>
      </div>
    </form>
  );
}