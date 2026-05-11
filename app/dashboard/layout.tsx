"use client";

import { useEffect, useState } from "react";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";

const CarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m2 3l2-3m2 3l2-3m2 3l2-3m2 3l2-3M3 20l2-3m2 3l2-3m2 3l2-3m2 3l2-3m2 3l2-3" />
  </svg>
);

const VehiclesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 18h.01M4 12h.01M8 12h.01M12 12h.01M16 12h.01M20 12h.01M4 6h16M4 8h16" />
  </svg>
);

const BrokerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM4 20h16a1 1 0 001-1v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2a1 1 0 001 1z" />
  </svg>
);

const MatchesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4.243 4.243a4 4 0 105.656 5.656l4.243-4.243" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/dashboard/fahrzeuge", label: "Fahrzeuge", icon: <VehiclesIcon /> },
  { href: "/dashboard/broker", label: "Broker", icon: <BrokerIcon /> },
  { href: "/dashboard/matches", label: "Matches", icon: <MatchesIcon /> },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // Client-side auth check
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/vehicles?limit=1");
        setIsAuthed(res.ok);
        if (!res.ok) {
          redirect("/login");
        }
      } catch {
        redirect("/login");
      }
    };
    checkAuth();
  }, []);

  if (!isAuthed) {
    return <div className="min-h-screen bg-[#0f0f12]" />;
  }

  return (
    <div className="flex h-screen bg-[#0f0f12]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-[#16161a] border-r border-[#2a2a35] flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2a2a35]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
              <CarIcon />
            </div>
            <h1 className="text-lg font-bold text-[#f0f0f5]">CarMatcher</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href) && item.href !== "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border-l-2 border-[#8b5cf6]"
                    : "text-[#9898a8] hover:text-[#f0f0f5]"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#2a2a35]">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-[#2a2a35] hover:bg-[#3f3f46] text-[#f0f0f5] py-2.5 rounded-lg transition flex items-center justify-center gap-2 font-medium"
            >
              <LogoutIcon />
              <span>Abmelden</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden md:pb-0 pb-20">
        <div className="flex-1 overflow-auto">{children}</div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#16161a] border-t border-[#2a2a35] flex justify-around">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href) && item.href !== "/dashboard");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition min-h-[60px] ${
                  isActive ? "text-[#8b5cf6]" : "text-[#9898a8] hover:text-[#f0f0f5]"
                }`}
              >
                <div className="text-2xl">{item.icon}</div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Mobile Logout */}
          <form action="/api/auth/logout" method="POST" className="flex-1">
            <button
              type="submit"
              className="w-full h-full flex flex-col items-center justify-center py-4 px-2 text-[#9898a8] hover:text-[#f0f0f5] transition"
            >
              <div className="text-2xl">
                <LogoutIcon />
              </div>
              <span className="text-xs mt-1 font-medium">Logout</span>
            </button>
          </form>
        </nav>
      </main>
    </div>
  );
}
