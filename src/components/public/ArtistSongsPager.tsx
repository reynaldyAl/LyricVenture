"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Tables } from "@/lib/types";

type SongInArtist = Pick<
  Tables<"songs">,
  "id" | "title" | "slug" | "cover_image" | "duration_sec" | "status" | "view_count" | "spotify_track_id"
> & {
  song_tags: { tags: Pick<Tables<"tags">, "id" | "name" | "slug" | "color"> | null }[];
};

type Props = {
  songs: SongInArtist[];
  pageSize?: number;
};

function fmt(sec: number | null) {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export default function ArtistSongsPager({ songs, pageSize = 4 }: Props) {
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

      <div className="overflow-x-auto rounded-2xl border border-[#ECE8E1] bg-white/80 backdrop-blur">
        <table className="w-full text-left">
          <thead className="bg-[#F4F3F0] text-[10px] uppercase tracking-widest text-[#8A8680]">
            <tr>
              <th className="py-3 px-4 text-right font-medium">#</th>
              <th className="py-3 px-4 font-medium">Cover</th>
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium hidden sm:table-cell">Tags</th>
              <th className="py-3 px-4 font-medium text-right hidden md:table-cell">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEAE3]">
            {pageSongs.map((song, i) => {
              const rowNumber = fromIndex + i;
              const tags = song.song_tags
                .map((st) => st.tags)
                .filter(Boolean) as NonNullable<typeof song.song_tags[0]["tags"]>[];

              return (
                <tr key={song.id} className="group hover:bg-white transition-colors">
                  <td className="py-4 px-4 text-right text-xs font-mono tabular-nums text-[#C0B8AE]">
                    {String(rowNumber).padStart(2, "0")}
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-10 h-10 rounded-md bg-[#E2E0DB] overflow-hidden ring-1 ring-black/5">
                      {song.cover_image ? (
                        <Image
                          src={song.cover_image}
                          alt={song.title}
                          width={40}
                          height={40}
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
                      {(song.view_count ?? 0) > 0 && (
                        <p className="text-[10px] text-[#C0B8AE] font-mono">
                          {(song.view_count ?? 0).toLocaleString()} views
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1 items-center">
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
                  </td>
                  <td className="py-4 px-4 text-right text-xs text-[#C0B8AE] hidden md:table-cell">
                    {fmt(song.duration_sec)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
