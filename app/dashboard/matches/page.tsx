"use client";

import { useState, useEffect } from "react";

type Match = {
  id: number;
  score: number;
  gesehen: number;
  angebot_marke: string;
  angebot_modell: string;
  angebot_broker: string | null;
  gesuch_marke: string;
  gesuch_modell: string;
  gesuch_broker: string | null;
  created_at: string;
};

export default function MatchesSeite() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsViewed(matchId: number) {
    setUpdating(matchId);

    try {
      const res = await fetch(`/api/matches/${matchId}/gesehen`, {
        method: "PUT",
      });

      if (res.ok) {
        // Update local state
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId ? { ...m, gesehen: 1 } : m
          )
        );
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setUpdating(null);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 75) return "bg-green-500/10 text-green-400";
    if (score >= 50) return "bg-yellow-500/10 text-yellow-400";
    return "bg-red-500/10 text-red-400";
  }

  function getScoreLabel(score: number): string {
    if (score >= 75) return "Passend";
    if (score >= 50) return "Nahezu passend";
    return "Gering";
  }

  return (
    <div className="p-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Matches</h1>
        <p className="text-neutral-400 mt-1">{matches.length} Matches</p>
      </div>

      {/* Table */}
      <div className="mt-8 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-neutral-400">
            Lädt...
          </div>
        ) : matches.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-800/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Angebot
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Gesuch
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Datum
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr
                  key={match.id}
                  className={`border-b border-neutral-800 transition ${
                    match.gesehen
                      ? "hover:bg-neutral-800/30"
                      : "bg-blue-500/5 hover:bg-blue-500/10"
                  }`}
                >
                  <td className="px-6 py-3 text-sm text-white">
                    <div>
                      {match.angebot_marke} {match.angebot_modell}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {match.angebot_broker || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-white">
                    <div>
                      {match.gesuch_marke} {match.gesuch_modell}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {match.gesuch_broker || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-white">
                    <div className="font-semibold">{match.score}</div>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(match.score)}`}>
                      {getScoreLabel(match.score)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {new Date(match.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {!match.gesehen && (
                      <button
                        onClick={() => markAsViewed(match.id)}
                        disabled={updating === match.id}
                        className="text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
                      >
                        Als gesehen markieren
                      </button>
                    )}
                    {match.gesehen && (
                      <span className="text-neutral-500">Gesehen</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-neutral-400">
            Keine Matches vorhanden
          </div>
        )}
      </div>
    </div>
  );
}
