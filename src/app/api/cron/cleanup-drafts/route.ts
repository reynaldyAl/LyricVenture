import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Auth Guard ─────────────────────────────────────────────────────────────
function validateCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return process.env.NODE_ENV === 'development'
  return authHeader === `Bearer ${cronSecret}`
}

// ── GET /api/cron/cleanup-drafts ────────────────────────────────────────────
// Menghapus draft lyric_analyses yang sudah lebih dari 90 hari dan tidak pernah dipublish
// Aman: hanya hapus is_published=false & updated lebih dari 90 hari lalu
export async function GET(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Ambil jumlah draft lama sebelum hapus (untuk logging)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const cutoff = ninetyDaysAgo.toISOString()

    const { count: beforeCount } = await supabase
      .from('lyric_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', false)
      .lt('updated_at', cutoff)

    // Hapus draft lama (lebih dari 90 hari tidak diupdate)
    const { error: deleteError } = await supabase
      .from('lyric_analyses')
      .delete()
      .eq('is_published', false)
      .lt('updated_at', cutoff)

    if (deleteError) throw new Error(deleteError.message)

    const duration = Date.now() - startTime

    return NextResponse.json({
      ok: true,
      job: 'cleanup-drafts',
      timestamp,
      duration_ms: duration,
      deleted_count: beforeCount ?? 0,
      cutoff_date: cutoff,
    })
  } catch (err) {
    console.error('[cron/cleanup-drafts] Error:', err)
    return NextResponse.json(
      {
        ok: false,
        job: 'cleanup-drafts',
        timestamp,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
