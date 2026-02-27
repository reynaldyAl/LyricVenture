// ✅ Server Component — tidak ada "use client"
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import DashboardTabs from "@/components/admin/DashboardTabs";

type Role = "admin" | "author";

async function getDashboardData(role: Role, userId: string) {
  const supabase = await createClient();

  const [
    { count: songsCount },
    { count: artistsCount },
    { count: albumsCount },
    { count: analysesCount },
    { count: publishedSongs },
    { count: publishedAnalyses },
    { count: pendingSongs },
    { count: pendingAnalyses },
    { data: recentSongs },
    { data: recentAnalyses },
    { data: recentArtists },
  ] = await Promise.all([
    // Total counts
    role === "admin"
      ? supabase.from("songs").select("*", { count: "exact", head: true })
      : supabase.from("songs").select("*", { count: "exact", head: true }).eq("created_by", userId),

    role === "admin"
      ? supabase.from("artists").select("*", { count: "exact", head: true })
      : supabase.from("artists").select("*", { count: "exact", head: true }).eq("created_by", userId),

    role === "admin"
      ? supabase.from("albums").select("*", { count: "exact", head: true })
      : supabase.from("albums").select("*", { count: "exact", head: true }).eq("created_by", userId),

    role === "admin"
      ? supabase.from("lyric_analyses").select("*", { count: "exact", head: true })
      : supabase.from("lyric_analyses").select("*", { count: "exact", head: true }).eq("author_id", userId), // ✅ fix: author_id

    // Published counts — pakai status bukan is_published
    role === "admin"
      ? supabase.from("songs").select("*", { count: "exact", head: true }).eq("status", "published") // ✅ fix
      : supabase.from("songs").select("*", { count: "exact", head: true }).eq("status", "published").eq("created_by", userId),

    role === "admin"
      ? supabase.from("lyric_analyses").select("*", { count: "exact", head: true }).eq("status", "published") // ✅ fix
      : supabase.from("lyric_analyses").select("*", { count: "exact", head: true }).eq("status", "published").eq("author_id", userId), // ✅ fix

    // Pending counts — baru
    role === "admin"
      ? supabase.from("songs").select("*", { count: "exact", head: true }).eq("status", "pending")
      : supabase.from("songs").select("*", { count: "exact", head: true }).eq("status", "pending").eq("created_by", userId),

    role === "admin"
      ? supabase.from("lyric_analyses").select("*", { count: "exact", head: true }).eq("status", "pending")
      : supabase.from("lyric_analyses").select("*", { count: "exact", head: true }).eq("status", "pending").eq("author_id", userId),

    // Recent songs
    role === "admin"
      ? supabase.from("songs").select("id, title, slug, status, created_at, artists ( name )").order("created_at", { ascending: false }).limit(8) // ✅ fix: status
      : supabase.from("songs").select("id, title, slug, status, created_at, artists ( name )").eq("created_by", userId).order("created_at", { ascending: false }).limit(8),

    // Recent analyses
    role === "admin"
      ? supabase.from("lyric_analyses").select("id, theme, status, created_at, songs ( title, slug )").order("created_at", { ascending: false }).limit(8) // ✅ fix: status
      : supabase.from("lyric_analyses").select("id, theme, status, created_at, songs ( title, slug )").eq("author_id", userId).order("created_at", { ascending: false }).limit(8), // ✅ fix: author_id

    // Recent artists
    role === "admin"
      ? supabase.from("artists").select("id, name, slug, origin, is_active, created_at").order("created_at", { ascending: false }).limit(6)
      : supabase.from("artists").select("id, name, slug, origin, is_active, created_at").eq("created_by", userId).order("created_at", { ascending: false }).limit(6),
  ]);

  return {
    counts: {
      songs:             songsCount        ?? 0,
      artists:           artistsCount      ?? 0,
      albums:            albumsCount       ?? 0,
      analyses:          analysesCount     ?? 0,
      publishedSongs:    publishedSongs    ?? 0,
      publishedAnalyses: publishedAnalyses ?? 0,
      pendingSongs:      pendingSongs      ?? 0,
      pendingAnalyses:   pendingAnalyses   ?? 0,
    },
    recentSongs:    recentSongs    ?? [],
    recentAnalyses: recentAnalyses ?? [],
    recentArtists:  recentArtists  ?? [],
  };
}

function StatCard({
  title, value, sub, icon, href,
}: {
  title: string; value: number; sub: string; icon: string; href: string;
}) {
  return (
    <Link href={href}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-1 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wide group-hover:text-zinc-300 transition-colors">
            {title}
          </CardTitle>
          <span className="text-lg text-zinc-600 group-hover:text-indigo-400 transition-colors">
            {icon}
          </span>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-bold text-zinc-100 font-serif tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = ((profileData as { role: Role } | null)?.role ?? "author") as Role;

  const { counts, recentSongs, recentAnalyses, recentArtists } =
    await getDashboardData(role, user.id);

  const draftSongs    = counts.songs    - counts.publishedSongs    - counts.pendingSongs;
  const draftAnalyses = counts.analyses - counts.publishedAnalyses - counts.pendingAnalyses;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-serif">
            {role === "admin" ? "Overview" : "My Dashboard"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {role === "admin"
              ? "Welcome back to LyricVenture Admin."
              : "Your content and contributions."}
          </p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs hidden sm:flex">
          <Link href={role === "admin" ? "/dashboard/songs/new" : "/dashboard/analyses/new"}>
            {role === "admin" ? "+ New Song" : "+ New Analysis"}
          </Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Songs"          value={counts.songs}    icon="♫" href="/dashboard/songs"    sub={`${counts.publishedSongs} published · ${counts.pendingSongs} pending`} />
        <StatCard title="Artists"        value={counts.artists}  icon="♪" href="/dashboard/artists"  sub="registered musicians" />
        <StatCard title="Albums"         value={counts.albums}   icon="◎" href="/dashboard/albums"   sub="across all artists" />
        <StatCard title="Lyric Analyses" value={counts.analyses} icon="✦" href="/dashboard/analyses" sub={`${counts.publishedAnalyses} published · ${counts.pendingAnalyses} pending`} />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Published Songs",    value: counts.publishedSongs,    color: "text-emerald-400" },
          { label: "Pending Songs",      value: counts.pendingSongs,      color: "text-amber-400" },
          { label: "Published Analyses", value: counts.publishedAnalyses, color: "text-emerald-400" },
          { label: "Pending Analyses",   value: counts.pendingAnalyses,   color: "text-amber-400" },
        ].map((item) => (
          <div key={item.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-4 py-3">
            <p className={`text-xl font-bold font-serif ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <Separator className="bg-zinc-800" />

      <DashboardTabs
        recentSongs={recentSongs as any}
        recentAnalyses={recentAnalyses as any}
        recentArtists={recentArtists as any}
      />

      {/* Quick Actions */}
      <Card className="bg-zinc-900/50 border-zinc-800/60">
        <CardContent className="px-5 py-4">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {(role === "admin"
              ? [
                  { label: "+ Artist",   href: "/dashboard/artists/new" },
                  { label: "+ Album",    href: "/dashboard/albums/new" },
                  { label: "+ Song",     href: "/dashboard/songs/new" },
                  { label: "+ Analysis", href: "/dashboard/analyses/new" },
                  { label: "+ Tag",      href: "/dashboard/tags/new" },
                ]
              : [
                  { label: "+ Artist",   href: "/dashboard/artists/new" },
                  { label: "+ Album",    href: "/dashboard/albums/new" },
                  { label: "+ Song",     href: "/dashboard/songs/new" },
                  { label: "+ Analysis", href: "/dashboard/analyses/new" },
                ]
            ).map((action) => (
              <Button
                key={action.href}
                variant="outline"
                size="sm"
                asChild
                className="h-7 text-xs border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600"
              >
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}