"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Role = "admin" | "author";

const navGroups = [
  {
    label: "Content",
    items: [
      { href: "/dashboard",          label: "Overview",       icon: "▣" },
      { href: "/dashboard/songs",    label: "Songs",          icon: "♫" },
      { href: "/dashboard/analyses", label: "Lyric Analyses", icon: "✦" },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/dashboard/artists",  label: "Artists",        icon: "♪" },
      { href: "/dashboard/albums",   label: "Albums",         icon: "◎" },
      { href: "/dashboard/tags",     label: "Tags",           icon: "◇" },
    ],
  },
];

interface SidebarProps {
  role: Role;           // ← tambah ini
  onNavigate?: () => void;
}

export default function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full min-h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col">

      {/* ── Brand ── */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-zinc-800 shrink-0">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="text-base font-bold font-serif tracking-tight text-white">
            Lyric<span className="text-indigo-400 italic">Venture</span>
          </span>
        </Link>
        {/* Badge berubah sesuai role */}
        <Badge
          variant="secondary"
          className={cn(
            "text-[9px] px-1.5 py-0 h-4 border",
            role === "admin"
              ? "bg-zinc-800 text-zinc-400 border-zinc-700"
              : "bg-indigo-950 text-indigo-400 border-indigo-800"
          )}
        >
          {role === "admin" ? "Admin" : "Author"}
        </Badge>
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[9px] font-semibold text-zinc-500 uppercase tracking-[0.35em] px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"       // exact match Overview
                    : pathname.startsWith(item.href); // prefix match sub-pages
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150",
                      isActive
                        ? "bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-900/50"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    )}
                  >
                    <span className={cn(
                      "text-base w-4 text-center leading-none shrink-0",
                      isActive ? "text-white" : "text-zinc-500"
                    )}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="shrink-0">
        <Separator className="bg-zinc-800" />
        <div className="p-3">
          <Link
            href="/"
            target="_blank"
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <span className="text-base w-4 text-center leading-none shrink-0">↗</span>
            <span>View Public Site</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}