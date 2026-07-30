-- ============================================
-- 24_fix_rls_policies_status_column.sql
-- Fix RLS policies: is_published → status = 'published'
-- songs, lyric_analyses, lyric_sections, lyric_highlights
-- ============================================

-- ── SONGS ─────────────────────────────────
DROP POLICY IF EXISTS "songs_public_read" ON public.songs;
CREATE POLICY "songs_public_read" ON public.songs
  FOR SELECT USING (status = 'published');

-- ── LYRIC_ANALYSES ─────────────────────────
DROP POLICY IF EXISTS "analyses_public_read" ON public.lyric_analyses;
CREATE POLICY "analyses_public_read" ON public.lyric_analyses
  FOR SELECT USING (status = 'published');

-- ── LYRIC_SECTIONS ─────────────────────────
DROP POLICY IF EXISTS "sections_public_read" ON public.lyric_sections;
CREATE POLICY "sections_public_read" ON public.lyric_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lyric_analyses la
      WHERE la.id = analysis_id AND la.status = 'published'
    )
  );

-- ── LYRIC_HIGHLIGHTS ───────────────────────
DROP POLICY IF EXISTS "highlights_public_read" ON public.lyric_highlights;
CREATE POLICY "highlights_public_read" ON public.lyric_highlights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lyric_sections ls
      JOIN public.lyric_analyses la ON la.id = ls.analysis_id
      WHERE ls.id = section_id AND la.status = 'published'
    )
  );
