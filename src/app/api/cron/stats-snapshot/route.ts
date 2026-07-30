import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Auth Guard ─────────────────────────────────────────────────────────────
function validateCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return process.env.NODE_ENV === 'development'
  return authHeader === `Bearer ${cronSecret}`
}

// ── GET /api/cron/stats-snapshot ────────────────────────────────────────────
// Mengumpulkan statistik snapshot harian: total songs, artists, albums, analyses
// Berguna untuk dashboard analytics dan monitoring growth
export async function GET(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Paralel queries untuk efisiensi
    const [songsRes, artistsRes, albumsRes, analysesRes] = await Promise.all([
      supabase.from('songs').select('id', { count: 'exact', head: true }),
      supabase.from('artists').select('id', { count: 'exact', head: true }),
      supabase.from('albums').select('id', { count: 'exact', head: true }),
      supabase
        .from('lyric_analyses')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),  // ✅ pakai status, bukan is_published
    ])

    // Cek errors
    const errors = [songsRes, artistsRes, albumsRes, analysesRes]
      .filter((r) => r.error)
      .map((r) => r.error?.message)

    if (errors.length > 0) {
      throw new Error(`Query errors: ${errors.join(', ')}`)
    }

    const snapshot = {
      songs:     songsRes.count    ?? 0,
      artists:   artistsRes.count  ?? 0,
      albums:    albumsRes.count   ?? 0,
      analyses:  analysesRes.count ?? 0,
    }

    const duration = Date.now() - startTime

    console.log('[cron/stats-snapshot]', timestamp, snapshot)

    return NextResponse.json({
      ok: true,
      job: 'stats-snapshot',
      timestamp,
      duration_ms: duration,
      snapshot,
    })
  } catch (err) {
    console.error('[cron/stats-snapshot] Error:', err)
    return NextResponse.json(
      {
        ok: false,
        job: 'stats-snapshot',
        timestamp,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
