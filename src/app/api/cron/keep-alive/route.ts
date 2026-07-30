import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Auth Guard ─────────────────────────────────────────────────────────────
function validateCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    // If no secret configured, only allow in development
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

// ── GET /api/cron/keep-alive ───────────────────────────────────────────────
// Melakukan query ringan ke Supabase agar project tidak di-pause (free tier)
// Harus dipanggil secara berkala (rekomendasi: setiap 6-10 jam)
export async function GET(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    // Gunakan createClient langsung (tidak butuh cookie/session)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Query ringan: ambil jumlah published songs
    const { count, error } = await supabase
      .from('songs')
      .select('id', { count: 'exact', head: true })

    if (error) throw new Error(error.message)

    const duration = Date.now() - startTime

    return NextResponse.json({
      ok: true,
      job: 'keep-alive',
      timestamp,
      duration_ms: duration,
      supabase_ping: 'ok',
      songs_count: count ?? 0,
    })
  } catch (err) {
    const duration = Date.now() - startTime
    console.error('[cron/keep-alive] Error:', err)

    return NextResponse.json(
      {
        ok: false,
        job: 'keep-alive',
        timestamp,
        duration_ms: duration,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
