const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

type SpotifyErrorPayload = {
  error?: {
    status?: number;
    message?: string;
  };
};

export class SpotifyApiError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status = 500, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function getClientCredentials() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SpotifyApiError("Spotify credentials are not configured", 500);
  }

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return { clientId, clientSecret, encoded };
}

function isTokenValid(
  cache: { accessToken: string; expiresAt: number } | null,
) {
  if (!cache) return false;
  return Date.now() < cache.expiresAt;
}

async function getAccessToken(): Promise<string> {
  if (isTokenValid(tokenCache)) {
    return tokenCache!.accessToken;
  }

  const { encoded } = getClientCredentials();

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${encoded}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  const payload = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!res.ok || !payload.access_token) {
    const message =
      payload.error_description ||
      payload.error ||
      "Failed to obtain Spotify token";
    throw new SpotifyApiError(message, res.status);
  }

  const expiresInMs = Math.max((payload.expires_in ?? 3600) - 60, 60) * 1000;
  tokenCache = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + expiresInMs,
  };

  return tokenCache.accessToken;
}

function parseRetryAfterSeconds(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isNaN(seconds)) return null;
  return Math.max(seconds, 1);
}

function normalizeSpotifyError(
  payload: SpotifyErrorPayload,
  fallbackMessage: string,
) {
  const message = payload?.error?.message || fallbackMessage;
  const status = payload?.error?.status ?? 500;
  return { message, status };
}

async function delay(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchSpotify<T>(path: string): Promise<T> {
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const accessToken = await getAccessToken();

    const res = await fetch(`${SPOTIFY_API_URL}/${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.status === 401 && attempt < maxRetries) {
      tokenCache = null;
      continue;
    }

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfterSeconds = parseRetryAfterSeconds(
        res.headers.get("Retry-After"),
      );
      const backoffMs = retryAfterSeconds
        ? retryAfterSeconds * 1000
        : Math.pow(2, attempt) * 500;
      await delay(backoffMs);
      continue;
    }

    if (!res.ok) {
      const payload = (await res
        .json()
        .catch(() => ({}))) as SpotifyErrorPayload;
      const retryAfterSeconds =
        parseRetryAfterSeconds(res.headers.get("Retry-After")) ?? undefined;
      const { message, status } = normalizeSpotifyError(
        payload,
        "Spotify request failed",
      );
      throw new SpotifyApiError(message, status, retryAfterSeconds);
    }

    return (await res.json()) as T;
  }

  throw new SpotifyApiError("Spotify request failed after retries", 500);
}

const SPOTIFY_ID_REGEX = /^[A-Za-z0-9]{10,}$/;

export function extractSpotifyId(
  input: string,
  type: "artist" | "album" | "track",
) {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (SPOTIFY_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  const uriMatch = trimmed.match(new RegExp(`spotify:${type}:([A-Za-z0-9]+)`));
  if (uriMatch?.[1]) return uriMatch[1];

  const urlMatch = trimmed.match(
    /open\.spotify\.com\/(artist|album|track)\/([A-Za-z0-9]+)/,
  );
  if (urlMatch?.[1] === type && urlMatch?.[2]) return urlMatch[2];

  return null;
}
