import { createClient } from '@/lib/supabase/server'
import { okResponse, errorResponse, requireAuth, getPagination, paginatedResponse } from '@/lib/api-helpers'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { limit, page, offset, searchParams } = getPagination(request.url)
  const search = searchParams.get('search') ?? ''

  let query = supabase
    .from('artists')
    .select('id, name, slug, origin, formed_year, cover_image, genre, is_active', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1)

  if (search) query = query.ilike('name', `%${search}%`)

  const { data, error, count } = await query
  if (error) return errorResponse(error.message)
  return paginatedResponse(data, count, page, limit)
}

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
    name, slug, bio, origin, formed_year, disbanded_year,
    genre, cover_image, banner_image, social_links,
    meta_title, meta_description, status,
  } = body

  if (!name?.trim() || !slug?.trim()) {
    return errorResponse('name and slug are required', 400)
  }

  // ✅ Admin → published langsung, Author → paksa draft
  const finalStatus = isAdmin ? (status ?? 'published') : 'draft'

  const db = supabase as any

  const { data, error } = await db
    .from('artists')
    .insert({
      name:             name.trim(),
      slug:             slug.trim(),
      bio,
      origin,
      formed_year:      formed_year      ?? null,
      disbanded_year:   disbanded_year   ?? null,
      genre:            genre            ?? [],
      cover_image:      cover_image      ?? null,
      banner_image:     banner_image     ?? null,
      social_links:     social_links     ?? {},
      meta_title:       meta_title       ?? null,
      meta_description: meta_description ?? null,
      status:           finalStatus,
      published_at:     finalStatus === 'published' ? new Date().toISOString() : null,
      created_by:       user!.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return errorResponse('Artist with this slug already exists', 409)
    return errorResponse(error.message)
  }

  return okResponse(data, 201)
}