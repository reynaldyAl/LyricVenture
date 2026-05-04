"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Tables } from "@/lib/types";

type SongInAlbum = Pick<
  Tables<"songs">,
  "id" | "title" | "slug" | "cover_image" | "duration_sec" | "status" | "view_count" | "spotify_track_id"
> & {
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "slug" | "color"> | null }[];
};

type Props = {
  songs: SongInAlbum[];
  pageSize?: number;
};

function fmt(sec: number | null) {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function AlbumTracksPager({ songs, pageSize = 4 }: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = Math.max(1, Math.ceil(songs.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const pageSongs = useMemo(() => {
    const start = safePageIndex * pageSize;
    return songs.slice(start, start + pageSize);
  }, [songs, safePageIndex, pageSize]);

  const fromIndex = songs.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const toIndex = Math.min(songs.length, safePageIndex * pageSize + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[#8A8680]">
        <span>
          Showing {fromIndex}-{toIndex} of {songs.length}
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

      <div className="rounded-2xl border border-[#ECE8E1] bg-white/80 backdrop-blur">
        {/* Column headers */}
        <div className="grid grid-cols-[2rem_2.5rem_1fr_3rem_4rem] gap-3 items-center px-3 py-2 border-b border-[#E2E0DB] bg-[#F4F3F0] text-[10px] uppercase tracking-widest text-[#8A8680]">
          <span className="text-[9px] text-[#C0B8AE] text-right font-mono">#</span>
          <span />
          <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE]">Title</span>
          <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] hidden sm:block">Tags</span>
          <span className="text-[9px] uppercase tracking-widest text-[#C0B8AE] text-right hidden md:block">Time</span>
        </div>

        <div className="divide-y divide-[#E2E0DB]">
          {pageSongs.map((song, i) => {
            const rowNumber = fromIndex + i;
            const tags = song.song_tags
              .map((st) => st.tags)
              .filter(Boolean) as NonNullable<typeof song.song_tags[0]["tags"]>[];

            return (
              <Link
                key={song.id}
                href={`/songs/${song.slug}`}
                className="grid grid-cols-[2rem_2.5rem_1fr_5rem_4rem] gap-3 items-center -mx-3 px-3 py-3 hover:bg-white transition-colors group"
              >
                {/* Number / play */}
                <span className="text-xs text-[#C0B8AE] text-right font-mono group-hover:hidden tabular-nums">
                  {String(rowNumber).padStart(2, "0")}
                </span>
                <span className="text-sm text-[#3B5BDB] text-right hidden group-hover:block">▶</span>

                {/* Cover */}
                <div className="w-10 h-10 bg-[#E2E0DB] overflow-hidden shrink-0">
                  {song.cover_image ? (
                    <Image src={song.cover_image} alt={song.title} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-sm">♫</div>
                  )}
                </div>

                {/* Title */}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1917] truncate group-hover:text-[#3B5BDB] transition-colors">
                    {song.title}
                  </p>
                  {song.spotify_track_id && (
                    <p className="text-[10px] text-[#1DB954]">● Spotify</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
                    {tags.length > 0 ? (
                      tags.slice(0, 1).map((tag) => (
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

                {/* Tags */}
                <div className="hidden sm:flex gap-1 items-center">
                  {tags.length > 0 ? (
                    tags.slice(0, 1).map((tag) => (
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

                {/* Duration */}
                <span className="text-[11px] text-[#C0B8AE] text-right font-mono tabular-nums hidden md:block">
                  {fmt(song.duration_sec)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
