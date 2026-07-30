-- ============================================
-- 10_rls_policies.sql
-- Row Level Security Policies
-- Guest bisa baca konten published TANPA login
-- Auth user (admin/author) bisa akses lebih luas
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyric_analyses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyric_sections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lyric_highlights ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──────────────────────────────
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── TAGS ──────────────────────────────────
DROP POLICY IF EXISTS "tags_public_read" ON public.tags;
CREATE POLICY "tags_public_read" ON public.tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "tags_auth_insert" ON public.tags;
CREATE POLICY "tags_auth_insert" ON public.tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tags_auth_update" ON public.tags;
CREATE POLICY "tags_auth_update" ON public.tags
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "tags_auth_delete" ON public.tags;
CREATE POLICY "tags_auth_delete" ON public.tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── ARTISTS ───────────────────────────────
DROP POLICY IF EXISTS "artists_public_read" ON public.artists;
CREATE POLICY "artists_public_read" ON public.artists
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "artists_auth_read_all" ON public.artists;
CREATE POLICY "artists_auth_read_all" ON public.artists
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "artists_auth_insert" ON public.artists;
CREATE POLICY "artists_auth_insert" ON public.artists
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "artists_auth_update" ON public.artists;
CREATE POLICY "artists_auth_update" ON public.artists
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "artists_auth_delete" ON public.artists;
CREATE POLICY "artists_auth_delete" ON public.artists
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── ALBUMS ────────────────────────────────
DROP POLICY IF EXISTS "albums_public_read" ON public.albums;
CREATE POLICY "albums_public_read" ON public.albums
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "albums_auth_insert" ON public.albums;
CREATE POLICY "albums_auth_insert" ON public.albums
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "albums_auth_update" ON public.albums;
CREATE POLICY "albums_auth_update" ON public.albums
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "albums_auth_delete" ON public.albums;
CREATE POLICY "albums_auth_delete" ON public.albums
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── SONGS ─────────────────────────────────
DROP POLICY IF EXISTS "songs_public_read" ON public.songs;
CREATE POLICY "songs_public_read" ON public.songs
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "songs_auth_read_all" ON public.songs;
CREATE POLICY "songs_auth_read_all" ON public.songs
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "songs_auth_insert" ON public.songs;
CREATE POLICY "songs_auth_insert" ON public.songs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "songs_auth_update" ON public.songs;
CREATE POLICY "songs_auth_update" ON public.songs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "songs_auth_delete" ON public.songs;
CREATE POLICY "songs_auth_delete" ON public.songs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── SONG_TAGS ─────────────────────────────
DROP POLICY IF EXISTS "song_tags_public_read" ON public.song_tags;
CREATE POLICY "song_tags_public_read" ON public.song_tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "song_tags_auth_insert" ON public.song_tags;
CREATE POLICY "song_tags_auth_insert" ON public.song_tags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "song_tags_auth_delete" ON public.song_tags;
CREATE POLICY "song_tags_auth_delete" ON public.song_tags
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ── LYRIC_ANALYSES ─────────────────────────
DROP POLICY IF EXISTS "analyses_public_read" ON public.lyric_analyses;
CREATE POLICY "analyses_public_read" ON public.lyric_analyses
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "analyses_auth_read_all" ON public.lyric_analyses;
CREATE POLICY "analyses_auth_read_all" ON public.lyric_analyses
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "analyses_auth_insert" ON public.lyric_analyses;
CREATE POLICY "analyses_auth_insert" ON public.lyric_analyses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "analyses_auth_update" ON public.lyric_analyses;
CREATE POLICY "analyses_auth_update" ON public.lyric_analyses
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "analyses_auth_delete" ON public.lyric_analyses;
CREATE POLICY "analyses_auth_delete" ON public.lyric_analyses
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── LYRIC_SECTIONS ─────────────────────────
DROP POLICY IF EXISTS "sections_public_read" ON public.lyric_sections;
CREATE POLICY "sections_public_read" ON public.lyric_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lyric_analyses la
      WHERE la.id = analysis_id AND la.status = 'published'
    )
  );

DROP POLICY IF EXISTS "sections_auth_all" ON public.lyric_sections;
CREATE POLICY "sections_auth_all" ON public.lyric_sections
  FOR ALL USING (auth.uid() IS NOT NULL);

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

DROP POLICY IF EXISTS "highlights_auth_all" ON public.lyric_highlights;
CREATE POLICY "highlights_auth_all" ON public.lyric_highlights
  FOR ALL USING (auth.uid() IS NOT NULL);

