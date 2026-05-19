import { createClient } from '@/lib/supabase/server'
import {
  okResponse, errorResponse, notFound,
  requireAuth, requireAdmin,
} from '@/lib/api-helpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('lyric_analyses')
    .select(`
      *,
      songs (
        id, title, slug, spotify_track_id, duration_sec, cover_image,
        artists ( id, name, slug, cover_image )
      ),
      lyric_sections (
        id, section_type, section_label, content, order_index,
        lyric_highlights (
          id, phrase, meaning, start_index, end_index,
          color_tag, highlight_type, order_index
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) return notFound('Lyric analysis')
  return okResponse(data)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const { user, error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  const { data: ownerRow, error: ownerError } = await supabase
    .from('lyric_analyses')
    .select('author_id')
    .eq('id', id)
    .single()

  if (ownerError || !ownerRow) return notFound('Lyric analysis')
  if (!isAdmin && ownerRow.author_id !== user!.id) {
    return errorResponse('Forbidden — not your analysis', 403)
  }

  const body = await request.json()
  const { id: _id, song_id, created_at, author_id, ...rest } = body

  // ✅ FIX 5 — ganti is_published → status
  if (rest.status === 'published' && !rest.published_at) {
    rest.published_at = new Date().toISOString()
  }

  const db = supabase as any  // ✅ fix v2.97

  const { data, error } = await db
    .from('lyric_analyses')
    .update(rest)
    .eq('id', id)
    .select()
    .single()

  if (error) return errorResponse(error.message)
  if (!data)  return notFound('Lyric analysis')
  return okResponse(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { error } = await supabase.from('lyric_analyses').delete().eq('id', id)
  if (error) return errorResponse(error.message)
  return okResponse({ success: true, message: 'Lyric analysis deleted' })
}