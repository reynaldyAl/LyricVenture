"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";

type RecentSong = {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  created_at: string;
  artists: { name: string } | null;
};

type RecentAnalysis = {
  id: string;
  theme: string | null;
  status: string | null;
  created_at: string;
  songs: { title: string; slug: string } | null;
};

type RecentArtist = {
  id: string;
  name: string;
  slug: string;
  origin: string | null;
  is_active: boolean;
  created_at: string;
};

interface DashboardTabsProps {
  recentSongs:    RecentSong[];
  recentAnalyses: RecentAnalysis[];
  recentArtists:  RecentArtist[];
  role:           "admin" | "author"; // ✅ tambah role
}

const STATUS_COLORS: Record<string, string> = {
  published: "bg-emerald-900/40 text-emerald-400 border-emerald-800/60",
  pending:   "bg-amber-900/40 text-amber-400 border-amber-800/60",
  rejected:  "bg-red-900/40 text-red-400 border-red-800/60",
  draft:     "bg-zinc-800 text-zinc-500 border-zinc-700",
};

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "draft";
  return (
    <Badge className={`text-[10px] h-5 px-1.5 border capitalize hover:opacity-100 ${STATUS_COLORS[s] ?? STATUS_COLORS.draft}`}>
      {s}
    </Badge>
  );
}

export default function DashboardTabs({
  recentSongs,
  recentAnalyses,
  recentArtists,
  role,
}: DashboardTabsProps) {

  // Pending items untuk admin
  const pendingSongs    = recentSongs.filter((s) => s.status === "pending");
  const pendingAnalyses = recentAnalyses.filter((a) => a.status === "pending");
  const totalPending    = pendingSongs.length + pendingAnalyses.length;

  return (
    <Tabs defaultValue={role === "admin" && totalPending > 0 ? "pending" : "songs"} className="space-y-4">
      <TabsList className="bg-zinc-900 border border-zinc-800 h-8">
        {/* Tab Pending Reviews — hanya admin */}
        {role === "admin" && (
          <TabsTrigger value="pending"
            className="text-xs h-6 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400 relative">
            Pending Reviews
            {totalPending > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                {totalPending}
              </span>
            )}
          </TabsTrigger>
        )}
        <TabsTrigger value="songs"
          className="text-xs h-6 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400">
          Recent Songs
        </TabsTrigger>
        <TabsTrigger value="analyses"
          className="text-xs h-6 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400">
          Recent Analyses
        </TabsTrigger>
        <TabsTrigger value="artists"
          className="text-xs h-6 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 text-zinc-400">
          Artists
        </TabsTrigger>
      </TabsList>

      {/* ── Pending Reviews (admin only) ── */}
      {role === "admin" && (
        <TabsContent value="pending">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="px-5 py-4">
              <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">
                Pending Reviews
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Content waiting for your approval
              </CardDescription>
            </CardHeader>
            <Separator className="bg-zinc-800" />
            <CardContent className="p-0">
              {totalPending === 0 ? (
                <div className="py-12 text-center text-zinc-600 text-sm italic">
                   No pending reviews. All clear!
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {/* Pending Songs */}
                  {pendingSongs.map((song) => (
                    <div key={song.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-amber-900/10 transition-colors group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider text-amber-500/70 font-medium">Song</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                          {song.title}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {song.artists?.name} · {formatDate(song.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={song.status} />
                        <Button variant="ghost" size="sm" asChild
                          className="h-6 text-[10px] text-zinc-600 hover:text-zinc-300 px-2 hidden sm:flex">
                          <Link href={`/dashboard/songs/${song.slug}`}>Review</Link>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Pending Analyses */}
                  {pendingAnalyses.map((analysis) => (
                    <div key={analysis.id}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-amber-900/10 transition-colors group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase tracking-wider text-amber-500/70 font-medium">Analysis</span>
                        </div>
                        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                          {analysis.songs?.title ?? "—"}
                        </p>
                        <p className="text-xs text-zinc-500 truncate italic">
                          {analysis.theme ?? "No theme"} · {formatDate(analysis.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={analysis.status} />
                        <Button variant="ghost" size="sm" asChild
                          className="h-6 text-[10px] text-zinc-600 hover:text-zinc-300 px-2 hidden sm:flex">
                          <Link href={`/dashboard/analyses/${analysis.id}`}>Review</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* ── Songs ── */}
      <TabsContent value="songs">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">Songs</CardTitle>
              <CardDescription className="text-zinc-500 text-xs">Most recently added</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-zinc-400 hover:text-zinc-100 h-7">
              <Link href="/dashboard/songs">View all →</Link>
            </Button>
          </CardHeader>
          <Separator className="bg-zinc-800" />
          <CardContent className="p-0">
            {recentSongs.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-sm italic">
                No songs yet.{" "}
                <Link href="/dashboard/songs/new" className="text-indigo-400 hover:underline">
                  Add the first one →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {recentSongs.map((song) => (
                  <div key={song.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                        {song.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {song.artists?.name} · {formatDate(song.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={song.status} />
                      <Button variant="ghost" size="sm" asChild
                        className="h-6 text-[10px] text-zinc-600 hover:text-zinc-300 px-2 hidden sm:flex">
                        <Link href={`/dashboard/songs/${song.slug}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Analyses ── */}
      <TabsContent value="analyses">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">Lyric Analyses</CardTitle>
              <CardDescription className="text-zinc-500 text-xs">Most recently added</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-zinc-400 hover:text-zinc-100 h-7">
              <Link href="/dashboard/analyses">View all →</Link>
            </Button>
          </CardHeader>
          <Separator className="bg-zinc-800" />
          <CardContent className="p-0">
            {recentAnalyses.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-sm italic">
                No analyses yet.{" "}
                <Link href="/dashboard/analyses/new" className="text-indigo-400 hover:underline">
                  Write the first one →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                        {analysis.songs?.title ?? "—"}
                      </p>
                      <p className="text-xs text-zinc-500 truncate italic">
                        {analysis.theme ?? "No theme"} · {formatDate(analysis.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={analysis.status} />
                      <Button variant="ghost" size="sm" asChild
                        className="h-6 text-[10px] text-zinc-600 hover:text-zinc-300 px-2 hidden sm:flex">
                        <Link href={`/dashboard/analyses/${analysis.id}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Artists ── */}
      <TabsContent value="artists">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="px-5 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">Artists</CardTitle>
              <CardDescription className="text-zinc-500 text-xs">Most recently added</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-zinc-400 hover:text-zinc-100 h-7">
              <Link href="/dashboard/artists">View all →</Link>
            </Button>
          </CardHeader>
          <Separator className="bg-zinc-800" />
          <CardContent className="p-0">
            {recentArtists.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-sm italic">
                No artists yet.{" "}
                <Link href="/dashboard/artists/new" className="text-indigo-400 hover:underline">
                  Add the first one →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60">
                {recentArtists.map((artist) => (
                  <div key={artist.id}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-indigo-300 transition-colors">
                        {artist.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {artist.origin ?? "—"} · Added {formatDate(artist.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={`text-[10px] h-5 px-1.5 ${
                        artist.is_active
                          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/40"
                          : "bg-zinc-800 text-zinc-500 border-zinc-700"
                      }`}>
                        {artist.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild
                        className="h-6 text-[10px] text-zinc-600 hover:text-zinc-300 px-2 hidden sm:flex">
                        <Link href={`/dashboard/artists/${artist.slug}`}>Edit</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}