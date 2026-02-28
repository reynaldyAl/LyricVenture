"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "admin" | "author";

interface Props {
  role:           Role;
  onNavigate?:    () => void;
  pendingCounts?: {
    songs:    number;
    artists:  number;
    albums:   number;
    analyses: number;
  };
}

const NAV_ITEMS_COMMON = [
  { href: "/dashboard",          label: "Dashboard", icon: "⊞", key: null        },
  { href: "/dashboard/songs",    label: "Songs",     icon: "♫", key: "songs"     },
  { href: "/dashboard/artists",  label: "Artists",   icon: "♪", key: "artists"   },
  { href: "/dashboard/albums",   label: "Albums",    icon: "◎", key: "albums"    },
  { href: "/dashboard/analyses", label: "Analyses",  icon: "✦", key: "analyses"  },
] as const;

const NAV_ITEMS_ADMIN_ONLY = [
  { href: "/dashboard/tags",     label: "Tags",      icon: "⊹", key: null        },
] as const;

type NavItem = {
  href:  string;
  label: string;
  icon:  string;
  key:   string | null;
};

export default function Sidebar({ role, onNavigate, pendingCounts }: Props) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    ...NAV_ITEMS_COMMON,
    ...(role === "admin" ? NAV_ITEMS_ADMIN_ONLY : []),
  ];

  return (
    <aside className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-900 flex flex-col h-full min-h-screen">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-zinc-800">
        <Link
          href="/"
          className="font-serif font-bold text-zinc-100 text-lg hover:text-indigo-400 transition-colors"
        >
          LyricVenture
        </Link>
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">
          {role === "admin" ? "Admin Panel" : "Author Panel"}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          const count =
            item.key && pendingCounts
              ? pendingCounts[item.key as keyof typeof pendingCounts] ?? 0
              : 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{item.icon}</span>
                {item.label}
              </span>

              {/* ✅ Pending badge — hanya admin yang lihat count */}
              {count > 0 && role === "admin" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom: role badge + back to site ── */}
      <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
        >
          <span>↖</span>
          Back to Site
        </Link>
        <div className="px-3 py-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            role === "admin"
              ? "bg-indigo-900/50 text-indigo-400 border border-indigo-800/60"
              : "bg-zinc-800 text-zinc-500 border border-zinc-700"
          }`}>
            {role === "admin" ? "Admin" : "Author"}
          </span>
        </div>
      </div>

    </aside>
  );
}