"use client";

import Image from "next/image";
import Link from "next/link";

interface VinylCardProps {
  name: string;
  slug: string;
  coverImage: string | null;
  origin?: string | null;
  genre?: string[] | null;
}

export default function VinylCard({ name, slug, coverImage, origin, genre }: VinylCardProps) {
  return (
    <Link
      href={`/artists/${slug}`}
      className="vinyl-card flex flex-col items-center gap-3 group cursor-pointer"
    >
      {/* Vinyl disc */}
      <div className="relative w-24 h-24 shrink-0">
        {/* Spinning disc */}
        <div
          className="vinyl-spin vinyl-grooves vinyl-hole w-full h-full rounded-full overflow-hidden relative"
          style={{
            background: coverImage ? undefined : "#2A2A2A",
            boxShadow: "0 4px 20px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(0,0,0,0.1)",
          }}
        >
          {coverImage ? (
            <Image
              src={coverImage}
              alt={name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-2xl">
              ♪
            </div>
          )}
        </div>

        {/* Reflection shimmer on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
          style={{ background: "radial-gradient(circle at 35% 35%, white 0%, transparent 70%)" }}
        />
      </div>
          
      {/* Name */}
      <div className="text-center">
        <p className="text-[13px] font-semibold text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors leading-tight max-w-[90px] truncate">
          {name}
        </p>
        {origin && (
          <p className="text-[10px] text-[#8A8680] mt-0.5 truncate max-w-[90px]">{origin}</p>
        )}
        {genre && genre.length > 0 && (
          <p className="text-[10px] text-[#A8A39D] italic truncate max-w-[90px]">
            {genre.slice(0, 1).join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}