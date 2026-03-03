import { createClient } from '@/lib/supabase/server'
import { okResponse, errorResponse, notFound, requireAuth, requireAdmin } from '@/lib/api-helpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params

  const { data, error } = await supabase
    .from('songs')
    .select(`
      *,
      artists ( id, name, slug, cover_image, bio ),
      albums  ( id, title, slug, cover_image, release_date ),
      song_tags ( tags ( id, name, slug, color ) ),
      lyric_analyses (
        id, intro, theme, background, conclusion,
        status, author_id,
        lyric_sections (
          id, section_type, section_label, content, order_index,
          lyric_highlights (
            id, phrase, meaning, start_index, end_index,
            color_tag, highlight_type, order_index
          )
        )
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')           // ✅ FIX 5
    .single()

  if (error || !data) return notFound('Song')
  return okResponse(data)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params
  const { error: authError } = await requireAuth(supabase)
  if (authError) return authError

  const body = await request.json()
  const { tag_ids, id, created_at, created_by, artist_id, ...rest } = body

  // ✅ FIX 6 — ganti is_published → status
  if (rest.status === 'published' && !rest.published_at) {
    rest.published_at = new Date().toISOString()
  }

  const db = supabase as any

  const { data, error } = await db
    .from('songs')
    .update(rest)
    .eq('slug', slug)
    .select()
    .single()

  if (error) return errorResponse(error.message)
  if (!data) return notFound('Song')

  if (tag_ids !== undefined) {
    await (supabase as any).from('song_tags').delete().eq('song_id', data.id)
    if (tag_ids.length > 0) {
      await (supabase as any).from('song_tags').insert(
        tag_ids.map((tag_id: string) => ({ song_id: data.id, tag_id }))
      )
    }
  }

  return okResponse(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { error } = await supabase.from('songs').delete().eq('slug', slug)
  if (error) return errorResponse(error.message)
  return okResponse({ success: true, message: 'Song deleted' })
}