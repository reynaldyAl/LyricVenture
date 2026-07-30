-- ============================================
-- 05_songs.sql
-- Songs table + song_tags junction table
-- ============================================

CREATE TABLE IF NOT EXISTS public.songs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id        UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  album_id         UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  spotify_track_id TEXT,                       -- untuk Spotify embed player
  youtube_url      TEXT,                       -- fallback jika tidak ada Spotify
  release_date     DATE,
  duration_sec     INT,
  cover_image      TEXT,                       -- bisa override cover album
  language         TEXT NOT NULL DEFAULT 'en', -- bahasa lirik: 'en', 'id', dll
  view_count       INT NOT NULL DEFAULT 0,     -- untuk popular/trending
  status           TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  published_at     TIMESTAMPTZ,
  -- SEO
  meta_title       TEXT,
  meta_description TEXT,
  og_image         TEXT,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction table: many-to-many songs <-> tags
CREATE TABLE IF NOT EXISTS public.song_tags (
  song_id    UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (song_id, tag_id)
);