-- ============================================
-- 23_fix_indexes_status_column.sql
-- Fix indexes: is_published → status column
-- songs dan lyric_analyses sudah pakai status (TEXT),
-- bukan is_published (BOOLEAN) lagi
-- ============================================

-- Drop index lama yang pakai is_published (sudah tidak ada kolomnya)
DROP INDEX IF EXISTS public.idx_songs_published;
DROP INDEX IF EXISTS public.idx_analyses_published;

-- Buat ulang index dengan kolom status yang benar
CREATE INDEX IF NOT EXISTS idx_songs_status
  ON public.songs(status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_status
  ON public.lyric_analyses(status);
