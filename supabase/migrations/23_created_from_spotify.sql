-- ============================================
-- 23_created_from_spotify.sql
-- Add created_from_spotify flag for songs
-- ============================================

ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS created_from_spotify BOOLEAN NOT NULL DEFAULT FALSE;
