import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ArtistTableClient from "@/components/admin/artists/ArtistTableClient";
import type { Tables } from "@/lib/types";

type Role = "admin" | "author";

type ArtistRow = Pick<
  Tables<"artists">,
  | "id" | "name" | "slug" | "origin" | "genre"
  | "is_active" | "formed_year" | "cover_image"
  | "created_at" | "status"  // ← tambah status
>;

async function getArtists(role: Role, userId: string): Promise<ArtistRow[]> {
  const supabase = await createClient();

  const query = supabase
    .from("artists")
    .select("id, name, slug, origin, genre, is_active, formed_year, cover_image, created_at, status") // ← tambah status
    .order("name", { ascending: true });

  const { data, error } = role === "admin"
    ? await query
    : await query.eq("created_by", userId);

  if (error) { console.error("getArtists:", error.message); return []; }
  return (data ?? []) as ArtistRow[];
}

export default async function ArtistsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = ((profileData as { role: Role } | null)?.role ?? "author") as Role;

  const artists        = await getArtists(role, user.id);
  const activeCount    = artists.filter((a) => a.is_active).length;
  const inactiveCount  = artists.length - activeCount;
  const pendingCount   = artists.filter((a) => a.status === "pending").length;
  const publishedCount = artists.filter((a) => a.status === "published").length;
  const draftCount     = artists.filter((a) => a.status === "draft").length;
  const rejectedCount  = artists.filter((a) => a.status === "rejected").length;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-serif">
            {role === "admin" ? "Artists" : "My Artists"}
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {artists.length} total · {activeCount} active · {inactiveCount} inactive
          </p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
          <Link href="/dashboard/artists/new">+ Add Artist</Link>
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Published", value: publishedCount, color: "text-emerald-400" },
          { label: "Pending",   value: pendingCount,   color: "text-amber-400" },
          { label: "Draft",     value: draftCount,     color: "text-zinc-400" },
          { label: "Rejected",  value: rejectedCount,  color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg px-4 py-3">
            <p className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <Separator className="bg-zinc-800" />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">
            {role === "admin" ? "All Artists" : "My Artists"}
          </CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Search, edit, or delete artists
          </CardDescription>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="p-0">
          <ArtistTableClient artists={artists} role={role} />
        </CardContent>
      </Card>
    </div>
  );
}