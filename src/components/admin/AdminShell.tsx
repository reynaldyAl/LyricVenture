"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/sidebar";
import Topbar from "@/components/admin/topbar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

type Role = "admin" | "author";

export default function AdminShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100">

      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar role={role} />
      </div>

      {/* ── Mobile Sidebar via Sheet ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="p-0 w-64 bg-zinc-900 border-r border-zinc-800"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}