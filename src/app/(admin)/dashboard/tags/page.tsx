import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TagTableClient from "@/components/admin/tags/TagTableClient";
import type { Tables } from "@/lib/types";

type TagRow = Tables<"tags">;

async function getTags(): Promise<TagRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags").select("*").order("name", { ascending: true });
  if (error) { console.error("getTags:", error.message); return []; }
  return (data ?? []) as TagRow[];
}

export default async function TagsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileData } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  const role = (profileData as { role: string } | null)?.role ?? "author";

  // Tags hanya untuk admin
  if (role !== "admin") redirect("/dashboard");

  const tags = await getTags();

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 font-serif">Tags</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {tags.length} tag{tags.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs">
          <Link href="/dashboard/tags/new">+ Add Tag</Link>
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-2.5 py-1 rounded-full border"
              style={{
                background:  tag.color ? `${tag.color}20` : "#3f3f4620",
                borderColor: tag.color ? `${tag.color}50` : "#3f3f4660",
                color:       tag.color ?? "#a1a1aa",
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <Separator className="bg-zinc-800" />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-sm font-semibold text-zinc-200 font-serif">All Tags</CardTitle>
          <CardDescription className="text-zinc-500 text-xs">
            Manage tags used to categorize songs
          </CardDescription>
        </CardHeader>
        <Separator className="bg-zinc-800" />
        <CardContent className="p-0">
          <TagTableClient tags={tags} />
        </CardContent>
      </Card>
    </div>
  );
}