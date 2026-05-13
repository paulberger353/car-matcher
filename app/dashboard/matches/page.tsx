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

function scoreColor(score: number) {
  if (score >= 75) return { badge: "bg-[#22c55e]/15 text-[#4ade80]", dot: "bg-[#22c55e]" };
  if (score >= 50) return { badge: "bg-[#f59e0b]/15 text-[#fbbf24]", dot: "bg-[#f59e0b]" };
  return { badge: "bg-[#ef4444]/15 text-[#f87171]", dot: "bg-[#ef4444]" };
}

function scoreLabel(score: number) {
  if (score >= 75) return "Hohe Übereinstimmung";
  if (score >= 50) return "Nahezu passend";
  return "Gering";
}

export default function MatchesSeite() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter, setFilter] = useState<"alle" | "neu" | "gesehen">("alle");

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
      const res = await fetch(`/api/matches/${matchId}/gesehen`, { method: "PUT" });
      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, gesehen: 1 } : m))
        );
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = matches.filter((m) => {
    if (filter === "neu") return !m.gesehen;
    if (filter === "gesehen") return !!m.gesehen;
    return true;
  });

  const neueMatches = matches.filter((m) => !m.gesehen).length;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#f0f0f5] mb-1">Matches</h1>
        <p className="text-[#9898a8]">
          {matches.length} Matches{neueMatches > 0 && ` · ${neueMatches} neu`}
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["alle", "neu", "gesehen"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              filter === f
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#1e1e24] text-[#9898a8] hover:text-[#f0f0f5]"
            }`}
          >
            {f === "alle" ? "Alle" : f === "neu" ? "Neu" : "Gesehen"}
          </button>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-[#1e1e24] border border-[#2a2a35] rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-[#9898a8]">Lädt...</div>
        ) : filtered.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a35] bg-[#2a2a35]/40">
                {["Angebot", "Gesuch", "Score", "Status", "Datum", ""].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-[#9898a8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((match) => {
                const colors = scoreColor(match.score);
                return (
                  <tr
                    key={match.id}
                    className={`border-b border-[#2a2a35] transition ${
                      match.gesehen
                        ? "hover:bg-[#2a2a35]/30"
                        : "bg-[#8b5cf6]/5 hover:bg-[#8b5cf6]/10"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm">
                      <p className="text-[#f0f0f5] font-medium">
                        {match.angebot_marke} {match.angebot_modell}
                      </p>
                      <p className="text-[#9898a8] text-xs mt-0.5">{match.angebot_broker || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-[#f0f0f5] font-medium">
                        {match.gesuch_marke} {match.gesuch_modell}
                      </p>
                      <p className="text-[#9898a8] text-xs mt-0.5">{match.gesuch_broker || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${colors.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {match.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9898a8]">
                      {scoreLabel(match.score)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9898a8]">
                      {new Date(match.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {!match.gesehen ? (
                        <button
                          onClick={() => markAsViewed(match.id)}
                          disabled={updating === match.id}
                          className="text-[#8b5cf6] hover:text-[#c4b5fd] transition disabled:opacity-50 whitespace-nowrap"
                        >
                          {updating === match.id ? "..." : "Als gesehen"}
                        </button>
                      ) : (
                        <span className="text-[#9898a8]/50 text-xs">Gesehen</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-[#9898a8]">Keine Matches vorhanden</div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-[#9898a8]">Lädt...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[#9898a8]">Keine Matches vorhanden</div>
        ) : (
          filtered.map((match) => {
            const colors = scoreColor(match.score);
            return (
              <div
                key={match.id}
                className={`bg-[#1e1e24] border rounded-xl p-4 ${
                  match.gesehen ? "border-[#2a2a35]" : "border-[#8b5cf6]/40"
                }`}
              >
                {/* Score Badge + Datum */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${colors.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    Score {match.score} · {scoreLabel(match.score)}
                  </span>
                  <span className="text-[#9898a8] text-xs">
                    {new Date(match.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>

                {/* Angebot & Gesuch */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#2a2a35]/60 rounded-lg p-3">
                    <p className="text-[#8b5cf6] text-xs font-semibold mb-1 uppercase tracking-wide">Angebot</p>
                    <p className="text-[#f0f0f5] font-medium text-sm">
                      {match.angebot_marke} {match.angebot_modell}
                    </p>
                    {match.angebot_broker && (
                      <p className="text-[#9898a8] text-xs mt-0.5">{match.angebot_broker}</p>
                    )}
                  </div>
                  <div className="bg-[#2a2a35]/60 rounded-lg p-3">
                    <p className="text-blue-400 text-xs font-semibold mb-1 uppercase tracking-wide">Gesuch</p>
                    <p className="text-[#f0f0f5] font-medium text-sm">
                      {match.gesuch_marke} {match.gesuch_modell}
                    </p>
                    {match.gesuch_broker && (
                      <p className="text-[#9898a8] text-xs mt-0.5">{match.gesuch_broker}</p>
                    )}
                  </div>
                </div>

                {/* Action */}
                {!match.gesehen ? (
                  <button
                    onClick={() => markAsViewed(match.id)}
                    disabled={updating === match.id}
                    className="w-full bg-[#8b5cf6]/15 hover:bg-[#8b5cf6]/25 text-[#c4b5fd] py-2 rounded-lg transition text-sm font-medium disabled:opacity-50"
                  >
                    {updating === match.id ? "..." : "Als gesehen markieren"}
                  </button>
                ) : (
                  <p className="text-center text-[#9898a8]/50 text-xs">Gesehen</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
