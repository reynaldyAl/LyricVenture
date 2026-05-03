import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Tables } from "@/lib/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Albums",
  description:
    "Browse album discographies on LyricVenture. Explore track lists and lyric analyses by album.",
  openGraph: {
    title: "Albums | LyricVenture",
    description: "Browse album discographies and lyric analyses.",
    url: "https://lyricventure.com/albums",
  },
};

type AlbumItem = Pick<
  Tables<"albums">,
  "id" | "title" | "slug" | "cover_image" | "release_date" | "album_type"
> & {
  artists: Pick<Tables<"artists">, "id" | "name" | "slug"> | null;
};

async function getAlbums(
  page: number,
  pageSize: number,
): Promise<{ items: AlbumItem[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("albums")
    .select(
      `
      id, title, slug, cover_image, release_date, album_type,
      artists ( id, name, slug )
    `,
      { count: "exact" },
    )
    .eq("status", "published") // ✅ FIX — hanya album yang sudah di-approve
    .order("release_date", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("getAlbums:", error.message);
    return { items: [], total: 0 };
  }
  return { items: (data ?? []) as AlbumItem[], total: count ?? 0 };
}

async function getLatestYear(): Promise<number | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("albums")
    .select("release_date")
    .eq("status", "published")
    .order("release_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestYear:", error.message);
    return null;
  }
  return data?.release_date ? new Date(data.release_date).getFullYear() : null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AlbumsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params?.page ?? 1));
  const pageSize = 12;
  const [{ items, total }, latestYear] = await Promise.all([
    getAlbums(currentPage, pageSize),
    getLatestYear(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const albums =
    safePage === currentPage || total === 0
      ? items
      : (await getAlbums(safePage, pageSize)).items;
  const fromIndex = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const toIndex = Math.min(total, safePage * pageSize);

  return (
    <div style={{ background: "#F4F3F0", color: "#1A1917" }}>
      {/* Header */}
      <section className="relative overflow-hidden border-b border-[#E2E0DB] bg-white">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-[#3B5BDB]/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#1A1917]/8 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-6 py-14 max-w-5xl">
          <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680] mb-2">
            Discography
          </p>
          <h1 className="font-serif font-bold text-4xl md:text-[3.25rem] text-[#1A1917]">
            Albums
          </h1>
          <p className="text-sm text-[#6A665F] mt-3 max-w-2xl">
            Browse album discographies and jump into track lists and lyric
            analyses.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md">
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {total}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Albums
              </p>
            </div>
            <div className="rounded-lg border border-[#E7E4DE] bg-white/70 px-4 py-3">
              <p className="text-2xl font-bold font-serif text-[#1A1917] leading-none">
                {latestYear ?? "-"}
              </p>
              <p className="text-[10px] text-[#8A8680] uppercase tracking-widest mt-1">
                Latest Year
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {albums.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl text-[#C5C2BC] mb-4">◎</p>
            <p className="font-serif text-xl text-[#5A5651]">No albums yet.</p>
            <p className="text-sm text-[#8A8680] italic mt-2">
              Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#8A8680]">
              <span>
                Showing {fromIndex}-{toIndex} of {total}
              </span>
              <span className="text-[10px] uppercase tracking-widest">
                Page {safePage} of {totalPages}
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#ECE8E1] bg-white/80 backdrop-blur">
              <table className="w-full text-left">
                <thead className="bg-[#F4F3F0] text-[10px] uppercase tracking-widest text-[#8A8680]">
                  <tr>
                    <th className="py-3 px-4 text-right font-medium">#</th>
                    <th className="py-3 px-4 font-medium">Cover</th>
                    <th className="py-3 px-4 font-medium">Album</th>
                    <th className="py-3 px-4 font-medium hidden md:table-cell">
                      Artist
                    </th>
                    <th className="py-3 px-4 font-medium text-right hidden sm:table-cell">
                      Release
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEAE3]">
                  {albums.map((album, i) => {
                    const rowNumber = fromIndex + i;
                    return (
                      <tr
                        key={album.id}
                        className="group hover:bg-white transition-colors"
                      >
                        <td className="py-4 px-4 text-right text-xs font-mono tabular-nums text-[#C0B8AE]">
                          {String(rowNumber).padStart(2, "0")}
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-12 h-12 rounded-md bg-[#E2E0DB] overflow-hidden ring-1 ring-black/5">
                            {album.cover_image ? (
                              <Image
                                src={album.cover_image}
                                alt={album.title}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-sm">
                                ◎
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Link
                            href={`/albums/${album.slug}`}
                            className="font-serif font-bold text-sm text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors line-clamp-1"
                          >
                            {album.title}
                          </Link>
                        </td>
                        <td className="py-4 px-4 hidden md:table-cell">
                          {album.artists ? (
                            <Link
                              href={`/artists/${album.artists.slug}`}
                              className="text-xs text-[#5A5651] hover:text-[#3B5BDB] transition-colors"
                            >
                              {album.artists.name}
                            </Link>
                          ) : (
                            <span className="text-xs text-[#C0B8AE]">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right text-xs text-[#C0B8AE] hidden sm:table-cell">
                          {formatDate(album.release_date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              {safePage > 1 ? (
                <Link
                  href={`/albums?page=${safePage - 1}`}
                  className="text-xs text-[#3B5BDB] hover:underline"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="text-xs text-[#C0B8AE]">← Previous</span>
              )}
              {safePage < totalPages ? (
                <Link
                  href={`/albums?page=${safePage + 1}`}
                  className="text-xs text-[#3B5BDB] hover:underline"
                >
                  Next →
                </Link>
              ) : (
                <span className="text-xs text-[#C0B8AE]">Next →</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
