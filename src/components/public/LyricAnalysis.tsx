import type { Tables } from "@/lib/types";

type Highlight = Tables<"lyric_highlights">;
type Section   = Tables<"lyric_sections"> & { lyric_highlights: Highlight[] };
type Analysis  = Tables<"lyric_analyses"> & { lyric_sections: Section[] };

// ── Highlight renderer — warna phrase di dalam teks ─────
function HighlightedContent({
  content,
  highlights,
}: {
  content: string;
  highlights: Highlight[];
}) {
  if (!highlights.length) {
    return (
      <p className="text-sm text-[#3A3633] leading-[1.9] whitespace-pre-wrap font-serif">
        {content}
      </p>
    );
  }

  // Sort highlights by start_index
  const sorted = [...highlights].sort(
    (a, b) => (a.start_index ?? 0) - (b.start_index ?? 0)
  );

  // Build segments: plain text + highlighted spans
  const segments: { text: string; highlight?: Highlight }[] = [];
  let cursor = 0;

  for (const hl of sorted) {
    const start = hl.start_index ?? 0;
    const end   = hl.end_index   ?? 0;

    if (start > cursor) {
      segments.push({ text: content.slice(cursor, start) });
    }
    segments.push({
      text: content.slice(start, end),
      highlight: hl,
    });
    cursor = end;
  }

  return (
    <p className="text-sm text-[#3A3633] leading-[1.9] whitespace-pre-wrap font-serif">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <span
            key={i}
            className="relative group/hl cursor-help"
            style={{
              background:    seg.highlight.color_tag ? `${seg.highlight.color_tag}28` : "#FFF3B0",
              borderBottom:  `2px solid ${seg.highlight.color_tag ?? "#F59E0B"}`,
              paddingBottom: "1px",
            }}
          >
            {seg.text}
            {/* Tooltip */}
            <span className="absolute bottom-full left-0 z-20 mb-2 w-64 p-3 text-xs bg-[#1A1917] text-[#F4F3F0] leading-relaxed opacity-0 group-hover/hl:opacity-100 transition-opacity pointer-events-none shadow-lg">
              <span
                className="block text-[9px] uppercase tracking-widest mb-1.5 font-medium"
                style={{ color: seg.highlight.color_tag ?? "#F59E0B" }}
              >
                {seg.highlight.highlight_type ?? "meaning"}
              </span>
              {seg.highlight.meaning}
            </span>
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </p>
  );
}

// ── Section type badge ───────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
  verse:       "#3B5BDB",
  chorus:      "#7C3AED",
  bridge:      "#059669",
  intro:       "#D97706",
  outro:       "#DC2626",
  "pre-chorus": "#0891B2",
  hook:        "#C026D3",
  other:       "#6B7280",
};

// ── Main component ───────────────────────────────────────
export default function LyricAnalysis({ analysis }: { analysis: Analysis }) {
  const sections = [...(analysis.lyric_sections ?? [])]
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <article className="space-y-12">

      {/* ── Overview ── */}
      {(analysis.theme || analysis.intro || analysis.background) && (
        <section>
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-5">Overview</p>

          {analysis.theme && (
            <div className="mb-6 pl-4 border-l-2 border-[#3B5BDB]">
              <p className="text-[10px] uppercase tracking-widest text-[#3B5BDB] mb-1">Theme</p>
              <p className="font-serif font-bold text-xl text-[#1A1917] italic">
                &ldquo;{analysis.theme}&rdquo;
              </p>
            </div>
          )}

          {analysis.intro && (
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-widest text-[#8A8680] mb-2">Introduction</p>
              <p className="text-sm text-[#5A5651] leading-relaxed">{analysis.intro}</p>
            </div>
          )}

          {analysis.background && (
            <div className="p-5 border border-[#E2E0DB] bg-white">
              <p className="text-[10px] uppercase tracking-widest text-[#8A8680] mb-2">Background</p>
              <p className="text-sm text-[#5A5651] leading-relaxed">{analysis.background}</p>
            </div>
          )}
        </section>
      )}

      {/* ── Lyric Sections ── */}
      {sections.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680]">Lyric Breakdown</p>
            <div className="flex-1 h-px bg-[#E2E0DB]" />
            {/* Highlight legend hint */}
            <p className="text-[10px] text-[#A8A39D] italic">
              Hover highlighted phrases to read their meaning
            </p>
          </div>

          <div className="space-y-10">
            {sections.map((section) => {
              const color  = SECTION_COLORS[section.section_type] ?? "#6B7280";
              const highlights = [...(section.lyric_highlights ?? [])]
                .sort((a, b) => a.order_index - b.order_index);

              return (
                <div key={section.id} className="group">
                  {/* Section header */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <span
                      className="text-[9px] px-2 py-0.5 uppercase tracking-widest font-medium"
                      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}
                    >
                      {section.section_type}
                    </span>
                    <span className="text-sm font-semibold text-[#1A1917]">
                      {section.section_label}
                    </span>
                  </div>

                  {/* Lyric content with highlights */}
                  <div className="pl-4 border-l border-[#E2E0DB] group-hover:border-[#C5C2BC] transition-colors">
                    <HighlightedContent
                      content={section.content}
                      highlights={highlights}
                    />
                  </div>

                  {/* Highlight meanings list — mobile fallback */}
                  {highlights.length > 0 && (
                    <div className="mt-4 space-y-2 md:hidden">
                      {highlights.map((hl) => (
                        <div
                          key={hl.id}
                          className="flex gap-2.5 p-3 bg-white border border-[#E2E0DB]"
                        >
                          <span
                            className="w-1.5 shrink-0 mt-1 self-stretch rounded-full"
                            style={{ background: hl.color_tag ?? "#F59E0B" }}
                          />
                          <div>
                            <p
                              className="text-xs font-semibold mb-1"
                              style={{ color: hl.color_tag ?? "#F59E0B" }}
                            >
                              &ldquo;{hl.phrase}&rdquo;
                            </p>
                            <p className="text-xs text-[#5A5651] leading-relaxed">
                              {hl.meaning}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Conclusion ── */}
      {analysis.conclusion && (
        <section className="border-t border-[#E2E0DB] pt-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-4">Conclusion</p>
          <div className="pl-5 border-l-2 border-[#1A1917]">
            <p className="font-serif text-base text-[#3A3633] leading-relaxed italic">
              {analysis.conclusion}
            </p>
          </div>
        </section>
      )}
    </article>
  );
}