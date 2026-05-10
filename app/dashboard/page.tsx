import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Icons
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
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const MatchIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1m2-1v2.5M14 4l2-1m-2 1l-2-1m2 1v2.5" />
  </svg>
);

// Async function to fetch stats directly from DB
async function getStats() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    throw new Error("Unauthorized");
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  const [angebote, gesuche, broker, matches, recent] = await Promise.all([
    db.prepare(`SELECT COUNT(*) as count FROM vehicles WHERE typ = 'angebot'`).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) as count FROM vehicles WHERE typ = 'gesuch'`).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) as count FROM brokers`).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) as count FROM matches WHERE gesehen = 0`).first<{ count: number }>(),
    db.prepare(`SELECT v.*, b.name as broker_name FROM vehicles v 
                LEFT JOIN brokers b ON v.broker_id = b.id 
                ORDER BY v.created_at DESC LIMIT 5`).all<any>(),
  ]);

  return {
    angebote: angebote?.count || 0,
    gesuche: gesuche?.count || 0,
    broker: broker?.count || 0,
    matches: matches?.count || 0,
    recent: recent?.results || [],
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    redirect("/login");
  }

  let stats = { angebote: 0, gesuche: 0, broker: 0, matches: 0, recent: [] };

  try {
    stats = await getStats();
  } catch (error) {
    console.error("Error fetching stats:", error);
  }

  return (
    <div className="p-8">
      {/* Matches Banner */}
      {stats.matches > 0 && (
        <div className="mb-8 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-xl p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-[#22c55e] rounded-full animate-pulse"></div>
            <div>
              <p className="text-[#fafafa] font-semibold text-lg">{stats.matches} neue Matches gefunden</p>
              <p className="text-[#fafafa]/80 text-sm">Fahrzeuge passen zu Anfragen</p>
            </div>
          </div>
          <Link href="/dashboard/matches" className="bg-[#fafafa] hover:bg-[#fafafa]/90 text-[#8b5cf6] px-6 py-2 rounded-lg font-medium transition">
            Ansehen
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#fafafa] mb-2">Dashboard</h1>
        <p className="text-[#a1a1aa]">Übersicht und Statistiken</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<OfferIcon />}
          label="Angebote"
          value={stats.angebote}
          color="violet"
        />
        <StatCard
          icon={<RequestIcon />}
          label="Gesuche"
          value={stats.gesuche}
          color="blue"
        />
        <StatCard
          icon={<BrokerIcon />}
          label="Broker"
          value={stats.broker}
          color="emerald"
        />
        <StatCard
          icon={<MatchIcon />}
          label="Offene Matches"
          value={stats.matches}
          color="amber"
        />
      </div>

      {/* Recent Vehicles */}
      <div>
        <h2 className="text-xl font-semibold text-[#fafafa] mb-4">Letzte Fahrzeuge</h2>
        <div className="bg-[#1c1c1f] border border-[#27272a] rounded-xl overflow-hidden">
          {stats.recent.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#27272a]/40">
                  {["Typ", "Marke/Modell", "Baujahr", "KM", "Preis", "Broker"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-[#a1a1aa]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((v: any) => (
                  <tr key={v.id} className="border-b border-[#27272a] hover:bg-[#27272a]/30 transition">
                    <td className="px-6 py-4 text-sm text-[#fafafa]">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                        v.typ === "angebot" 
                          ? "bg-[#8b5cf6]/20 text-[#a78bfa]" 
                          : "bg-[#3b82f6]/20 text-[#93c5fd]"
                      }`}>
                        {v.typ === "angebot" ? "Angebot" : "Gesuch"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#fafafa]">
                      {v.marke} {v.modell}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a1a1aa]">{v.baujahr || "-"}</td>
                    <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                      {v.km_stand ? `${v.km_stand.toLocaleString("de-DE")}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                      {v.preis ? `€${v.preis.toLocaleString("de-DE")}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#a1a1aa]">{v.broker_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-[#a1a1aa]">Keine Fahrzeuge vorhanden</div>
          )}
        </div>
      </div>
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
  const colors = {
    violet: "bg-[#8b5cf6]/10 text-[#a78bfa] border-[#8b5cf6]/30",
    blue: "bg-[#3b82f6]/10 text-[#93c5fd] border-[#3b82f6]/30",
    emerald: "bg-[#10b981]/10 text-[#6ee7b7] border-[#10b981]/30",
    amber: "bg-[#f59e0b]/10 text-[#fbbf24] border-[#f59e0b]/30",
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#a1a1aa] mb-2">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
}