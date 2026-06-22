"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const ListingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1L2 12v4h2" />
    <circle cx="6.5" cy="16.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

const RequestsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const BrokersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const MatchesIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

type Stats = {
  angebote: number;
  gesuche: number;
  broker: number;
  matches: number;
  neueMatches: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ angebote: 0, gesuche: 0, broker: 0, matches: 0, neueMatches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r): Promise<Stats> => r.ok ? r.json() : Promise.resolve({ angebote: 0, gesuche: 0, broker: 0, matches: 0, neueMatches: 0 }))
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* New matches alert */}
      {stats.neueMatches > 0 && (
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl p-4 border"
          style={{ backgroundColor: "var(--accent-subtle)", borderColor: "var(--accent)" }}
        >
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: "var(--success)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {stats.neueMatches} new {stats.neueMatches === 1 ? "match" : "matches"} found
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Listings matched to open requests
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/matches"
            className="text-sm font-medium px-4 py-1.5 rounded-lg text-white transition flex-shrink-0"
            style={{ backgroundColor: "var(--accent)" }}
          >
            View matches
          </Link>
        </div>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 border animate-pulse" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="w-9 h-9 rounded-lg mb-4" style={{ backgroundColor: "var(--surface-subtle)" }} />
              <div className="h-8 w-12 rounded mb-1" style={{ backgroundColor: "var(--surface-subtle)" }} />
              <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--surface-subtle)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<ListingsIcon />} label="Listings" value={stats.angebote} />
          <StatCard icon={<RequestsIcon />} label="Requests" value={stats.gesuche} />
          <StatCard icon={<BrokersIcon />} label="Brokers" value={stats.broker} />
          <StatCard icon={<MatchesIcon />} label="Open Matches" value={stats.matches} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="w-9 h-9 flex items-center justify-center rounded-lg mb-4"
        style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent)" }}
      >
        {icon}
      </div>
      <p className="text-3xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</p>
    </div>
  );
}
