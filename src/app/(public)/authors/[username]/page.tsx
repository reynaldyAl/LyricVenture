import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

type ProfilePublic = Pick<Tables<"profiles">, "id" | "username" | "full_name" | "avatar_url" | "bio" | "role" | "created_at">

type AnalysisWithSong = {
  id:           string
  intro:        string | null
  theme:        string | null
  status:       string          // ✅ FIX 2 — ganti is_published → status
  published_at: string | null
  created_at:   string
  songs: {
    id:          string
    title:       string
    slug:        string
    cover_image: string | null
    artists: {
      id:   string
      name: string
      slug: string
    } | null
  } | null
}

interface Props {
  params: Promise<{ username: string }>;
}

async function getProfile(username: string) {
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, role, created_at")
    .eq("username", username)
    .single();

  const profile = profileData as ProfilePublic | null;
  if (!profile) return null;

  const { data: analysesData } = await supabase
    .from("lyric_analyses")
    .select(`
      id, intro, theme, status, published_at, created_at,
      songs (
        id, title, slug, cover_image,
        artists ( id, name, slug )
      )
    `)
    .eq("author_id", profile.id)
    .eq("status", "published")           // ✅ FIX 1 — ganti is_published → status
    .order("published_at", { ascending: false });

  const analyses = (analysesData ?? []) as AnalysisWithSong[]

  return { profile, analyses };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const result = await getProfile(username);
  if (!result) notFound();

  const { profile, analyses } = result;

  const displayName = profile.full_name || profile.username;
  const initial     = displayName.charAt(0).toUpperCase();
  const joinYear    = new Date(profile.created_at).getFullYear();

  return (
    <div style={{ background: "#F4F3F0", minHeight: "100vh" }}>
      <div className="container mx-auto px-5 py-12 max-w-3xl">

        {/* ── Profile Header ── */}
        <div
          className="p-8 mb-8 border border-[#E2E0DB]"
          style={{ background: "#FFFFFF" }}
        >
          <div className="flex items-start gap-6">

            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-2xl font-bold border-2 border-[#E2E0DB]"
              style={{ background: "#1A1917", color: "#F4F3F0" }}
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : initial}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold font-serif text-[#1A1917]">
                  {displayName}
                </h1>
                <span
                  className="text-[9px] font-semibold tracking-widest uppercase px-2 py-1 border"
                  style={{
                    borderColor: profile.role === "admin" ? "#3B5BDB" : "#C5C2BC",
                    color:       profile.role === "admin" ? "#3B5BDB" : "#8A8680",
                    background:  profile.role === "admin" ? "#EEF2FF" : "#F9F8F6",
                  }}
                >
                  {profile.role}
                </span>
              </div>

              <p className="text-sm text-[#8A8680] mt-1">@{profile.username}</p>
              <p className="text-xs text-[#A8A39D] mt-1">Member since {joinYear}</p>

              {profile.bio && (
                <p className="text-sm text-[#5A5651] leading-relaxed mt-3 max-w-lg">
                  {profile.bio}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-[#E8E5E0]">
                <div className="text-center">
                  <p className="text-xl font-bold text-[#1A1917]">{analyses.length}</p>
                  <p className="text-[10px] uppercase tracking-widest text-[#8A8680]">Analyses</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Analyses List ── */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#8A8680] mb-5">
            Published Analyses
          </p>

          {analyses.length === 0 ? (
            <div
              className="p-12 text-center border border-[#E2E0DB]"
              style={{ background: "#FFFFFF" }}
            >
              <p className="text-[#A8A39D] text-sm">No published analyses yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis) => {
                const song   = analysis.songs
                const artist = song?.artists

                return (
                  <Link
                    key={analysis.id}
                    href={`/analyses/${analysis.id}`}  // ✅ FIX 3 — link ke analysis bukan song
                    className="flex items-center gap-4 p-4 border border-[#E2E0DB] hover:border-[#3B5BDB] transition-colors group"
                    style={{ background: "#FFFFFF" }}
                  >
                    {/* Cover */}
                    <div
                      className="w-12 h-12 shrink-0 overflow-hidden border border-[#E2E0DB]"
                      style={{ background: "#E8E5E0" }}
                    >
                      {song?.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={song.cover_image}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#A8A39D] text-lg">
                          ♪
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1917] group-hover:text-[#3B5BDB] transition-colors truncate">
                        {song?.title ?? "—"}
                      </p>
                      <p className="text-xs text-[#8A8680] truncate mt-0.5">
                        {artist?.name ?? "—"}
                      </p>
                      {analysis.theme && (
                        <p className="text-[11px] text-[#A8A39D] mt-1 truncate italic">
                          Theme: {analysis.theme}
                        </p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-[#A8A39D]">
                        {analysis.published_at
                          ? new Date(analysis.published_at).toLocaleDateString("en-US", {
                              month: "short",
                              year:  "numeric",
                            })
                          : "—"}
                      </p>
                      <span className="text-[10px] text-[#3B5BDB] opacity-0 group-hover:opacity-100 transition-opacity">
                        Read →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}