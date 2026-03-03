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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/lib/types";

type AnalysisFull = Tables<"lyric_analyses"> & {
  songs: (Pick<Tables<"songs">, "id" | "title" | "slug"> & {
    artists: Pick<Tables<"artists">, "name"> | null;
  }) | null;
};

type SongOption = Pick<Tables<"songs">, "id" | "title" | "slug"> & {
  artists: Pick<Tables<"artists">, "name"> | null;
};

interface AnalysisFormProps {
  mode:      "create" | "edit";
  analysis?: AnalysisFull;
  songs?:    SongOption[];   // hanya untuk create
}

export default function AnalysisForm({ mode, analysis, songs }: AnalysisFormProps) {
  const router    = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    song_id:      analysis?.song_id    ?? "",
    intro:        analysis?.intro      ?? "",
    theme:        analysis?.theme      ?? "",
    background:   analysis?.background ?? "",
    conclusion:   analysis?.conclusion ?? "",
    status:       analysis?.status     ?? "draft",
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "create" && !form.song_id) {
      toast({ title: "Error", description: "Please select a song", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const payload = {
        intro:        form.intro       || null,
        theme:        form.theme       || null,
        background:   form.background  || null,
        conclusion:   form.conclusion  || null,
        status:       form.status,
        ...(mode === "create" ? { song_id: form.song_id } : {}),
      };

      const url    = mode === "create"
        ? "/api/lyric-analyses"
        : `/api/lyric-analyses/${analysis!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (res.ok) {
        toast({
          title: mode === "create" ? "Analysis created!" : "Analysis updated!",
          description: mode === "create"
            ? "Now add lyric sections below."
            : "Changes saved.",
        });
        if (mode === "create") {
          // Redirect ke edit page agar bisa tambah sections
          router.push(`/dashboard/analyses/${json.id}/edit`);
        } else {
          router.refresh();
        }
      } else {
        toast({ title: "Error", description: json.error ?? "Something went wrong", variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            {mode === "create" ? "Select Song" : "Song"}
          </p>

          {/* Song — select (create) or read-only (edit) */}
          {mode === "create" ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Song <span className="text-red-400">*</span>
              </Label>
              <Select value={form.song_id} onValueChange={(v) => set("song_id", v)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-indigo-500 h-9 text-sm">
                  <SelectValue placeholder="Select a song to analyze..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                  {(songs ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}
                      className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-200 text-sm">
                      {s.title}
                      {s.artists?.name && (
                        <span className="text-zinc-500 ml-1.5">— {s.artists.name}</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="px-3 py-2 bg-zinc-800/60 rounded border border-zinc-700/50">
              <p className="text-sm font-medium text-zinc-200">{analysis?.songs?.title}</p>
              <p className="text-xs text-zinc-500">{analysis?.songs?.artists?.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Analysis Content</p>

          {/* Theme */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Theme</Label>
            <Input
              value={form.theme}
              onChange={(e) => set("theme", e.target.value)}
              placeholder="e.g. Letting go, nostalgia, revolution..."
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 h-9 text-sm"
            />
          </div>

          {/* Intro */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Introduction</Label>
            <Textarea
              value={form.intro}
              onChange={(e) => set("intro", e.target.value)}
              placeholder="Opening overview of the song and its significance..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          {/* Background */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Background</Label>
            <Textarea
              value={form.background}
              onChange={(e) => set("background", e.target.value)}
              placeholder="Historical or personal context behind the song..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          {/* Conclusion */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Conclusion</Label>
            <Textarea
              value={form.conclusion}
              onChange={(e) => set("conclusion", e.target.value)}
              placeholder="Final thoughts and overall meaning..."
              rows={3}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 resize-none text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Publish toggle */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Published</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {form.status === "published" ? "Visible to public" : "Draft — not visible to public"}
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

      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => router.back()}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-9">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-6 min-w-[120px]">
          {isPending
            ? (mode === "create" ? "Creating..." : "Saving...")
            : (mode === "create" ? "Create & Add Sections →" : "Save Changes")}
        </Button>
      </div>
    </form>
  );
}