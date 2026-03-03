"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/lib/types";

type Highlight = Tables<"lyric_highlights">;
type Section   = Tables<"lyric_sections"> & { lyric_highlights: Highlight[] };

interface SectionsEditorProps {
  analysisId:      string;
  initialSections: Section[];
}

const SECTION_TYPES = [
  { value: "verse",   label: "Verse" },
  { value: "chorus",  label: "Chorus" },
  { value: "bridge",  label: "Bridge" },
  { value: "intro",   label: "Intro" },
  { value: "outro",   label: "Outro" },
  { value: "pre-chorus", label: "Pre-Chorus" },
  { value: "hook",    label: "Hook" },
  { value: "other",   label: "Other" },
];

const HIGHLIGHT_TYPES = [
  { value: "metaphor",  label: "Metaphor" },
  { value: "symbolism", label: "Symbolism" },
  { value: "reference", label: "Reference" },
  { value: "emotion",   label: "Emotion" },
  { value: "theme",     label: "Theme" },
  { value: "other",     label: "Other" },
];

const HIGHLIGHT_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#10b981", label: "Emerald" },
  { value: "#ef4444", label: "Red" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#06b6d4", label: "Cyan" },
];

// ── Empty form states ──────────────────────────────────────
const emptySectionForm = {
  section_type:  "verse",
  section_label: "",
  content:       "",
  order_index:   0,
};

const emptyHighlightForm = {
  phrase:         "",
  meaning:        "",
  start_index:    "",
  end_index:      "",
  color_tag:      "#6366f1",
  highlight_type: "metaphor",
  order_index:    0,
};

export default function SectionsEditor({ analysisId, initialSections }: SectionsEditorProps) {
  const { toast } = useToast();
  const [sections, setSections]               = useState<Section[]>(initialSections);
  const [isPending, startTransition]          = useTransition();

  // Section form
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionForm, setSectionForm]         = useState(emptySectionForm);
  const [editingSection, setEditingSection]   = useState<Section | null>(null);

  // Highlight form
  const [highlightTarget, setHighlightTarget] = useState<Section | null>(null);
  const [highlightForm, setHighlightForm]     = useState(emptyHighlightForm);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);

  // Delete confirms
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<Section | null>(null);
  const [deleteHighlightTarget, setDeleteHighlightTarget] = useState<{ sectionId: string; highlight: Highlight } | null>(null);

  // ── Section CRUD ───────────────────────────────────────
  function openNewSection() {
    setEditingSection(null);
    setSectionForm({ ...emptySectionForm, order_index: sections.length });
    setShowSectionForm(true);
  }

  function openEditSection(section: Section) {
    setEditingSection(section);
    setSectionForm({
      section_type:  section.section_type,
      section_label: section.section_label,
      content:       section.content,
      order_index:   section.order_index,
    });
    setShowSectionForm(true);
  }

  async function handleSaveSection() {
    if (!sectionForm.section_label.trim() || !sectionForm.content.trim()) {
      toast({ title: "Error", description: "Label and content are required", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const payload = {
        section_type:  sectionForm.section_type,
        section_label: sectionForm.section_label.trim(),
        content:       sectionForm.content.trim(),
        order_index:   sectionForm.order_index,
      };

      let res: Response;
      if (editingSection) {
        // PUT /api/lyric-analyses/[id]/sections/[sectionId]
        res = await fetch(
          `/api/lyric-analyses/${analysisId}/sections/${editingSection.id}`,
          { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
      } else {
        // POST /api/lyric-analyses/[id]/sections
        res = await fetch(
          `/api/lyric-analyses/${analysisId}/sections`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
      }

      const json = await res.json();
      if (res.ok) {
        toast({ title: editingSection ? "Section updated" : "Section added" });
        if (editingSection) {
          setSections((prev) => prev.map((s) =>
            s.id === editingSection.id ? { ...s, ...json } : s
          ));
        } else {
          setSections((prev) => [...prev, { ...json, lyric_highlights: [] }]);
        }
        setShowSectionForm(false);
        setEditingSection(null);
        setSectionForm(emptySectionForm);
      } else {
        toast({ title: "Error", description: json.error ?? "Failed", variant: "destructive" });
      }
    });
  }

  async function handleDeleteSection() {
    if (!deleteSectionTarget) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/lyric-analyses/${analysisId}/sections/${deleteSectionTarget.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setSections((prev) => prev.filter((s) => s.id !== deleteSectionTarget.id));
        toast({ title: "Section deleted" });
      } else {
        const json = await res.json().catch(() => ({}));
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
      setDeleteSectionTarget(null);
    });
  }

  // ── Highlight CRUD ─────────────────────────────────────
  function openNewHighlight(section: Section) {
    setEditingHighlight(null);
    setHighlightForm({ ...emptyHighlightForm, order_index: section.lyric_highlights.length });
    setHighlightTarget(section);
  }

  function openEditHighlight(section: Section, highlight: Highlight) {
    setEditingHighlight(highlight);
    setHighlightForm({
      phrase:         highlight.phrase,
      meaning:        highlight.meaning,
      start_index:    (highlight.start_index ?? 0).toString(),
      end_index:      (highlight.end_index ?? 0).toString(),
      color_tag:      highlight.color_tag ?? "#6366f1",
      highlight_type: highlight.highlight_type ?? "metaphor",
      order_index:    highlight.order_index,
    });
    setHighlightTarget(section);
  }

  async function handleSaveHighlight() {
    if (!highlightTarget) return;
    if (!highlightForm.phrase.trim() || !highlightForm.meaning.trim()) {
      toast({ title: "Error", description: "Phrase and meaning are required", variant: "destructive" });
      return;
    }

      // ── Auto-compute start/end index dari content section ──
    let start = Number(highlightForm.start_index) || 0;
    let end   = Number(highlightForm.end_index)   || 0;
    if (!highlightForm.start_index && !highlightForm.end_index && highlightTarget) {
        const idx = highlightTarget.content.indexOf(highlightForm.phrase.trim());
        if (idx !== -1) {
            start = idx;
            end   = idx + highlightForm.phrase.trim().length;
        }
     }

    startTransition(async () => {
      const payload = {
        phrase:         highlightForm.phrase.trim(),
        meaning:        highlightForm.meaning.trim(),
        start_index:    start,
        end_index:      end,
        color_tag:      highlightForm.color_tag,
        highlight_type: highlightForm.highlight_type,
        order_index:    highlightForm.order_index,
      };

      let res: Response;
      if (editingHighlight) {
        // PUT .../highlights/[highlightId]
        res = await fetch(
          `/api/lyric-analyses/${analysisId}/sections/${highlightTarget.id}/highlights/${editingHighlight.id}`,
          { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
      } else {
        // POST .../highlights
        res = await fetch(
          `/api/lyric-analyses/${analysisId}/sections/${highlightTarget.id}/highlights`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
        );
      }

      const json = await res.json();
      if (res.ok) {
        toast({ title: editingHighlight ? "Highlight updated" : "Highlight added" });
        setSections((prev) => prev.map((s) => {
          if (s.id !== highlightTarget.id) return s;
          const highlights = editingHighlight
            ? s.lyric_highlights.map((h) => h.id === editingHighlight.id ? json : h)
            : [...s.lyric_highlights, json];
          return { ...s, lyric_highlights: highlights };
        }));
        setHighlightTarget(null);
        setEditingHighlight(null);
        setHighlightForm(emptyHighlightForm);
      } else {
        toast({ title: "Error", description: json.error ?? "Failed", variant: "destructive" });
      }
    });
  }

  async function handleDeleteHighlight() {
    if (!deleteHighlightTarget) return;
    const { sectionId, highlight } = deleteHighlightTarget;
    startTransition(async () => {
      const res = await fetch(
        `/api/lyric-analyses/${analysisId}/sections/${sectionId}/highlights/${highlight.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setSections((prev) => prev.map((s) =>
          s.id === sectionId
            ? { ...s, lyric_highlights: s.lyric_highlights.filter((h) => h.id !== highlight.id) }
            : s
        ));
        toast({ title: "Highlight deleted" });
      }
      setDeleteHighlightTarget(null);
    });
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Section list */}
      {sections.length === 0 ? (
        <div className="bg-zinc-900/60 border border-dashed border-zinc-700 rounded-lg py-10 text-center">
          <p className="text-zinc-600 text-sm italic">No sections yet.</p>
          <p className="text-zinc-700 text-xs mt-1">Add verse, chorus, bridge sections below.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <Card key={section.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-3">

                {/* Section header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] h-5 px-1.5 bg-indigo-900/40 text-indigo-400 border border-indigo-800/60 capitalize">
                      {section.section_type}
                    </Badge>
                    <span className="text-sm font-semibold text-zinc-200">{section.section_label}</span>
                    <span className="text-[10px] text-zinc-600">#{section.order_index + 1}</span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm"
                      onClick={() => openEditSection(section)}
                      className="h-6 text-[10px] text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 px-2">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm"
                      onClick={() => setDeleteSectionTarget(section)}
                      className="h-6 text-[10px] text-zinc-600 hover:text-red-400 hover:bg-red-950/30 px-2">
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Section content preview */}
                <p className="text-xs text-zinc-500 italic whitespace-pre-wrap line-clamp-3 border-l-2 border-zinc-700 pl-3">
                  {section.content}
                </p>

                {/* Highlights */}
                {section.lyric_highlights.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
                      Highlights ({section.lyric_highlights.length})
                    </p>
                    <div className="space-y-1.5">
                      {section.lyric_highlights
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((hl) => (
                          <div key={hl.id}
                            className="flex items-start gap-2 p-2 bg-zinc-800/50 rounded border border-zinc-700/50 group/hl">
                            <span
                              className="w-2 h-2 rounded-full mt-1 shrink-0"
                              style={{ background: hl.color_tag ?? "#6366f1" }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-300">&ldquo;{hl.phrase}&rdquo;</p>
                              <p className="text-[11px] text-zinc-500 mt-0.5">{hl.meaning}</p>
                              {hl.highlight_type && (
                                <span className="text-[9px] text-zinc-600 uppercase tracking-wide">{hl.highlight_type}</span>
                              )}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover/hl:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => openEditHighlight(section, hl)}
                                className="text-[9px] text-zinc-600 hover:text-zinc-300 px-1.5 py-0.5 hover:bg-zinc-700 rounded transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteHighlightTarget({ sectionId: section.id, highlight: hl })}
                                className="text-[9px] text-zinc-600 hover:text-red-400 px-1.5 py-0.5 hover:bg-red-950/30 rounded transition-colors"
                              >
                                Del
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Add highlight button */}
                <Button variant="ghost" size="sm"
                  onClick={() => openNewHighlight(section)}
                  className="h-7 text-xs text-zinc-600 hover:text-indigo-400 hover:bg-indigo-950/20 border border-dashed border-zinc-700 hover:border-indigo-700 w-full transition-colors">
                  + Add Highlight
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add section button */}
      <Button variant="outline" size="sm"
        onClick={openNewSection}
        className="w-full h-9 text-xs border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600">
        + Add Section
      </Button>

      {/* ── Section Form Dialog ── */}
      <Dialog open={showSectionForm} onOpenChange={setShowSectionForm}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-zinc-100">
              {editingSection ? "Edit Section" : "Add Section"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Type</Label>
                <Select
                  value={sectionForm.section_type}
                  onValueChange={(v) => setSectionForm((f) => ({ ...f, section_type: v }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    {SECTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}
                        className="hover:bg-zinc-800 focus:bg-zinc-800 text-sm text-zinc-200">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">
                  Label <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={sectionForm.section_label}
                  onChange={(e) => setSectionForm((f) => ({ ...f, section_label: e.target.value }))}
                  placeholder="e.g. Verse 1"
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Lyrics Content <span className="text-red-400">*</span>
              </Label>
              <Textarea
                value={sectionForm.content}
                onChange={(e) => setSectionForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Paste the lyrics for this section..."
                rows={5}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Order</Label>
              <Input
                type="number"
                value={sectionForm.order_index}
                onChange={(e) => setSectionForm((f) => ({ ...f, order_index: Number(e.target.value) }))}
                min={0}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm w-24"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSectionForm(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button size="sm" onClick={handleSaveSection} disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
              {isPending ? "Saving..." : (editingSection ? "Save Changes" : "Add Section")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Highlight Form Dialog ── */}
      <Dialog open={!!highlightTarget} onOpenChange={() => { setHighlightTarget(null); setEditingHighlight(null); }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-zinc-100">
              {editingHighlight ? "Edit Highlight" : "Add Highlight"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Phrase <span className="text-red-400">*</span>
              </Label>
              <Input
                value={highlightForm.phrase}
                onChange={(e) => setHighlightForm((f) => ({ ...f, phrase: e.target.value }))}
                placeholder="e.g. Yesterday, all my troubles seemed so far away"
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">
                Meaning <span className="text-red-400">*</span>
              </Label>
              <Textarea
                value={highlightForm.meaning}
                onChange={(e) => setHighlightForm((f) => ({ ...f, meaning: e.target.value }))}
                placeholder="Explain the meaning, symbolism, or context..."
                rows={3}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 resize-none text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Type</Label>
                <Select
                  value={highlightForm.highlight_type}
                  onValueChange={(v) => setHighlightForm((f) => ({ ...f, highlight_type: v }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    {HIGHLIGHT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}
                        className="hover:bg-zinc-800 focus:bg-zinc-800 text-sm text-zinc-200">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Color</Label>
                <Select
                  value={highlightForm.color_tag}
                  onValueChange={(v) => setHighlightForm((f) => ({ ...f, color_tag: v }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}
                        className="hover:bg-zinc-800 focus:bg-zinc-800 text-sm text-zinc-200">
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: c.value }} />
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* start/end index — optional, bisa dikosongkan */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Start Index <span className="text-zinc-600">(optional)</span></Label>
                <Input type="number" value={highlightForm.start_index} min={0}
                  onChange={(e) => setHighlightForm((f) => ({ ...f, start_index: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">End Index <span className="text-zinc-600">(optional)</span></Label>
                <Input type="number" value={highlightForm.end_index} min={0}
                  onChange={(e) => setHighlightForm((f) => ({ ...f, end_index: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 h-9 text-sm" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm"
              onClick={() => { setHighlightTarget(null); setEditingHighlight(null); }}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button size="sm" onClick={handleSaveHighlight} disabled={isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[100px]">
              {isPending ? "Saving..." : (editingHighlight ? "Save Changes" : "Add Highlight")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Section Confirm ── */}
      <Dialog open={!!deleteSectionTarget} onOpenChange={() => setDeleteSectionTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Section?</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400 text-sm">
            Delete <span className="text-zinc-200 font-medium">&quot;{deleteSectionTarget?.section_label}&quot;</span> and all its highlights? This cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteSectionTarget(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button size="sm" onClick={handleDeleteSection} disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? "Deleting..." : "Delete Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Highlight Confirm ── */}
      <Dialog open={!!deleteHighlightTarget} onOpenChange={() => setDeleteHighlightTarget(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Highlight?</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400 text-sm">
            Delete highlight <span className="text-zinc-200 font-medium">&quot;{deleteHighlightTarget?.highlight.phrase}&quot;</span>?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteHighlightTarget(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">Cancel</Button>
            <Button size="sm" onClick={handleDeleteHighlight} disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white">
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}