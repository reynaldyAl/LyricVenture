-- ============================================
-- 06_lyric_analyses.sql
-- Lyric Analyses table
-- Satu analisis per lagu (one-to-one dengan songs)
-- ============================================

CREATE TABLE IF NOT EXISTS public.lyric_analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id      UUID NOT NULL UNIQUE REFERENCES public.songs(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  intro        TEXT,   -- pengantar singkat analisis
  theme        TEXT,   -- tema utama lagu
  background   TEXT,   -- sejarah & konteks penulisan lagu
  conclusion   TEXT,   -- kesimpulan/penutup analisis
  -- full_lyrics dihapus → pakai lyric_sections agar tidak redundan
  status       TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);