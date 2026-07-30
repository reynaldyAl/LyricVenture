-- ============================================
-- 13_seed_data.sql
-- Sample / Seed Data untuk development
-- Jalankan TERAKHIR setelah semua migration
-- ============================================

-- Tags
INSERT INTO public.tags (name, slug, color) VALUES
  ('Rock',         'rock',         '#ef4444'),
  ('Classic Rock', 'classic-rock', '#f97316'),
  ('Psychedelic',  'psychedelic',  '#a855f7'),
  ('60s',          '60s',          '#eab308'),
  ('Protest Song', 'protest-song', '#3b82f6')
ON CONFLICT (slug) DO NOTHING;

-- Artist
INSERT INTO public.artists (name, slug, bio, origin, formed_year, disbanded_year, genre, social_links)
VALUES (
  'The Beatles',
  'the-beatles',
  'The Beatles were an English rock band formed in Liverpool in 1960. With members John Lennon, Paul McCartney, George Harrison and Ringo Starr, they became widely regarded as the greatest and most influential act of the rock era.',
  'Liverpool, England',
  1960,
  1970,
  ARRAY['rock', 'pop', 'psychedelic rock', 'classic rock'],
  '{"spotify": "spotify:artist:3WrFJ7ztbogyGnTHbHJFl2", "wikipedia": "https://en.wikipedia.org/wiki/The_Beatles"}'
) ON CONFLICT (slug) DO NOTHING;

-- Album
INSERT INTO public.albums (artist_id, title, slug, release_date, album_type, total_tracks, description)
VALUES (
  (SELECT id FROM public.artists WHERE slug = 'the-beatles'),
  'Abbey Road',
  'abbey-road',
  '1969-09-26',
  'album',
  17,
  'Abbey Road is the eleventh studio album by the Beatles, released on 26 September 1969. It was the last album the group recorded together.'
) ON CONFLICT (slug) DO NOTHING;

-- Song
INSERT INTO public.songs (artist_id, album_id, title, slug, spotify_track_id, release_date, duration_sec, language, status, published_at)
VALUES (
  (SELECT id FROM public.artists WHERE slug = 'the-beatles'),
  (SELECT id FROM public.albums WHERE slug = 'abbey-road'),
  'Come Together',
  'come-together',
  '4cOdK2wGLETKBW3PvgPWqT',
  '1969-09-26',
  259,
  'en',
  'published',
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Song Tags
INSERT INTO public.song_tags (song_id, tag_id)
SELECT
  (SELECT id FROM public.songs WHERE slug = 'come-together'),
  (SELECT id FROM public.tags  WHERE slug = 'classic-rock')
ON CONFLICT DO NOTHING;

INSERT INTO public.song_tags (song_id, tag_id)
SELECT
  (SELECT id FROM public.songs WHERE slug = 'come-together'),
  (SELECT id FROM public.tags  WHERE slug = 'psychedelic')
ON CONFLICT DO NOTHING;