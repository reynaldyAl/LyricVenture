import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminShell from "@/components/admin/AdminShell";
import type { Tables } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = data as Pick<Tables<"profiles">, "role"> | null;

  // Hanya admin & author yang boleh masuk
  if (!profile || (profile.role !== "admin" && profile.role !== "author")) {
    redirect("/");
  }

  return (
    <AdminShell role={profile.role}>
      {children}
    </AdminShell>
  );
}