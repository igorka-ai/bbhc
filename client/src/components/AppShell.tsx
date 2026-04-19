import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, CalendarDays, Users, MessageSquare,
  Menu, X, Moon, Sun, Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/games",   label: "Games",     icon: CalendarDays },
  { href: "/roster",  label: "Roster",    icon: Users },
  { href: "/messages",label: "Messages",  icon: MessageSquare },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
      <svg
        width="32" height="32" viewBox="0 0 32 32" fill="none"
        xmlns="http://www.w3.org/2000/svg" aria-label="Brooklyn Beer Hockey Club"
        className="shrink-0"
      >
        {/* Puck */}
        <ellipse cx="16" cy="22" rx="11" ry="5" fill="hsl(199 80% 48% / 0.18)" stroke="hsl(199 80% 48%)" strokeWidth="1.5" />
        {/* Stick blade */}
        <path d="M8 22 Q6 18 7 14" stroke="hsl(38 90% 52%)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Stick shaft */}
        <path d="M7 14 L22 4" stroke="hsl(38 90% 52%)" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Beer foam drops */}
        <circle cx="23" cy="9" r="2" fill="hsl(199 80% 48% / 0.6)"/>
        <circle cx="26" cy="5" r="1.5" fill="hsl(199 80% 48% / 0.4)"/>
      </svg>
      <div>
        <div className="text-sm font-bold text-foreground leading-tight font-display tracking-wide">BROOKLYN</div>
        <div className="text-xs text-primary font-semibold leading-tight tracking-widest">BEER HOCKEY</div>
      </div>
    </div>
  );
}

function NavItem({ href, label, Icon }: { href: string; label: string; Icon: any }) {
  const [location] = useLocation();
  const active = location === href;
  return (
    <Link href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
      data-testid={`nav-${label.toLowerCase()}`}
    >
      <Icon size={18} className="shrink-0" />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(true);

  function toggleTheme() {
    setDark(d => !d);
    document.documentElement.classList.toggle("light");
    document.documentElement.classList.toggle("dark");
  }

  return (
    <div className={cn("flex min-h-dvh", dark ? "dark" : "light")}>
      {/* ── Sidebar (desktop) ─────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
        <Logo />
        <nav className="flex-1 py-3 space-y-0.5" aria-label="Main navigation">
          {NAV.map(({ href, label, icon: Icon }) => (
            <NavItem key={href} href={href} label={label} Icon={Icon} />
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
            aria-label="Toggle theme"
            data-testid="button-theme-toggle"
          >
            {dark ? <Sun size={14}/> : <Moon size={14}/>}
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </aside>

      {/* ── Mobile header ─────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-primary" />
          <span className="font-display font-bold text-sm tracking-wide">BBHC</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 text-muted-foreground" aria-label="Toggle theme">
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <button onClick={() => setMobileOpen(o => !o)} className="p-2 text-foreground" aria-label="Menu" data-testid="button-mobile-menu">
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>

      {/* ── Mobile nav overlay ────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 top-14 bg-sidebar" onClick={() => setMobileOpen(false)}>
          <nav className="p-4 space-y-1" aria-label="Mobile navigation">
            {NAV.map(({ href, label, icon: Icon }) => (
              <NavItem key={href} href={href} label={label} Icon={Icon} />
            ))}
          </nav>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14 overflow-auto">
        {children}
      </main>
    </div>
  );
}
