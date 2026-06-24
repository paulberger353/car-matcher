"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/app/components/ThemeToggle";

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
    <rect x="9" y="11" width="14" height="10" rx="2" />
    <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const VehiclesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1L2 12v4h2" />
    <circle cx="6.5" cy="16.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

const BrokersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MatchesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ─── Navigation ─────────────────────────────────────────────────────────── */
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/dashboard/fahrzeuge", label: "Vehicles", icon: <VehiclesIcon /> },
  { href: "/dashboard/broker", label: "Brokers", icon: <BrokersIcon /> },
  { href: "/dashboard/matches", label: "Matches", icon: <MatchesIcon /> },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/fahrzeuge": "Vehicles",
  "/dashboard/broker": "Brokers",
  "/dashboard/matches": "Matches",
};

/* ─── Layout ─────────────────────────────────────────────────────────────── */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles?limit=1").then((res) => {
      if (res.ok) setIsAuthed(true);
      else router.push("/login");
    }).catch(() => router.push("/login"));
  }, []);

  if (!isAuthed) {
    return <div className="min-h-screen bg-[var(--bg)]" />;
  }

  const pageTitle = pageTitles[pathname] ?? "Dashboard";

  return (
    <div className="flex h-screen bg-[var(--bg)]">

      {/* ── Desktop Sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 flex-col flex-shrink-0" style={{ backgroundColor: "var(--sidebar-bg)" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-14 border-b" style={{ borderColor: "var(--sidebar-border)" }}>
          <div className="w-7 h-7 flex items-center justify-center rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "var(--palette-teal-lt, #7bbfc7)" }}>
            <LogoIcon />
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">CarMatcher</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={
                  isActive
                    ? { backgroundColor: "var(--sidebar-active-bg)", color: "var(--sidebar-active-text)", borderLeft: "2px solid #3d8790" }
                    : { color: "var(--sidebar-text-dim)" }
                }
                className={`flex items-center gap-2.5 rounded-lg transition text-sm font-medium ${
                  isActive ? "pl-[10px] pr-3 py-2" : "px-3 py-2 hover:bg-white/8 hover:text-[var(--sidebar-text)]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 pt-3 border-t space-y-0.5" style={{ borderColor: "var(--sidebar-border)" }}>
          <ThemeToggle sidebar />
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              style={{ color: "var(--sidebar-text-dim)" }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition hover:bg-white/10 hover:text-white text-sm font-medium"
            >
              <LogoutIcon />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">

        {/* Header bar */}
        <header
          className="flex items-center justify-between px-5 h-14 border-b flex-shrink-0"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {pageTitle}
          </span>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-auto">{children}</div>
      </main>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex border-t"
        style={{ backgroundColor: "var(--sidebar-bg)", borderColor: "var(--sidebar-border)" }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ color: isActive ? "#3d8790" : "var(--sidebar-text-dim)" }}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition"
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <form action="/api/auth/logout" method="POST" className="flex-1">
          <button
            type="submit"
            style={{ color: "var(--sidebar-text-dim)" }}
            className="w-full h-full flex flex-col items-center justify-center py-3 gap-1 transition hover:text-white"
          >
            <LogoutIcon />
            <span className="text-[10px] font-medium">Sign out</span>
          </button>
        </form>
      </nav>

    </div>
  );
}
