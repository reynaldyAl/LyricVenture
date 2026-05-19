-- ============================================
-- 22_analysis_view_count.sql
-- Add view_count for lyric analyses and increment function
-- ============================================

ALTER TABLE public.lyric_analyses
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_analyses_view_count
  ON public.lyric_analyses(view_count DESC);

CREATE OR REPLACE FUNCTION public.increment_analysis_view(analysis_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.lyric_analyses
  SET view_count = view_count + 1
  WHERE id = analysis_id AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
