import { createClient } from '@/lib/supabase/server'
import { okResponse, errorResponse, notFound, requireAuth, requireAdmin } from '@/lib/api-helpers'

// GET /api/albums/[slug]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params

  const { data, error } = await supabase
    .from('albums')
    .select(`
      *,
      artists ( id, name, slug, cover_image ),
      songs (
        id, title, slug, duration_sec, status,
        view_count, spotify_track_id, cover_image,
        song_tags ( tags ( id, name, slug, color ) )
      )
    `)
    .eq('slug', slug)
    .single()

  if (error || !data) return notFound('Album')
  return okResponse(data)
}

// PUT /api/albums/[slug]
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

  const db = supabase as any  // ✅ fix v2.97

  const { data, error } = await db
    .from('albums')
    .update(body)
    .eq('slug', slug)
    .select()
    .single()

  if (error) return errorResponse(error.message)
  if (!data)  return notFound('Album')
  return okResponse(data)
}

// DELETE /api/albums/[slug] — admin only
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { error } = await supabase.from('albums').delete().eq('slug', slug)
  if (error) return errorResponse(error.message)
  return okResponse({ success: true, message: 'Album deleted' })
}