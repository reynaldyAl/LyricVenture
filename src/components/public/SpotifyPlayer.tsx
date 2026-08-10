"use client";

import { useEffect, useRef, useState } from "react";

interface SpotifyPlayerProps {
  trackId: string;
  title?: string;
  artist?: string;
  coverImage?: string;
}

/** Extract track ID from a full Spotify URL or return as-is if already an ID */
export function extractSpotifyTrackId(input: string): string {
  const match = input.match(/spotify\.com\/track\/([A-Za-z0-9]+)/);
  return match ? match[1] : input.trim();
}

export default function SpotifyPlayer({
  trackId,
  title,
  artist,
  coverImage,
}: SpotifyPlayerProps) {
  const [showSticky, setShowSticky] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!dismissed) setShowSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [dismissed]);

  const scrollToPlayer = () => {
    sentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      {/* ── In-page compact embed ── */}
      <div
        ref={sentinelRef}
        style={{ width: "100%", position: "relative", zIndex: 10 }}
      >
        <iframe
          src={embedUrl}
          width="100%"
          height="80"
          frameBorder="0"
          allowFullScreen
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share"
          loading="lazy"
          title={title ? `Preview: ${title}` : "Spotify preview"}
          style={{
            borderRadius: 12,
            display: "block",
            width: "100%",
          }}
        />
      </div>

      {/* ── Sticky mini-pill — no embed, no horizontal overflow ── */}
      <div
        aria-label="Music player notification"
        style={{
          position: "fixed",
          bottom: 16,
          /* Use left+right instead of left:50%+transform to avoid horizontal scroll on mobile */
          left: 16,
          right: 16,
          margin: "0 auto",
          maxWidth: 480,
          zIndex: 50,
          opacity: showSticky && !dismissed ? 1 : 0,
          pointerEvents: showSticky && !dismissed ? "auto" : "none",
          transform: showSticky && !dismissed ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(26,25,23,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 40,
          padding: "6px 10px 6px 8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
      >
        {/* Cover */}
        {coverImage && (
          <div style={{ width: 28, height: 28, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt="" width={28} height={28} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* Icon */}
        <span style={{ fontSize: 13, color: "#1DB954", flexShrink: 0 }}>♫</span>

        {/* Song info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#FFFFFF", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {title ?? "Now playing"}
          </p>
          {artist && (
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artist}
            </p>
          )}
        </div>

        {/* Scroll-back button */}
        <button
          onClick={scrollToPlayer}
          aria-label="Go to player"
          style={{
            flexShrink: 0,
            background: "#1DB954",
            color: "#fff",
            border: "none",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 10,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
          }}
        >
          ▲ Play
        </button>

        {/* Close */}
        <button
          onClick={() => { setDismissed(true); setShowSticky(false); }}
          aria-label="Close notification"
          style={{
            flexShrink: 0,
            width: 18,
            height: 18,
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 9,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </>
  );
}
