"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const OfferIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const RequestIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BrokerIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM4 20h16a1 1 0 001-1v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2a1 1 0 001 1z" />
  </svg>
);

const MatchIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4.243 4.243a4 4 0 105.656 5.656l4.243-4.243" />
  </svg>
);

type Stats = {
  angebote: number;
  gesuche: number;
  broker: number;
  matches: number;
  recent: any[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    angebote: 0,
    gesuche: 0,
    broker: 0,
    matches: 0,
    recent: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const [angebote, gesuche, broker, matches, recent] = await Promise.all([
        fetch("/api/vehicles?typ=angebot&limit=1").then((r) =>
          r.ok ? r.json() : { vehicles: [] }
        ),
        fetch("/api/vehicles?typ=gesuch&limit=1").then((r) =>
          r.ok ? r.json() : { vehicles: [] }
        ),
        fetch("/api/brokers").then((r) => (r.ok ? r.json() : { brokers: [] })),
        fetch("/api/matches").then((r) => (r.ok ? r.json() : { matches: [] })),
        fetch("/api/vehicles?limit=5").then((r) =>
          r.ok ? r.json() : { vehicles: [] }
        ),
      ]);

      // Count items
      const countAngebote = await fetch("/api/vehicles?typ=angebot").then((r) =>
        r.ok ? r.json() : { vehicles: [] }
      );
      const countGesuche = await fetch("/api/vehicles?typ=gesuch").then((r) =>
        r.ok ? r.json() : { vehicles: [] }
      );

      setStats({
        angebote: countAngebote.vehicles?.length || 0,
        gesuche: countGesuche.vehicles?.length || 0,
        broker: broker.brokers?.length || 0,
        matches: matches.matches?.filter((m: any) => !m.gesehen).length || 0,
        recent: recent.vehicles || [],
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Match Banner */}
      {stats.matches > 0 && (
        <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-lg gap-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-[#22c55e] rounded-full animate-pulse"></div>
            <div>
              <p className="text-white font-semibold text-lg">
                {stats.matches} neue Matches gefunden
              </p>
              <p className="text-white/80 text-sm">Fahrzeuge passen zu Anfragen</p>
            </div>
          </div>
          <Link
            href="/dashboard/matches"
            className="bg-white hover:bg-white/90 text-[#8b5cf6] px-6 py-2 rounded-lg font-medium transition whitespace-nowrap"
          >
            Ansehen
          </Link>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#f0f0f5] mb-2">Dashboard</h1>
        <p className="text-[#9898a8]">Übersicht und Statistiken</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-[#9898a8]">Wird geladen...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Angebote */}
            <StatCard
              icon={<OfferIcon />}
              label="Angebote"
              value={stats.angebote}
              color="violet"
            />
            {/* Gesuche */}
            <StatCard
              icon={<RequestIcon />}
              label="Gesuche"
              value={stats.gesuche}
              color="blue"
            />
            {/* Broker */}
            <StatCard
              icon={<BrokerIcon />}
              label="Broker"
              value={stats.broker}
              color="emerald"
            />
            {/* Matches */}
            <StatCard
              icon={<MatchIcon />}
              label="Offene Matches"
              value={stats.matches}
              color="amber"
            />
          </div>

          {/* Recent Vehicles */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-[#f0f0f5] mb-6">
              Letzte Fahrzeuge
            </h2>

            {stats.recent.length === 0 ? (
              <p className="text-[#9898a8]">Keine Fahrzeuge vorhanden</p>
            ) : (
              <div className="space-y-4 md:space-y-0 md:grid md:gap-4 hidden md:grid md:grid-cols-1">
                <div className="bg-[#1e1e24] border border-[#2a2a35] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2a2a35]">
                        <th className="px-6 py-4 text-left text-[#9898a8]">
                          Marke
                        </th>
                        <th className="px-6 py-4 text-left text-[#9898a8]">
                          Modell
                        </th>
                        <th className="px-6 py-4 text-left text-[#9898a8]">
                          Typ
                        </th>
                        <th className="px-6 py-4 text-left text-[#9898a8]">
                          Baujahr
                        </th>
                        <th className="px-6 py-4 text-left text-[#9898a8]">
                          Broker
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent.map((vehicle: any) => (
                        <tr
                          key={vehicle.id}
                          className="border-b border-[#2a2a35] hover:bg-[#2a2a35]/50 transition"
                        >
                          <td className="px-6 py-4 text-[#f0f0f5]">
                            {vehicle.marke}
                          </td>
                          <td className="px-6 py-4 text-[#f0f0f5]">
                            {vehicle.modell}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                vehicle.typ === "angebot"
                                  ? "bg-[#8b5cf6]/20 text-[#c4b5fd]"
                                  : "bg-blue-500/20 text-blue-300"
                              }`}
                            >
                              {vehicle.typ === "angebot"
                                ? "Angebot"
                                : "Gesuch"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#9898a8]">
                            {vehicle.baujahr || "—"}
                          </td>
                          <td className="px-6 py-4 text-[#9898a8]">
                            {vehicle.broker_name || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {stats.recent.map((vehicle: any) => (
                <div
                  key={vehicle.id}
                  className="bg-[#1e1e24] border border-[#2a2a35] rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[#f0f0f5] font-bold">
                        {vehicle.marke} {vehicle.modell}
                      </p>
                      <p className="text-[#9898a8] text-sm">
                        {vehicle.baujahr || "Baujahr unbekannt"}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium ${
                        vehicle.typ === "angebot"
                          ? "bg-[#8b5cf6]/20 text-[#c4b5fd]"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {vehicle.typ === "angebot" ? "Angebot" : "Gesuch"}
                    </span>
                  </div>
                  {vehicle.broker_name && (
                    <p className="text-[#9898a8] text-sm">
                      Broker: {vehicle.broker_name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "violet" | "blue" | "emerald" | "amber";
}) {
  const colorClasses = {
    violet: "bg-[#8b5cf6]/10 text-[#c4b5fd]",
    blue: "bg-blue-500/10 text-blue-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
  };

  const iconColors = {
    violet: "text-[#c4b5fd]",
    blue: "text-blue-300",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
  };

  return (
    <div className={`${colorClasses[color]} rounded-xl p-6 border border-[#2a2a35]`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconColors[color]} p-2 bg-[#1e1e24] rounded-lg`}>
          {icon}
        </div>
      </div>
      <p className="text-4xl font-bold text-white mb-2">{value}</p>
      <p className="text-[#9898a8]">{label}</p>
    </div>
  );
}