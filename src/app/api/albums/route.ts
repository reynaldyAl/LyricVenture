import { createClient } from '@/lib/supabase/server'
import { okResponse, errorResponse, requireAuth, getPagination, paginatedResponse } from '@/lib/api-helpers'

// GET /api/albums?artist_id=&page=&limit=
export async function GET(request: Request) {
  const supabase = await createClient()
  const { limit, page, offset, searchParams } = getPagination(request.url)
  const artist_id = searchParams.get('artist_id')

  let query = supabase
    .from('albums')
    .select(`
      *,
      artists ( id, name, slug, cover_image )
    `, { count: 'exact' })
    .order('release_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (artist_id) query = query.eq('artist_id', artist_id)

  const { data, error, count } = await query
  if (error) return errorResponse(error.message)
  return paginatedResponse(data, count, page, limit)
}

// POST /api/albums
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
    artist_id, title, slug, release_date,
    cover_image, description, album_type, total_tracks,
    meta_title, meta_description, status,
  } = body

  if (!artist_id || !title?.trim() || !slug?.trim()) {
    return errorResponse('artist_id, title, and slug are required', 400)
  }

  const { data: artist } = await supabase
    .from('artists').select('id').eq('id', artist_id).single()
  if (!artist) return errorResponse('Artist not found', 404)

  // ✅ Admin → published langsung, Author → paksa draft
  const finalStatus = isAdmin ? (status ?? 'published') : 'draft'

  const db = supabase as any

  const { data, error } = await db
    .from('albums')
    .insert({
      artist_id,
      title:            title.trim(),
      slug:             slug.trim(),
      release_date:     release_date     ?? null,
      cover_image:      cover_image      ?? null,
      description:      description      ?? null,
      album_type:       album_type       ?? 'album',
      total_tracks:     total_tracks     ?? null,
      meta_title:       meta_title       ?? null,
      meta_description: meta_description ?? null,
      status:           finalStatus,
      published_at:     finalStatus === 'published' ? new Date().toISOString() : null,
      created_by:       user!.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return errorResponse('Album with this slug already exists', 409)
    return errorResponse(error.message)
  }

  return okResponse(data, 201)
}