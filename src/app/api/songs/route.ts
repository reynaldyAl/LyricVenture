import { createClient } from '@/lib/supabase/server'
import { okResponse, errorResponse, requireAuth, getPagination, paginatedResponse } from '@/lib/api-helpers'

// GET /api/songs?search=&artist_id=&tag=&page=&limit=
export async function GET(request: Request) {
  const supabase = await createClient()
  const { limit, page, offset, searchParams } = getPagination(request.url)

  const search    = searchParams.get('search')    ?? ''
  const artist_id = searchParams.get('artist_id') ?? ''
  const tag_slug  = searchParams.get('tag')       ?? ''

  let query = supabase
    .from('songs')
    .select(`
      id, title, slug, release_date, duration_sec,
      cover_image, view_count, status, spotify_track_id, language,
      artists ( id, name, slug ),
      albums  ( id, title, slug ),
      song_tags ( tags ( id, name, slug, color ) )
    `, { count: 'exact' })
    .eq('status', 'published')           // FIX — ganti is_published → status
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search)    query = query.ilike('title', `%${search}%`)
  if (artist_id) query = query.eq('artist_id', artist_id)

  const { data, error, count } = await query
  if (error) return errorResponse(error.message)

  // Filter by tag jika ada (post-filter karena nested relation)
  let filtered = data ?? []
  if (tag_slug) {
    filtered = filtered.filter((song: any) =>
      song.song_tags?.some((st: any) => st.tags?.slug === tag_slug)
    )
  }

  return paginatedResponse(filtered, count, page, limit)
}

// POST /api/songs
export async function POST(request: Request) {
  const supabase = await createClient()
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  // ✅ Cek role
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user!.id).single()
  const isAdmin = profile?.role === 'admin'

  const body = await request.json()
  const {
    artist_id, album_id, title, slug,
    spotify_track_id, youtube_url, release_date,
    duration_sec, cover_image, language,
    status, meta_title, meta_description, og_image,
    tag_ids,
  } = body

  if (!artist_id || !title?.trim() || !slug?.trim()) {
    return errorResponse('artist_id, title, and slug are required', 400)
  }

  // ✅ Admin → published langsung, Author → paksa draft
  const finalStatus = isAdmin ? (status ?? 'published') : 'draft'

  const db = supabase as any

  const { data: song, error } = await db
    .from('songs')
    .insert({
      artist_id,
      album_id:         album_id         ?? null,
      title:            title.trim(),
      slug:             slug.trim(),
      spotify_track_id: spotify_track_id ?? null,
      youtube_url:      youtube_url      ?? null,
      release_date:     release_date     ?? null,
      duration_sec:     duration_sec     ?? null,
      cover_image:      cover_image      ?? null,
      language:         language         ?? 'en',
      status:           finalStatus,
      published_at:     finalStatus === 'published' ? new Date().toISOString() : null,
      meta_title:       meta_title       ?? null,
      meta_description: meta_description ?? null,
      og_image:         og_image         ?? null,
      created_by:       user!.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return errorResponse('Song with this slug already exists', 409)
    return errorResponse(error.message)
  }

  if (tag_ids?.length > 0) {
    const songTags = tag_ids.map((tag_id: string) => ({ song_id: song.id, tag_id }))
    await (supabase as any).from('song_tags').insert(songTags)
  }

  return okResponse(song, 201)
}