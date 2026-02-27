import { createClient } from '@/lib/supabase/server'
import { okResponse, notFound } from '@/lib/api-helpers'
import type { Tables } from '@/lib/types'

type ProfilePublic = Pick<Tables<'profiles'>, 'id' | 'username' | 'full_name' | 'avatar_url' | 'bio' | 'role' | 'created_at'>

// GET /api/profiles/[username] — public profile
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const db = (await createClient()) as any  // fix v2.97 — cast sekali di atas

  const { username } = await params

  // Ambil profile
  const { data: profileData, error } = await db
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio, role, created_at')
    .eq('username', username)
    .single()

  // Cast eksplisit
  const profile = profileData as ProfilePublic | null
  if (error || !profile) return notFound('Profile')

  // Ambil lyric analyses yang dipublish oleh author ini
  const { data: analysesData } = await db
    .from('lyric_analyses')
    .select(`
      id, intro, theme, is_published, published_at, created_at,
      songs (
        id, title, slug, cover_image,
        artists ( id, name, slug )
      )
    `)
    .eq('author_id', profile.id)   // profile.id sekarang terbaca — tidak lagi never
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  return okResponse({
    profile,
    analyses:  analysesData ?? [],
    stats: {
      total_analyses: analysesData?.length ?? 0,
    }
  })
}