import Image from "next/image";
import Link from "next/link";

interface AlbumCardProps {
  title: string;
  slug: string;
  coverImage: string | null;
  artistName: string;
  artistSlug: string;
  releaseDate: string | null;
  albumType?: string | null;
}

export default function AlbumCard({
  title, slug, coverImage, artistName, artistSlug, releaseDate, albumType,
}: AlbumCardProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  return (
    // ✅ Ganti <Link> jadi <div> — bukan lagi <a>
    <div className="group flex flex-col gap-2">
      {/* Cover — area klik ke album */}
      <Link
        href={`/albums/${slug}`}
        className="relative aspect-square bg-[#E8E5E0] overflow-hidden shadow-sm group-hover:shadow-md transition-shadow block"
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#A8A39D]">
            <span className="text-3xl">◎</span>
            <span className="text-[10px] tracking-widest uppercase">Album</span>
          </div>
        )}
        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
        {albumType && albumType !== "album" && (
          <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider bg-black/50 text-white px-1.5 py-0.5 rounded">
            {albumType}
          </span>
        )}
      </Link>

      {/* Info — judul klik ke album, artist klik ke artist */}
      <div>
        <Link
          href={`/albums/${slug}`}
          className="text-sm font-semibold text-[#1A1917] leading-tight truncate hover:text-[#3B5BDB] transition-colors block"
        >
          {title}
        </Link>
        <p className="text-xs text-[#8A8680] truncate">
          {/* ✅ Link ini sekarang tidak nested — <div> bukan <a> di atas */}
          <Link
            href={`/artists/${artistSlug}`}
            className="hover:text-[#3B5BDB] transition-colors"
          >
            {artistName}
          </Link>
          {year && <span className="text-[#C0B8AE]"> · {year}</span>}
        </p>
      </div>
    </div>
  );
}