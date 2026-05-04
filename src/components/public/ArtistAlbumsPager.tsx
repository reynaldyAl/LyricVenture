"use client";

import { useMemo, useState } from "react";
import AlbumCard from "@/components/public/AlbumCard";
import type { Tables } from "@/lib/types";

type AlbumInArtist = Pick<
  Tables<"albums">,
  "id" | "title" | "slug" | "cover_image" | "release_date" | "album_type" | "total_tracks" | "status"
>;

type Props = {
  albums: AlbumInArtist[];
  artistName: string;
  artistSlug: string;
  pageSize?: number;
};

export default function ArtistAlbumsPager({
  albums,
  artistName,
  artistSlug,
  pageSize = 12,
}: Props) {
  const [pageIndex, setPageIndex] = useState(0);
  const totalPages = Math.max(1, Math.ceil(albums.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const pageAlbums = useMemo(() => {
    const start = safePageIndex * pageSize;
    return albums.slice(start, start + pageSize);
  }, [albums, safePageIndex, pageSize]);

  const fromIndex = albums.length === 0 ? 0 : safePageIndex * pageSize + 1;
  const toIndex = Math.min(albums.length, safePageIndex * pageSize + pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[#8A8680]">
        <span>
          Showing {fromIndex}-{toIndex} of {albums.length}
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {pageAlbums.map((album) => (
          <AlbumCard
            key={album.id}
            title={album.title}
            slug={album.slug}
            coverImage={album.cover_image}
            artistName={artistName}
            artistSlug={artistSlug}
            releaseDate={album.release_date}
            albumType={album.album_type}
          />
        ))}
      </div>
    </div>
  );
}
