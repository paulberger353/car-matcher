import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import Link from "next/link";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    redirect("/login");
  }

  const { env } = await getCloudflareContext({ async: true });
  const db = env.DB;

  try {
    // Fetch statistics
    const angebote = await db
      .prepare(`SELECT COUNT(*) as count FROM vehicles WHERE typ = 'angebot'`)
      .first<{ count: number }>();

    const gesuche = await db
      .prepare(`SELECT COUNT(*) as count FROM vehicles WHERE typ = 'gesuch'`)
      .first<{ count: number }>();

    const brokers = await db
      .prepare(`SELECT COUNT(*) as count FROM brokers`)
      .first<{ count: number }>();

    const openMatches = await db
      .prepare(`SELECT COUNT(*) as count FROM matches WHERE gesehen = 0`)
      .first<{ count: number }>();

    // Fetch recent vehicles
    const recent = await db
      .prepare(
        `SELECT v.*, b.name as broker_name FROM vehicles v 
         LEFT JOIN brokers b ON v.broker_id = b.id 
         ORDER BY v.created_at DESC LIMIT 5`
      )
      .all();

    const stats = [
      {
        label: "Angebote",
        value: angebote?.count || 0,
        color: "bg-blue-500/10 text-blue-400",
      },
      {
        label: "Gesuche",
        value: gesuche?.count || 0,
        color: "bg-purple-500/10 text-purple-400",
      },
      {
        label: "Broker",
        value: brokers?.count || 0,
        color: "bg-emerald-500/10 text-emerald-400",
      },
      {
        label: "Offene Matches",
        value: openMatches?.count || 0,
        color: "bg-amber-500/10 text-amber-400",
      },
    ];

    return (
      <div className="p-8">
        {/* Match Notification */}
        {openMatches && openMatches.count > 0 && (
          <div className="mb-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-blue-400 font-semibold">
                {openMatches.count} neue Matches gefunden
              </p>
            </div>
            <Link
              href="/dashboard/matches"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            >
              Jetzt ansehen
            </Link>
          </div>
        )}

        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-neutral-400 mb-8">Übersicht und Statistiken</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} rounded-lg p-6 border border-neutral-800`}
            >
              <p className="text-sm font-medium opacity-75">{stat.label}</p>
              <p className="text-3xl font-bold mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Vehicles */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            Letzte Fahrzeuge
          </h2>
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
            {recent && recent.results && recent.results.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                      Marke/Modell
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                      Baujahr
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                      Preis
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                      Broker
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.results.map((vehicle: any) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-neutral-800 hover:bg-neutral-800/50 transition"
                    >
                      <td className="px-6 py-3 text-sm text-white capitalize">
                        {vehicle.typ}
                      </td>
                      <td className="px-6 py-3 text-sm text-white">
                        {vehicle.marke} {vehicle.modell}
                      </td>
                      <td className="px-6 py-3 text-sm text-neutral-400">
                        {vehicle.baujahr || "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-neutral-400">
                        {vehicle.preis ? `€${vehicle.preis.toLocaleString("de-DE")}` : "-"}
                      </td>
                      <td className="px-6 py-3 text-sm text-neutral-400">
                        {vehicle.broker_name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-neutral-400">
                Keine Fahrzeuge vorhanden
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-red-400">Fehler beim Laden der Daten</p>
      </div>
    );
  }
}