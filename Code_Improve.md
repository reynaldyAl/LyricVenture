<!-- this is for API CODE FIX TO IMPROVE -->
<!-- Albums: General - [Slug] -->
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

  const body = await request.json()
  const {
    artist_id, title, slug, release_date,
    cover_image, description, album_type, total_tracks,
    meta_title, meta_description,
  } = body

  if (!artist_id || !title?.trim() || !slug?.trim()) {
    return errorResponse('artist_id, title, and slug are required', 400)
  }

  const { data: artist } = await supabase
    .from('artists').select('id').eq('id', artist_id).single()
  if (!artist) return errorResponse('Artist not found', 404)

  const db = supabase as any  // ✅ fix v2.97

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

<!-- Albums [Slug] -->
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

<!-- Artist General -->
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

  const body = await request.json()
  const {
    name, slug, bio, origin, formed_year, disbanded_year,
    genre, cover_image, banner_image, social_links,
    meta_title, meta_description,
  } = body

  if (!name?.trim() || !slug?.trim()) {
    return errorResponse('name and slug are required', 400)
  }

  const db = supabase as any  // ✅ fix v2.97

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

<!-- Artist [Slug] -->
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

  const db = supabase as any  // ✅ fix v2.97

  const { data, error } = await db
    .from('artists')
    .update(body)
    .eq('slug', slug)
    .select()
    .single()

  if (error) return errorResponse(error.message)
  if (!data)  return notFound('Artist')
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

<!-- Lyric Analyses General -->
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

<!-- Lyric Analyses [id] -->
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
  const { error: authError } = await requireAuth(supabase)
  if (authError) return authError

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

<!-- songs general -->
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

  const db = supabase as any  // ✅ fix v2.97

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
      status:           status           ?? 'draft',  // ✅ FIX — default ke draft, bukan langsung published
      published_at:     status          === 'published' ? new Date().toISOString() : null,
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

  // Insert tags jika ada
  if (tag_ids?.length > 0) {
    const songTags = tag_ids.map((tag_id: string) => ({ song_id: song.id, tag_id }))
    await (supabase as any).from('song_tags').insert(songTags)
  }

  return okResponse(song, 201)
}

<!-- songs [slug] -->
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
