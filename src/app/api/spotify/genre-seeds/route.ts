import { createClient } from "@/lib/supabase/server";
import { okResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { fetchSpotify, SpotifyApiError } from "@/lib/spotify";

type SpotifyGenreSeeds = {
  genres?: string[];
};

export async function GET() {
  const supabase = await createClient();
  const { error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  try {
    const result = await fetchSpotify<SpotifyGenreSeeds>(
      "recommendations/available-genre-seeds",
    );

    return okResponse({ genres: result.genres ?? [] });
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("Failed to fetch genre seeds", 500);
  }
}
