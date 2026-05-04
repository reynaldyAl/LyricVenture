"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Tables } from "@/lib/types";

type SongItem = Pick<
  Tables<"songs">,
  "id" | "title" | "slug" | "cover_image" | "language" | "duration_sec" | "view_count"
> & {
  artists:   Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
  albums:    Pick<Tables<"albums">,  "id" | "title" | "slug"> | null;
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "slug" | "color"> | null }[];
};

type TagItem = Pick<Tables<"tags">, "id" | "name" | "slug" | "color">;

function fmt(sec: number | null) {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function SongsClient({ songs, tags }: { songs: SongItem[]; tags: TagItem[] }) {
  const [search,    setSearch]    = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 5;

  const filtered = useMemo(() => {
    return songs.filter((song) => {
      const matchSearch =
        !search ||
        song.title.toLowerCase().includes(search.toLowerCase()) ||
        (song.artists?.name ?? "").toLowerCase().includes(search.toLowerCase());

      const matchTag =
        !activeTag ||
        song.song_tags.some((st) => st.tags?.slug === activeTag);

      return matchSearch && matchTag;
    });
  }, [songs, search, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const pageSongs = useMemo(() => {
    const start = safePageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePageIndex]);

  const fromIndex = filtered.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const toIndex = Math.min(filtered.length, safePageIndex * pageSize + pageSize);

  const visibleTags = useMemo(() => {
    if (showAllTags) return tags;
    return tags.slice(0, 5);
  }, [tags, showAllTags]);

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl space-y-8">

      {/* ── Search + Tag filter ── */}
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A8A39D] text-sm select-none">
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search songs or artists..."
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

        {/* Tag pills */}
        {tags.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`text-[11px] px-3 py-1 border transition-colors ${
                  activeTag === null
                    ? "bg-[#1A1917] text-[#F4F3F0] border-[#1A1917]"
                    : "bg-white text-[#5A5651] border-[#D5D2CB] hover:border-[#1A1917] hover:text-[#1A1917]"
                }`}
              >
                All
              </button>
              {visibleTags.map((tag) => {
                const isActive = activeTag === tag.slug;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setActiveTag(isActive ? null : tag.slug)}
                    className="text-[11px] px-3 py-1 border transition-all"
                    style={{
                      background:  isActive ? tag.color ?? "#1A1917" : "#FFFFFF",
                      borderColor: isActive ? tag.color ?? "#1A1917" : "#D5D2CB",
                      color:       isActive ? "#FFFFFF" : tag.color ?? "#5A5651",
                    }}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
            {tags.length > 5 && (
              <button
                onClick={() => setShowAllTags((prev) => !prev)}
                className="mt-2 text-[10px] uppercase tracking-widest text-[#5A5651] hover:text-[#3B5BDB] transition-colors"
              >
                {showAllTags ? "Show less" : "Show all"}
              </button>
            )}
          </div>
        )}

        {/* Result count */}
        <div className="flex items-center justify-between text-xs text-[#8A8680]">
          <span>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
          {(search || activeTag) ? (
            <button
              onClick={() => { setSearch(""); setActiveTag(null); setPageIndex(0); }}
              className="text-[#3B5BDB] hover:underline"
            >
              Clear filters
            </button>
          ) : (
            <span className="text-[10px] uppercase tracking-widest">All songs</span>
          )}
        </div>
      </div>

      {/* ── Song list ── */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-4xl mb-4 text-[#C5C2BC]">♫</p>
          <p className="font-serif text-lg text-[#5A5651]">No songs found.</p>
          <p className="text-sm text-[#8A8680] italic mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8A8680]">
            <span>
              Showing {fromIndex}-{toIndex} of {filtered.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-widest">
                Page {Math.min(safePageIndex + 1, totalPages)} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={safePageIndex <= 0}
                  className="text-[11px] text-[#3B5BDB] disabled:text-[#C0B8AE] hover:underline disabled:no-underline"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPageIndex((prev) => Math.min(prev + 1, totalPages - 1))}
                  disabled={safePageIndex >= totalPages - 1}
                  className="text-[11px] text-[#3B5BDB] disabled:text-[#C0B8AE] hover:underline disabled:no-underline"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#ECE8E1] bg-white/80 backdrop-blur">
            <table className="w-full text-left">
            <thead className="bg-[#F4F3F0] text-[10px] uppercase tracking-widest text-[#8A8680]">
              <tr>
                <th className="py-3 px-4 text-right font-medium">#</th>
                <th className="py-3 px-4 font-medium">Cover</th>
                <th className="py-3 px-4 font-medium">Title</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">Tags</th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">Views</th>
                <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEAE3]">
              {pageSongs.map((song, i) => {
                const rowNumber = fromIndex + i;
                const songTags = song.song_tags
                  .map((st) => st.tags)
                  .filter(Boolean) as NonNullable<typeof song.song_tags[0]["tags"]>[];

                return (
                  <tr key={song.id} className="group hover:bg-white transition-colors">
                    <td className="py-4 px-4 text-right text-xs font-mono tabular-nums text-[#C0B8AE]">
                      {String(rowNumber).padStart(2, "0")}
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-12 h-12 rounded-md bg-[#E2E0DB] overflow-hidden ring-1 ring-black/5">
                        {song.cover_image ? (
                          <Image
                            src={song.cover_image}
                            alt={song.title}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-sm">
                            ♫
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="min-w-0">
                        <Link
                          href={`/songs/${song.slug}`}
                          className="font-serif font-bold text-sm text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors line-clamp-1"
                        >
                          {song.title}
                        </Link>
                        <p className="text-[10px] uppercase tracking-widest text-[#8A8680] mt-1">
                          {song.artists?.name ?? "-"}
                          {song.albums?.title && (
                            <span className="ml-2 text-[#C0B8AE]">· {song.albums.title}</span>
                          )}
                          {song.language && (
                            <span className="ml-2 font-mono px-1.5 py-0.5 rounded bg-[#F0EDE8] text-[#A8A39D]">
                              {song.language}
                            </span>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1 md:hidden">
                          {songTags.length > 0 ? (
                            songTags.slice(0, 2).map((tag) => (
                              <span
                                key={tag.id}
                                className="text-[9px] px-1.5 py-0.5 border uppercase tracking-wide"
                                style={{
                                  background: tag.color ? `${tag.color}18` : "#E2E0DB",
                                  borderColor: tag.color ? `${tag.color}40` : "#D5D2CB",
                                  color: tag.color ?? "#8A8680",
                                }}
                              >
                                {tag.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#C0B8AE]">-</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {songTags.length > 0 ? (
                          songTags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="text-[9px] px-1.5 py-0.5 border uppercase tracking-wide"
                              style={{
                                background: tag.color ? `${tag.color}18` : "#E2E0DB",
                                borderColor: tag.color ? `${tag.color}40` : "#D5D2CB",
                                color: tag.color ?? "#8A8680",
                              }}
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#C0B8AE]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-xs text-[#C0B8AE] hidden sm:table-cell">
                      {(song.view_count ?? 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-xs text-[#C0B8AE] hidden sm:table-cell">
                      {fmt(song.duration_sec)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}