import { createClient } from "@/lib/supabase/server";
import { okResponse, errorResponse, requireAuth } from "@/lib/api-helpers";
import { extractSpotifyId, fetchSpotify, SpotifyApiError } from "@/lib/spotify";
import { slugify } from "@/lib/utils";

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
};

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  explicit?: boolean;
  preview_url?: string | null;
  artists?: { id: string; name: string }[];
  album?: {
    id: string;
    name: string;
    release_date: string;
    release_date_precision: "year" | "month" | "day";
    album_type?: string;
    total_tracks?: number;
    images?: SpotifyImage[];
  };
  external_urls?: { spotify?: string };
  uri?: string;
};

type Role = "admin" | "author";

function normalizeReleaseDate(
  value: string,
  precision: "year" | "month" | "day",
) {
  if (!value) return "";
  if (precision === "day") return value;
  if (precision === "month") return `${value}-01`;
  return `${value}-01-01`;
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "artists" | "albums" | "songs",
  base: string,
) {
  const db = supabase as any;
  let slug = base;
  let counter = 2;

  while (true) {
    const { data } = await db
      .from(table)
      .select("id")
      .eq("slug", slug)
      .limit(1);

    if (!data || data.length === 0) break;
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

function pickImageUrl(images: SpotifyImage[] | undefined, index: number) {
  if (!images || images.length === 0) return null;
  return images[index]?.url ?? images[0]?.url ?? null;
}

async function resolveRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return (profile?.role ?? "author") as Role;
}

async function ensureTagIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  genres: string[],
) {
  const db = supabase as any;
  const unique = Array.from(
    new Set(genres.map((g) => g.trim()).filter(Boolean)),
  );
  if (unique.length === 0) return [] as { id: string }[];

  const rows = unique
    .map((name) => ({ name, slug: slugify(name) }))
    .filter((row) => row.slug.length > 0);

  if (rows.length === 0) return [] as { id: string }[];

  const { data } = await db
    .from("tags")
    .upsert(rows, { onConflict: "slug" })
    .select("id, slug");

  return (data ?? []) as { id: string }[];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { user, error: authError } = await requireAuth(supabase);
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const input = String(body.input ?? "");

  if (!input.trim()) {
    return errorResponse("input is required", 400);
  }

  const id = extractSpotifyId(input, "track");
  if (!id) {
    return errorResponse("Invalid Spotify track ID or URL", 400);
  }

  try {
    const track = await fetchSpotify<SpotifyTrack>(`tracks/${id}`);

    const primaryArtist = track.artists?.[0] ?? null;
    const album = track.album ?? null;

    const role = await resolveRole(supabase, user!.id);
    const finalStatus = role === "admin" ? "published" : "draft";

    let dbArtist: { id: string; name: string } | null = null;
    let spotifyArtist: SpotifyArtist | null = null;
    if (primaryArtist) {
      const baseSlug = slugify(primaryArtist.name);
      const { data: existingArtist } = await supabase
        .from("artists")
        .select("id, name")
        .eq("slug", baseSlug)
        .single();

      if (existingArtist) {
        dbArtist = existingArtist as { id: string; name: string };
      } else {
        spotifyArtist = await fetchSpotify<SpotifyArtist>(
          `artists/${primaryArtist.id}`,
        );
        const coverImage = pickImageUrl(spotifyArtist.images, 0);
        const bannerImage = pickImageUrl(spotifyArtist.images, 1) ?? coverImage;
        const uniqueSlug = await ensureUniqueSlug(
          supabase,
          "artists",
          baseSlug,
        );

        const { data: createdArtist } = await (supabase as any)
          .from("artists")
          .insert({
            name: spotifyArtist.name,
            slug: uniqueSlug,
            genre: spotifyArtist.genres ?? [],
            cover_image: coverImage,
            banner_image: bannerImage,
            is_active: true,
            status: finalStatus,
            published_at:
              finalStatus === "published" ? new Date().toISOString() : null,
            created_by: user!.id,
          })
          .select("id, name")
          .single();

        dbArtist = (createdArtist ?? null) as {
          id: string;
          name: string;
        } | null;
      }

      if (!spotifyArtist) {
        spotifyArtist = await fetchSpotify<SpotifyArtist>(
          `artists/${primaryArtist.id}`,
        );
      }
    }

    let dbAlbum: { id: string; title: string } | null = null;
    if (album && dbArtist) {
      const baseSlug = slugify(album.name);
      const { data: existingAlbum } = await supabase
        .from("albums")
        .select("id, title")
        .eq("slug", baseSlug)
        .eq("artist_id", dbArtist.id)
        .single();

      if (existingAlbum) {
        dbAlbum = existingAlbum as { id: string; title: string };
      } else {
        const coverImage = pickImageUrl(album.images, 0);
        const uniqueSlug = await ensureUniqueSlug(supabase, "albums", baseSlug);
        const releaseDate = normalizeReleaseDate(
          album.release_date,
          album.release_date_precision,
        );

        const { data: createdAlbum } = await (supabase as any)
          .from("albums")
          .insert({
            artist_id: dbArtist.id,
            title: album.name,
            slug: uniqueSlug,
            release_date: releaseDate || null,
            album_type: album.album_type ?? "album",
            total_tracks: album.total_tracks ?? null,
            cover_image: coverImage,
            status: finalStatus,
            published_at:
              finalStatus === "published" ? new Date().toISOString() : null,
            created_by: user!.id,
          })
          .select("id, title")
          .single();

        dbAlbum = (createdAlbum ?? null) as {
          id: string;
          title: string;
        } | null;
      }
    }

    let dbSong: { id: string; slug: string; title: string } | null = null;
    if (dbArtist) {
      const { data: existingSong } = await supabase
        .from("songs")
        .select("id, slug, title")
        .eq("spotify_track_id", track.id)
        .single();

      if (existingSong) {
        dbSong = existingSong as { id: string; slug: string; title: string };
      } else {
        const baseSlug = slugify(track.name);
        const uniqueSlug = await ensureUniqueSlug(supabase, "songs", baseSlug);
        const releaseDate = album
          ? normalizeReleaseDate(
              album.release_date,
              album.release_date_precision,
            )
          : "";

        const coverImage = pickImageUrl(album?.images, 0);

        const { data: createdSong } = await (supabase as any)
          .from("songs")
          .insert({
            artist_id: dbArtist.id,
            album_id: dbAlbum?.id ?? null,
            title: track.name,
            slug: uniqueSlug,
            spotify_track_id: track.id,
            release_date: releaseDate || null,
            duration_sec: Math.max(1, Math.round(track.duration_ms / 1000)),
            cover_image: coverImage,
            language: "en",
            status: finalStatus,
            created_from_spotify: true,
            published_at:
              finalStatus === "published" ? new Date().toISOString() : null,
            created_by: user!.id,
          })
          .select("id, slug, title")
          .single();

        dbSong = (createdSong ?? null) as {
          id: string;
          slug: string;
          title: string;
        } | null;
      }
    }

    if (dbSong && spotifyArtist?.genres?.length) {
      const tags = await ensureTagIds(supabase, spotifyArtist.genres);
      if (tags.length > 0) {
        await (supabase as any).from("song_tags").upsert(
          tags.map((tag) => ({ song_id: dbSong!.id, tag_id: tag.id })),
          { onConflict: "song_id,tag_id" },
        );
      }
    }

    return okResponse({
      track: {
        id: track.id,
        name: track.name,
        duration_ms: track.duration_ms,
        explicit: track.explicit ?? null,
        preview_url: track.preview_url ?? null,
        artists: track.artists ?? [],
        album: album
          ? {
              id: album.id,
              name: album.name,
              release_date: album.release_date,
              release_date_precision: album.release_date_precision,
              images: album.images ?? [],
            }
          : null,
        spotify_url: track.external_urls?.spotify ?? null,
        uri: track.uri ?? null,
      },
      db_artist: dbArtist,
      db_album: dbAlbum,
      db_song: dbSong,
    });
  } catch (error) {
    if (error instanceof SpotifyApiError) {
      return errorResponse(error.message, error.status);
    }
    return errorResponse("Failed to import track", 500);
  }
}
