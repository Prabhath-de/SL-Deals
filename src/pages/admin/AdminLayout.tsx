import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Flag, LayoutDashboard, Menu, Moon, Sun, Tag, Users, X } from "lucide-react";
import { adminStats } from "@/lib/api";
import { cn } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePageMeta } from "@/hooks/usePageMeta";
import { LogoMark } from "@/components/Logo";

export default function AdminLayout() {
  usePageMeta("Admin");
  const { displayName, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: adminStats, refetchInterval: 60_000 });

  const nav = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/admin/deals", label: "Deals", icon: Tag, badge: stats.data?.pending },
    { to: "/admin/reports", label: "Reports", icon: Flag, badge: stats.data?.openReports },
    { to: "/admin/users", label: "Users", icon: Users },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2.5 px-5 py-5">
        <LogoMark className="h-8 w-8" />
        <span className="font-heading font-bold">Admin</span>
      </Link>
      <nav className="grid gap-1 px-3">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
                isActive && "bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
              )
            }
          >
            <n.icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{n.label}</span>
            {!!n.badge && <span className="rounded-full bg-maroon px-2 py-0.5 text-xs font-semibold text-maroon-foreground">{n.badge}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-1 border-t border-border p-3">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          <ExternalLink className="h-[18px] w-[18px]" /> View website
        </Link>
        <button onClick={toggle} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />} {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <div className="flex items-center justify-between px-3 pt-2 text-xs text-muted-foreground">
          <span className="truncate">{displayName}</span>
          <button onClick={() => signOut()} className="font-semibold hover:text-foreground">Sign out</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-card lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-card shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:hidden">
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="rounded-lg p-1.5 hover:bg-secondary">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-heading font-bold">Admin</span>
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
