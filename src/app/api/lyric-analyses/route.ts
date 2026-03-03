import { createClient } from '@/lib/supabase/server'
import {
  okResponse, errorResponse, requireAuth,
  getPagination, paginatedResponse,
} from '@/lib/api-helpers'
import type { InsertTables } from '@/lib/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { limit, page, offset, searchParams } = getPagination(request.url)
  const song_id = searchParams.get('song_id')

  let query = supabase
    .from('lyric_analyses')
    .select(`
      id, intro, theme, status, published_at, created_at,
      songs (
        id, title, slug,
        artists ( id, name, slug )
      )
    `, { count: 'exact' })
    .eq('status', 'published')           // ✅ FIX 1 — ganti is_published → status
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (song_id) query = query.eq('song_id', song_id)

  const { data, error, count } = await query
  if (error) return errorResponse(error.message)
  return paginatedResponse(data, count, page, limit)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const body = await request.json()
  const { song_id, intro, theme, background, conclusion, status } = body  // ✅ FIX 2

  if (!song_id) return errorResponse('song_id is required', 400)

  const { data: song } = await supabase
    .from('songs').select('id').eq('id', song_id).single()
  if (!song) return errorResponse('Song not found', 404)

  const { data: existing } = await supabase
    .from('lyric_analyses').select('id').eq('song_id', song_id).single()
  if (existing) return errorResponse('Lyric analysis already exists for this song', 409)

  const insert = {
    song_id,
    author_id:    user!.id,
    intro:        intro      ?? null,
    theme:        theme      ?? null,
    background:   background ?? null,
    conclusion:   conclusion ?? null,
    status:       status     ?? 'draft',                              // ✅ FIX 3
    published_at: status === 'published' ? new Date().toISOString() : null,  // ✅ FIX 4
  }

  const { data, error } = await supabase
    .from('lyric_analyses').insert(insert as any).select().single()

  if (error) return errorResponse(error.message)
  return okResponse(data, 201)
}