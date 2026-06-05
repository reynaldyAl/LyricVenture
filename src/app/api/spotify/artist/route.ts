import { createClient } from "@/lib/supabase/server";
import { okResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { extractSpotifyId, fetchSpotify, SpotifyApiError } from "@/lib/spotify";

type SpotifyImage = {
  url: string;
  width?: number | null;
  height?: number | null;
};

type SpotifyArtist = {
  id: string;
  name: string;
  genres?: string[];
  images?: SpotifyImage[];
  popularity?: number;
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

  const id = extractSpotifyId(input, "artist");
  if (!id) {
    return errorResponse("Invalid Spotify artist ID or URL", 400);
  }

  try {
    const artist = await fetchSpotify<SpotifyArtist>(`artists/${id}`);
    return okResponse({
      id: artist.id,
      name: artist.name,
      genres: artist.genres ?? [],
      images: artist.images ?? [],
      popularity: artist.popularity ?? null,
      spotify_url: artist.external_urls?.spotify ?? null,
      uri: artist.uri ?? null,
    });
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("Failed to fetch artist", 500);
  }
}
