-- ============================================
-- 11_functions.sql
-- Custom PostgreSQL Functions
-- ============================================

-- Atomic increment view count saat user buka halaman lagu
-- Dipanggil dari API route Next.js
CREATE OR REPLACE FUNCTION public.increment_song_view(song_slug TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.songs
  SET view_count = view_count + 1
  WHERE slug = song_slug AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;