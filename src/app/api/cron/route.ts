import { NextResponse } from 'next/server'

// ── GET /api/cron ──────────────────────────────────────────────────────────
// Registry semua cron jobs yang tersedia di project ini
// Hanya tersedia informasi metadata, tidak mengeksekusi jobs
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const jobs = [
    {
      name: 'keep-alive',
      path: '/api/cron/keep-alive',
      description: 'Ping Supabase agar project tidak di-pause (free tier)',
      schedule: {
        docker:         '*/10 * * * *  (setiap 10 menit)',
        github_actions: '0 */6 * * *   (setiap 6 jam)',
      },
      method: 'GET',
      auth: 'Authorization: Bearer <CRON_SECRET>',
    },
    {
      name: 'cleanup-drafts',
      path: '/api/cron/cleanup-drafts',
      description: 'Hapus lyric_analyses draft yang lebih dari 90 hari tidak diupdate',
      schedule: {
        docker:         '0 3 * * 0    (setiap Minggu, jam 3 pagi)',
        github_actions: '0 3 * * 0    (setiap Minggu, jam 3 pagi)',
      },
      method: 'GET',
      auth: 'Authorization: Bearer <CRON_SECRET>',
    },
    {
      name: 'stats-snapshot',
      path: '/api/cron/stats-snapshot',
      description: 'Snapshot statistik harian: total songs, artists, albums, analyses',
      schedule: {
        docker:         '0 0 * * *    (setiap hari, tengah malam)',
        github_actions: '0 0 * * *    (setiap hari, tengah malam)',
      },
      method: 'GET',
      auth: 'Authorization: Bearer <CRON_SECRET>',
    },
  ]

  return NextResponse.json({
    ok: true,
    total: jobs.length,
    base_url: baseUrl,
    jobs,
    note: 'Semua jobs memerlukan header Authorization: Bearer <CRON_SECRET>',
  })
}
