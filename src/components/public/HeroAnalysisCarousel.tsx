"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type AnalysisItem = {
  id: string;
  theme?: string | null;
  songs?: {
    slug?: string | null;
    title?: string | null;
    cover_image?: string | null;
    artists?: {
      name?: string | null;
    } | null;
  } | null;
};

type Props = {
  analyses: AnalysisItem[];
  intervalMs?: number;
};

export default function HeroAnalysisCarousel({
  analyses,
  intervalMs = 4000,
}: Props) {
  const items = useMemo(() => analyses.filter(Boolean), [analyses]);
  const total = items.length;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs]);

  if (total === 0) {
    return (
      <div className="max-w-sm">
        <div className="aspect-[2/3] bg-[#E2E0DB] rounded-2xl flex items-center justify-center ring-1 ring-black/5 w-full">
          <div className="text-center text-[#A8A39D]">
            <p className="text-4xl mb-2">♫</p>
            <p className="text-xs italic">Analyses coming soon.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-sm">
      <p className="text-[10px] tracking-[0.4em] uppercase text-[#8A8680]">
        Featured Analyses
      </p>

      <div className="overflow-hidden rounded-2xl ring-1 ring-black/5 shadow-[0_25px_70px_-25px_rgba(0,0,0,0.45)] w-full">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((analysis) => {
            const song = analysis.songs;
            const artist = song?.artists;
            return (
              <div key={analysis.id} className="w-full shrink-0">
                <Link
                  href={`/songs/${song?.slug ?? ""}`}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] bg-[#E2E0DB] overflow-hidden">
                    {song?.cover_image ? (
                      <Image
                        src={song.cover_image}
                        alt={song?.title ?? ""}
                        fill
                        className="object-cover group-hover:scale-[1.04] transition-transform duration-700"
                        priority={index === 0}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-[#A8A39D]">
                        ♫
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-[9px] tracking-widest uppercase text-white/60 mb-1">
                        {artist?.name}
                      </p>
                      <p className="font-serif font-bold text-lg text-white leading-tight group-hover:text-[#93C5FD] transition-colors line-clamp-2">
                        {song?.title}
                      </p>
                      {analysis.theme && (
                        <p className="text-[11px] text-white/70 mt-1 italic line-clamp-2">
                          &ldquo;{analysis.theme}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-[#8A8680]">
        <span>{index + 1}</span>
        <span className="opacity-40">/</span>
        <span>{total}</span>
      </div>
    </div>
  );
}
