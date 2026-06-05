import { createClient } from "@/lib/supabase/server";
import { okResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { extractSpotifyId, fetchSpotify, SpotifyApiError } from "@/lib/spotify";

type SpotifyImage = {
  url: string;
  width?: number | null;
  height?: number | null;
};

type SpotifyAlbum = {
  id: string;
  name: string;
  album_type: string;
  total_tracks: number;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  images?: SpotifyImage[];
  artists?: { id: string; name: string }[];
  external_urls?: { spotify?: string };
  uri?: string;
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

  const id = extractSpotifyId(input, "album");
  if (!id) {
    return errorResponse("Invalid Spotify album ID or URL", 400);
  }

  try {
    const album = await fetchSpotify<SpotifyAlbum>(`albums/${id}`);
    return okResponse({
      id: album.id,
      name: album.name,
      album_type: album.album_type,
      total_tracks: album.total_tracks,
      release_date: album.release_date,
      release_date_precision: album.release_date_precision,
      images: album.images ?? [],
      artists: album.artists ?? [],
      spotify_url: album.external_urls?.spotify ?? null,
      uri: album.uri ?? null,
    });
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("Failed to fetch album", 500);
  }
}
