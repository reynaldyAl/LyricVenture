import { createClient } from "@/lib/supabase/server";
import { okResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { extractSpotifyId, fetchSpotify, SpotifyApiError } from "@/lib/spotify";

type SpotifyImage = {
  url: string;
  width?: number | null;
  height?: number | null;
};

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  explicit?: boolean;
  preview_url?: string | null;
  external_urls?: { spotify?: string };
  uri?: string;
  artists?: { id: string; name: string }[];
  album?: {
    id: string;
    name: string;
    release_date: string;
    release_date_precision: "year" | "month" | "day";
    images?: SpotifyImage[];
  };
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const { error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input") ?? "";

  if (!input.trim()) {
    return errorResponse("input is required", 400);
  }

  const id = extractSpotifyId(input, "track");
  if (!id) {
    return errorResponse("Invalid Spotify track ID or URL", 400);
  }

  try {
    const track = await fetchSpotify<SpotifyTrack>(`tracks/${id}`);
    return okResponse({
      id: track.id,
      name: track.name,
      duration_ms: track.duration_ms,
      explicit: track.explicit ?? null,
      preview_url: track.preview_url ?? null,
      artists: track.artists ?? [],
      album: track.album
        ? {
            id: track.album.id,
            name: track.album.name,
            release_date: track.album.release_date,
            release_date_precision: track.album.release_date_precision,
            images: track.album.images ?? [],
          }
        : null,
      spotify_url: track.external_urls?.spotify ?? null,
      uri: track.uri ?? null,
    });
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("Failed to fetch track", 500);
  }
}
