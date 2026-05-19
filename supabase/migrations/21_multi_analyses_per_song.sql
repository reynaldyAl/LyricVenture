-- ============================================
-- 21_multi_analyses_per_song.sql
-- Allow multiple analyses per song (unique per author)
-- ============================================

-- Drop one-to-one constraint on song_id
ALTER TABLE public.lyric_analyses
  DROP CONSTRAINT IF EXISTS lyric_analyses_song_id_key;

-- Enforce one analysis per author per song
CREATE UNIQUE INDEX IF NOT EXISTS idx_analyses_song_author_unique
  ON public.lyric_analyses(song_id, author_id);

-- Tighten RLS: only owner (or admin) can update, only owner can insert
DROP POLICY IF EXISTS analyses_auth_insert ON public.lyric_analyses;
DROP POLICY IF EXISTS analyses_auth_update ON public.lyric_analyses;

CREATE POLICY "analyses_auth_insert_own" ON public.lyric_analyses
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "analyses_auth_update_own" ON public.lyric_analyses
  FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    auth.uid() = author_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
