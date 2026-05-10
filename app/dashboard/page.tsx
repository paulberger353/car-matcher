import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    redirect("/login");
  }

  let stats = { angebote: 0, gesuche: 0, broker: 0, matches: 0 };
  let recent: any[] = [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://car-matcher.berg-paul.workers.dev";
    
    const [statsRes, recentRes] = await Promise.all([
      fetch(`${baseUrl}/api/stats`, { headers: { Cookie: `token=${token}` }, cache: "no-store" }),
      fetch(`${baseUrl}/api/vehicles?limit=5`, { headers: { Cookie: `token=${token}` }, cache: "no-store" }),
    ]);

    if (statsRes.ok) stats = await statsRes.json();
    if (recentRes.ok) { const data = await recentRes.json(); recent = data.vehicles || []; }
  } catch (e) {}

  return (
    <div className="p-8">
      {stats.matches > 0 && (
        <div className="mb-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
          <p className="text-blue-400 font-semibold">{stats.matches} neue Matches gefunden</p>
          <Link href="/dashboard/matches" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">Jetzt ansehen</Link>
        </div>
      )}
      <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p className="text-neutral-400 mb-8">Übersicht und Statistiken</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Angebote", value: stats.angebote, color: "bg-blue-500/10 text-blue-400" },
          { label: "Gesuche", value: stats.gesuche, color: "bg-purple-500/10 text-purple-400" },
          { label: "Broker", value: stats.broker, color: "bg-emerald-500/10 text-emerald-400" },
          { label: "Offene Matches", value: stats.matches, color: "bg-amber-500/10 text-amber-400" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-lg p-6 border border-neutral-800`}>
            <p className="text-sm font-medium opacity-75">{s.label}</p>
            <p className="text-3xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>
      <h2 className="text-xl font-semibold text-white mb-4">Letzte Fahrzeuge</h2>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {recent.length > 0 ? (
          <table className="w-full">
            <thead><tr className="border-b border-neutral-800">
              {["Typ","Marke/Modell","Baujahr","Preis","Broker"].map(h => (
                <th key={h} className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {recent.map((v: any) => (
                <tr key={v.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition">
                  <td className="px-6 py-3 text-sm text-white capitalize">{v.typ}</td>
                  <td className="px-6 py-3 text-sm text-white">{v.marke} {v.modell}</td>
                  <td className="px-6 py-3 text-sm text-neutral-400">{v.baujahr || "-"}</td>
                  <td className="px-6 py-3 text-sm text-neutral-400">{v.preis ? `€${v.preis.toLocaleString("de-DE")}` : "-"}</td>
                  <td className="px-6 py-3 text-sm text-neutral-400">{v.broker_name || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-neutral-400">Keine Fahrzeuge vorhanden</div>
        )}
      </div>
    </div>
  );
}