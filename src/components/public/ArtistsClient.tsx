"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Tables } from "@/lib/types";

type ArtistItem = Pick<
  Tables<"artists">,
  "id" | "name" | "slug" | "cover_image" | "genre" | "origin" | "formed_year" | "is_active"
>;

export default function ArtistsClient({ artists }: { artists: ArtistItem[] }) {
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 4;

  const filtered = useMemo(() => {
    const result = artists.filter(
      (a) =>
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.origin ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (a.genre ?? []).some((g) => g.toLowerCase().includes(search.toLowerCase()))
    );
    return result;
  }, [artists, search]);

  const pages = useMemo(() => {
    const chunks: ArtistItem[][] = [];
    for (let i = 0; i < filtered.length; i += pageSize) {
      chunks.push(filtered.slice(i, i + pageSize));
    }
    return chunks;
  }, [filtered]);

  const totalPages = Math.max(1, pages.length);

  const scrollToPage = (nextIndex: number) => {
    const node = viewportRef.current;
    if (!node) return;
    const safeIndex = Math.min(Math.max(nextIndex, 0), totalPages - 1);
    node.scrollTo({ left: node.clientWidth * safeIndex, behavior: "smooth" });
    setPageIndex(safeIndex);
  };

  const handleScroll = () => {
    const node = viewportRef.current;
    if (!node) return;
    const nextIndex = Math.round(node.scrollLeft / node.clientWidth);
    if (nextIndex !== pageIndex) setPageIndex(nextIndex);
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl space-y-8">

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A39D] text-sm select-none">
          ⌕
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, origin, genre..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E2E0DB] bg-white text-[#1A1917] placeholder:text-[#A8A39D] focus:outline-none focus:border-[#1A1917] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A39D] hover:text-[#1A1917] text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Result count + controls */}
      <div className="flex items-center justify-between text-xs text-[#8A8680] -mt-4">
        <span>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
        {filtered.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest">
              Page {Math.min(pageIndex + 1, totalPages)} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollToPage(pageIndex - 1)}
                disabled={pageIndex <= 0}
                className="text-[11px] text-[#3B5BDB] disabled:text-[#C0B8AE] hover:underline disabled:no-underline"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => scrollToPage(pageIndex + 1)}
                disabled={pageIndex >= totalPages - 1}
                className="text-[11px] text-[#3B5BDB] disabled:text-[#C0B8AE] hover:underline disabled:no-underline"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl text-[#C5C2BC] mb-4">♪</p>
          <p className="font-serif text-lg text-[#5A5651]">No artists found.</p>
        </div>
      ) : (
        <div
          ref={viewportRef}
          onScroll={handleScroll}
          className="-mx-6 px-6 overflow-x-auto scroll-smooth snap-x snap-mandatory"
        >
          <div className="flex gap-2">
            {pages.map((page, index) => (
              <div key={index} className="min-w-full snap-center">
                <div className="grid grid-cols-2 gap-0 md:grid-cols-4 gap-6">
                  {page.map((artist) => (
                    <Link
                      key={artist.id}
                      href={`/artists/${artist.slug}`}
                      className="vinyl-card group flex flex-col items-center gap-3 text-center"
                    >
                      {/* Vinyl disc */}
                      <div className="relative w-24 h-24">
                        <div
                          className="vinyl-spin vinyl-grooves vinyl-hole w-full h-full rounded-full overflow-hidden"
                          style={{
                            boxShadow: "0 4px 20px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.08)",
                          }}
                        >
                          {artist.cover_image ? (
                            <Image
                              src={artist.cover_image}
                              alt={artist.name}
                              fill
                              className="object-cover"
                              sizes="96px"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-white/40 text-2xl"
                              style={{ background: "#2A2A2A" }}
                            >
                              ♪
                            </div>
                          )}
                        </div>
                        {/* Shimmer */}
                        <div
                          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                          style={{
                            background:
                              "radial-gradient(circle at 35% 35%, white 0%, transparent 70%)",
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div>
                        <p className="text-sm font-semibold text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors leading-tight max-w-[110px] truncate">
                          {artist.name}
                        </p>
                        {artist.origin && (
                          <p className="text-[10px] text-[#8A8680] mt-0.5 truncate max-w-[110px]">
                            {artist.origin}
                          </p>
                        )}
                        {artist.genre && artist.genre.length > 0 && (
                          <p className="text-[10px] text-[#A8A39D] italic truncate max-w-[110px]">
                            {(artist.genre as string[]).slice(0, 1).join(", ")}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}