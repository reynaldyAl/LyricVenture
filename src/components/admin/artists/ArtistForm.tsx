"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/admin/ImageUpload";

type Artist = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  origin: string | null;
  formed_year: number | null;
  disbanded_year: number | null;
  genre: string[] | null;
  cover_image: string | null;
  banner_image: string | null;
  is_active: boolean;
  status?: string; // ✅ tambah
};

interface ArtistFormProps {
  mode:    "create" | "edit";
  artist?: Artist;
  role?:   "admin" | "author"; // ✅ tambah
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function ArtistForm({ mode, artist, role = "author" }: ArtistFormProps) {
  const router    = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    name:           artist?.name           ?? "",
    slug:           artist?.slug           ?? "",
    bio:            artist?.bio            ?? "",
    origin:         artist?.origin         ?? "",
    formed_year:    artist?.formed_year    ?? "",
    disbanded_year: artist?.disbanded_year ?? "",
    genre:          artist?.genre?.join(", ") ?? "",
    cover_image:    artist?.cover_image    ?? "",
    banner_image:   artist?.banner_image   ?? "",
    is_active:      artist?.is_active      ?? true,
    status:         artist?.status         ?? "draft", // ✅ tambah
  });

  function handleNameChange(value: string) {
    setForm((f) => ({
      ...f,
      name: value,
      ...(mode === "create" ? { slug: slugify(value) } : {}),
    }));
  }

  function handleChange(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        name:           form.name.trim(),
        slug:           form.slug.trim(),
        bio:            form.bio || null,
        origin:         form.origin || null,
        formed_year:    form.formed_year    ? Number(form.formed_year)    : null,
        disbanded_year: form.disbanded_year ? Number(form.disbanded_year) : null,
        genre:          form.genre ? form.genre.split(",").map((g) => g.trim()).filter(Boolean) : [],
        cover_image:    form.cover_image  || null,
        banner_image:   form.banner_image || null,
        is_active:      form.is_active,
        status:         form.status, // ✅ tambah
      };

      const url    = mode === "create" ? "/api/artists" : `/api/artists/${artist!.slug}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok) {
        toast({ title: mode === "create" ? "Artist created!" : "Artist updated!", description: payload.name });
        router.push("/dashboard/artists");
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Name <span className="text-red-400">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. The Beatles"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Slug <span className="text-red-400">*</span></Label>
              <Input
                value={form.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="e.g. the-beatles"
                required
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Bio</Label>
            <Textarea
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Short biography of the artist..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Origin</Label>
              <Input
                value={form.origin}
                onChange={(e) => handleChange("origin", e.target.value)}
                placeholder="e.g. Liverpool, UK"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Formed Year</Label>
              <Input
                type="number"
                value={form.formed_year}
                onChange={(e) => handleChange("formed_year", e.target.value)}
                placeholder="e.g. 1960"
                min={1900} max={2100}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Disbanded Year</Label>
              <Input
                type="number"
                value={form.disbanded_year}
                onChange={(e) => handleChange("disbanded_year", e.target.value)}
                placeholder="Leave blank if active"
                min={1900} max={2100}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">
              Genre <span className="text-zinc-600 font-normal">(comma separated)</span>
            </Label>
            <Input
              value={form.genre}
              onChange={(e) => handleChange("genre", e.target.value)}
              placeholder="e.g. Rock, Pop, Psychedelic"
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Images ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-6">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Images</p>
          <ImageUpload
            value={form.cover_image}
            onChange={(url) => handleChange("cover_image", url)}
            bucket="artists"
            label="Cover Image"
            aspectRatio="square"
          />
          <ImageUpload
            value={form.banner_image}
            onChange={(url) => handleChange("banner_image", url)}
            bucket="artists"
            label="Banner Image"
            aspectRatio="wide"
          />
        </CardContent>
      </Card>

      {/* ── Active toggle ── */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Active</p>
              <p className="text-xs text-zinc-500">Artist will appear on public pages</p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => handleChange("is_active", v)}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
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
                onCheckedChange={(v) => handleChange("status", v ? "published" : "draft")}
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
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 min-w-[100px]">
          {isPending
            ? (mode === "create" ? "Creating..." : "Saving...")
            : (mode === "create" ? "Create Artist" : "Save Changes")}
        </Button>
      </div>
    </form>
  );
}