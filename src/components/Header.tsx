import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Heart, LayoutDashboard, LogOut, Menu, Moon, Plus, Sun, User, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/format";
import Logo from "./Logo";
import SearchBox from "./SearchBox";

const NAV = [
  { to: "/deals", label: "All offers" },
  { to: "/deals?bank=any", label: "Card offers" },
  { to: "/deals?sort=ending", label: "Ending soon" },
  { to: "/categories", label: "Categories" },
];

function AccountMenu() {
  const { user, isAdmin, displayName, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!user) {
    return (
      <Link to="/login" className="btn btn-outline btn-sm">
        Sign in
      </Link>
    );
  }

  const initial = (displayName || "U").charAt(0).toUpperCase();
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-heading font-semibold text-primary-foreground"
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-xl">
          <p className="truncate px-4 py-2 text-sm font-semibold">{displayName}</p>
          <p className="-mt-2 truncate px-4 pb-2 text-xs text-muted-foreground">{user.email}</p>
          <div className="my-1 border-t border-border" />
          {isAdmin && (
            <MenuItem icon={<LayoutDashboard className="h-4 w-4" />} onClick={() => { setOpen(false); navigate("/admin"); }}>
              Admin panel
            </MenuItem>
          )}
          <MenuItem icon={<Heart className="h-4 w-4" />} onClick={() => { setOpen(false); navigate("/account"); }}>
            Saved offers
          </MenuItem>
          <MenuItem icon={<User className="h-4 w-4" />} onClick={() => { setOpen(false); navigate("/account?tab=submissions"); }}>
            My submissions
          </MenuItem>
          <div className="my-1 border-t border-border" />
          <MenuItem
            icon={<LogOut className="h-4 w-4" />}
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate("/");
            }}
          >
            Sign out
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, children, onClick }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-secondary">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </button>
  );
}

export default function Header() {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  const isActive = (to: string) => {
    const [path, query] = to.split("?");
    if (location.pathname !== path) return false;
    return query ? location.search.includes(query) : !location.search.includes("bank=") && !location.search.includes("sort=ending");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-4">
        <Logo />
        <SearchBox className="hidden max-w-sm flex-1 md:block" />

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                isActive(n.to) && "bg-accent text-accent-foreground hover:text-accent-foreground"
              )}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          <Link to="/submit" className="btn btn-primary btn-sm hidden sm:inline-flex">
            <Plus className="h-4 w-4" /> Share a deal
          </Link>
          <button onClick={toggle} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Switch colour theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <div className="hidden sm:block">
            <AccountMenu />
          </div>
          <button className="rounded-full p-2 lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-card lg:hidden">
          <div className="container space-y-4 py-4">
            <SearchBox className="md:hidden" />
            <nav className="grid gap-1" aria-label="Mobile">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
                  {n.label}
                </Link>
              ))}
              <Link to="/submit" className="rounded-lg px-3 py-2.5 text-sm font-medium text-primary hover:bg-secondary">
                Share a deal
              </Link>
            </nav>
            <div className="border-t border-border pt-4 sm:hidden">
              {user ? (
                <div className="grid gap-1">
                  <Link to="/account" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">My account</Link>
                </div>
              ) : (
                <Link to="/login" className="btn btn-outline w-full">Sign in</Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
