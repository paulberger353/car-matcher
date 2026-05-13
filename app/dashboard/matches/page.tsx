"use client";

import { useState, useEffect } from "react";

type Match = {
  id: number;
  score: number;
  gesehen: number;
  status: string;
  status_at: string | null;
  angebot_marke: string;
  angebot_modell: string;
  angebot_broker: string | null;
  gesuch_marke: string;
  gesuch_modell: string;
  gesuch_broker: string | null;
  created_at: string;
};

type Filter = "alle" | "neu" | "gesehen" | "vermittelt" | "geplatzt";

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
  const [filter, setFilter] = useState<Filter>("alle");

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

  async function markGesehen(matchId: number) {
    setUpdating(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/gesehen`, { method: "PUT" });
      if (res.ok) {
        setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, gesehen: 1 } : m));
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setUpdating(null);
    }
  }

  async function setStatus(matchId: number, status: "vermittelt" | "geplatzt") {
    setUpdating(matchId);
    try {
      const res = await fetch(`/api/matches/${matchId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId
              ? { ...m, status, gesehen: 1, status_at: new Date().toISOString() }
              : m
          )
        );
      }
    } catch (error) {
      console.error("Update error:", error);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = matches.filter((m) => {
    if (filter === "neu") return m.status === "offen" && !m.gesehen;
    if (filter === "gesehen") return m.status === "offen" && !!m.gesehen;
    if (filter === "vermittelt") return m.status === "vermittelt";
    if (filter === "geplatzt") return m.status === "geplatzt";
    return true;
  });

  const counts = {
    alle: matches.length,
    neu: matches.filter((m) => m.status === "offen" && !m.gesehen).length,
    gesehen: matches.filter((m) => m.status === "offen" && !!m.gesehen).length,
    vermittelt: matches.filter((m) => m.status === "vermittelt").length,
    geplatzt: matches.filter((m) => m.status === "geplatzt").length,
  };

  const filterLabels: Record<Filter, string> = {
    alle: "Alle",
    neu: "Neu",
    gesehen: "Gesehen",
    vermittelt: "Vermittelt",
    geplatzt: "Geplatzt",
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-[#f0f0f5] mb-1">Matches</h1>
        <p className="text-[#9898a8]">
          {counts.neu > 0 ? `${counts.neu} neu · ` : ""}{matches.length} gesamt
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {(["alle", "neu", "gesehen", "vermittelt", "geplatzt"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition font-medium text-sm flex items-center gap-2 ${
              filter === f
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#1e1e24] text-[#9898a8] hover:text-[#f0f0f5]"
            }`}
          >
            {filterLabels[f]}
            {counts[f] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                filter === f ? "bg-white/20" : "bg-[#2a2a35]"
              }`}>
                {counts[f]}
              </span>
            )}
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
                {["Angebot", "Gesucht", "Score", "Status", "Datum", "Aktionen"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-[#9898a8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((match) => {
                const colors = scoreColor(match.score);
                const isUpdating = updating === match.id;
                return (
                  <tr
                    key={match.id}
                    className={`border-b border-[#2a2a35] transition ${
                      match.status === "offen" && !match.gesehen
                        ? "bg-[#8b5cf6]/5 hover:bg-[#8b5cf6]/10"
                        : "hover:bg-[#2a2a35]/30"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm">
                      <p className="text-[#f0f0f5] font-medium">{match.angebot_marke} {match.angebot_modell}</p>
                      <p className="text-[#9898a8] text-xs mt-0.5">{match.angebot_broker || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <p className="text-[#f0f0f5] font-medium">{match.gesuch_marke} {match.gesuch_modell}</p>
                      <p className="text-[#9898a8] text-xs mt-0.5">{match.gesuch_broker || "—"}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${colors.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        {match.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge match={match} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9898a8]">
                      {new Date(match.created_at).toLocaleDateString("de-DE")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <MatchActions match={match} isUpdating={isUpdating} onGesehen={() => markGesehen(match.id)} onStatus={(s) => setStatus(match.id, s)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-[#9898a8]">Keine Matches in dieser Kategorie</div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-[#9898a8]">Lädt...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-[#9898a8]">Keine Matches in dieser Kategorie</div>
        ) : (
          filtered.map((match) => {
            const colors = scoreColor(match.score);
            const isUpdating = updating === match.id;
            return (
              <div
                key={match.id}
                className={`bg-[#1e1e24] border rounded-xl p-4 ${
                  match.status === "offen" && !match.gesehen
                    ? "border-[#8b5cf6]/40"
                    : "border-[#2a2a35]"
                }`}
              >
                {/* Score + Datum */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${colors.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                    Score {match.score} · {scoreLabel(match.score)}
                  </span>
                  <span className="text-[#9898a8] text-xs">
                    {new Date(match.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>

                {/* Angebot & Gesucht */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-[#2a2a35]/60 rounded-lg p-3">
                    <p className="text-[#8b5cf6] text-xs font-semibold mb-1 uppercase tracking-wide">Angebot</p>
                    <p className="text-[#f0f0f5] font-medium text-sm">{match.angebot_marke} {match.angebot_modell}</p>
                    {match.angebot_broker && <p className="text-[#9898a8] text-xs mt-0.5">{match.angebot_broker}</p>}
                  </div>
                  <div className="bg-[#2a2a35]/60 rounded-lg p-3">
                    <p className="text-blue-400 text-xs font-semibold mb-1 uppercase tracking-wide">Gesucht</p>
                    <p className="text-[#f0f0f5] font-medium text-sm">{match.gesuch_marke} {match.gesuch_modell}</p>
                    {match.gesuch_broker && <p className="text-[#9898a8] text-xs mt-0.5">{match.gesuch_broker}</p>}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mb-3">
                  <StatusBadge match={match} />
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <MatchActions
                    match={match}
                    isUpdating={isUpdating}
                    onGesehen={() => markGesehen(match.id)}
                    onStatus={(s) => setStatus(match.id, s)}
                    mobile
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatusBadge({ match }: { match: Match }) {
  if (match.status === "vermittelt") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#22c55e]/15 text-[#4ade80]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
        Vermittelt
      </span>
    );
  }
  if (match.status === "geplatzt") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#ef4444]/15 text-[#f87171]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
        Geplatzt
      </span>
    );
  }
  if (match.gesehen) {
    return <span className="text-[#9898a8] text-xs">Gesehen</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#8b5cf6]/15 text-[#c4b5fd]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
      Neu
    </span>
  );
}

function MatchActions({
  match,
  isUpdating,
  onGesehen,
  onStatus,
  mobile = false,
}: {
  match: Match;
  isUpdating: boolean;
  onGesehen: () => void;
  onStatus: (s: "vermittelt" | "geplatzt") => void;
  mobile?: boolean;
}) {
  if (match.status !== "offen") return null;

  if (mobile) {
    return (
      <>
        {!match.gesehen && (
          <button
            onClick={onGesehen}
            disabled={isUpdating}
            className="w-full bg-[#2a2a35] hover:bg-[#3a3a40] text-[#9898a8] py-2 rounded-lg transition text-sm disabled:opacity-50"
          >
            {isUpdating ? "..." : "Als gesehen markieren"}
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onStatus("vermittelt")}
            disabled={isUpdating}
            className="bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#4ade80] py-2 rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            {isUpdating ? "..." : "Vermittelt"}
          </button>
          <button
            onClick={() => onStatus("geplatzt")}
            disabled={isUpdating}
            className="bg-[#ef4444]/15 hover:bg-[#ef4444]/25 text-[#f87171] py-2 rounded-lg transition text-sm font-medium disabled:opacity-50"
          >
            {isUpdating ? "..." : "Geplatzt"}
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      {!match.gesehen && (
        <button
          onClick={onGesehen}
          disabled={isUpdating}
          className="text-[#9898a8] hover:text-[#f0f0f5] transition text-xs disabled:opacity-50 text-left"
        >
          Als gesehen markieren
        </button>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => onStatus("vermittelt")}
          disabled={isUpdating}
          className="text-[#4ade80] hover:text-[#22c55e] transition text-xs font-medium disabled:opacity-50"
        >
          Vermittelt
        </button>
        <span className="text-[#2a2a35]">|</span>
        <button
          onClick={() => onStatus("geplatzt")}
          disabled={isUpdating}
          className="text-[#f87171] hover:text-[#ef4444] transition text-xs font-medium disabled:opacity-50"
        >
          Geplatzt
        </button>
      </div>
    </div>
  );
}
