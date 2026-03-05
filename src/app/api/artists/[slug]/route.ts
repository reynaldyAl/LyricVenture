import { createClient } from '@/lib/supabase/server'
import { okResponse, errorResponse, notFound, requireAuth, requireAdmin } from '@/lib/api-helpers'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params

  const { data, error } = await supabase
    .from('artists')
    .select(`
      *,
      albums ( id, title, slug, release_date, cover_image, album_type, total_tracks ),
      songs (
        id, title, slug, cover_image, release_date,
        duration_sec, status, view_count, spotify_track_id,
        song_tags ( tags ( id, name, slug, color ) )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) return notFound('Artist')
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
  delete body.id
  delete body.created_at
  delete body.created_by

  if (body.status === 'published' && !body.published_at) {
    body.published_at = new Date().toISOString()
  }
  if (body.status && body.status !== 'published') {
    body.published_at = null
  }

  const { data, error } = await supabase
    .from('artists')
    .update(body)
    .eq('slug', slug)
    .select()
    .single()

  if (error) return errorResponse(error.message)
  if (!data) return notFound('Artist')
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

  const { error } = await supabase.from('artists').delete().eq('slug', slug)
  if (error) return errorResponse(error.message)
  return okResponse({ success: true, message: 'Artist deleted' })
}