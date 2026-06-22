"use client";

import { useState, useEffect } from "react";

type Match = {
  id: number; score: number; gesehen: number; status: string; status_at: string | null;
  angebot_marke: string; angebot_modell: string; angebot_broker: string | null;
  gesuch_marke: string; gesuch_modell: string; gesuch_broker: string | null;
  created_at: string;
};

type Filter = "alle" | "neu" | "gesehen" | "vermittelt" | "geplatzt";

function scoreStyle(score: number): { bg: string; text: string } {
  if (score >= 75) return { bg: "var(--success-bg)", text: "var(--success)" };
  if (score >= 50) return { bg: "var(--warning-bg)", text: "var(--warning)" };
  return { bg: "var(--error-bg)", text: "var(--error)" };
}

const CACHE_KEY = "cm_matches_overrides";

type Overrides = Record<number, Partial<Pick<Match, "gesehen" | "status" | "status_at">>>;

function loadOverrides(): Overrides {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}"); } catch { return {}; }
}

function saveOverrides(o: Overrides) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(o)); } catch { /* noop */ }
}

function applyOverrides(matches: Match[], overrides: Overrides): Match[] {
  return matches.map((m) => overrides[m.id] ? { ...m, ...overrides[m.id] } : m);
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("alle");

  useEffect(() => {
    const isReload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload";
    if (isReload) sessionStorage.removeItem(CACHE_KEY);
    fetchMatches();
  }, []);

  async function fetchMatches() {
    setLoading(true);
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const raw = (await res.json() as { matches: Match[] }).matches || [];
        setMatches(applyOverrides(raw, loadOverrides()));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function markSeen(id: number) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/matches/${id}/gesehen`, { method: "PUT" });
      if (res.ok) {
        const overrides = loadOverrides();
        overrides[id] = { ...overrides[id], gesehen: 1 };
        saveOverrides(overrides);
        setMatches((p) => p.map((m) => m.id === id ? { ...m, gesehen: 1 } : m));
      }
    } finally { setUpdating(null); }
  }

  async function setStatus(id: number, status: "vermittelt" | "geplatzt") {
    setUpdating(id);
    try {
      const res = await fetch(`/api/matches/${id}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (res.ok) {
        const now = new Date().toISOString();
        const overrides = loadOverrides();
        overrides[id] = { ...overrides[id], status, gesehen: 1, status_at: now };
        saveOverrides(overrides);
        setMatches((p) => p.map((m) => m.id === id ? { ...m, status, gesehen: 1, status_at: now } : m));
      }
    } finally { setUpdating(null); }
  }

  const counts: Record<Filter, number> = {
    alle: matches.length,
    neu: matches.filter((m) => m.status === "offen" && !m.gesehen).length,
    gesehen: matches.filter((m) => m.status === "offen" && !!m.gesehen).length,
    vermittelt: matches.filter((m) => m.status === "vermittelt").length,
    geplatzt: matches.filter((m) => m.status === "geplatzt").length,
  };

  const filtered = matches.filter((m) => {
    if (filter === "neu") return m.status === "offen" && !m.gesehen;
    if (filter === "gesehen") return m.status === "offen" && !!m.gesehen;
    if (filter === "vermittelt") return m.status === "vermittelt";
    if (filter === "geplatzt") return m.status === "geplatzt";
    return true;
  });

  const filterOptions: { key: Filter; label: string }[] = [
    { key: "alle", label: "All" },
    { key: "neu", label: "New" },
    { key: "gesehen", label: "Seen" },
    { key: "vermittelt", label: "Brokered" },
    { key: "geplatzt", label: "Cancelled" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {counts.neu > 0 ? `${counts.neu} new · ` : ""}{matches.length} total
      </p>

      {/* Filter tabs */}
      <div className="flex flex-wrap border-b" style={{ borderColor: "var(--border)" }}>
        {filterOptions.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition -mb-px"
            style={filter === key
              ? { color: "var(--text-primary)", borderBottom: "2px solid var(--accent)" }
              : { color: "var(--text-secondary)" }
            }
          >
            {label}
            {counts[key] > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: filter === key ? "var(--accent-subtle)" : "var(--surface-subtle)", color: "var(--text-secondary)" }}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No matches in this category</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)" }}>
                {["Listing", "Request", "Score", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const ss = scoreStyle(m.score);
                return (
                  <tr key={m.id} className="border-b last:border-0 transition" style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-subtle)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.angebot_marke} {m.angebot_modell}</p>
                      {m.angebot_broker && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{m.angebot_broker}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.gesuch_marke} {m.gesuch_modell}</p>
                      {m.gesuch_broker && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{m.gesuch_broker}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ backgroundColor: ss.bg, color: ss.text }}>
                        {m.score}
                      </span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge match={m} /></td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
                      {new Date(m.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-5 py-3.5">
                      <MatchActions match={m} isUpdating={updating === m.id} onSeen={() => markSeen(m.id)} onStatus={(s) => setStatus(m.id, s)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No matches in this category</p>
        ) : (
          filtered.map((m) => {
            const ss = scoreStyle(m.score);
            return (
              <div key={m.id} className="rounded-xl border p-4 space-y-3" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ backgroundColor: ss.bg, color: ss.text }}>
                    Score {m.score}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(m.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg p-3" style={{ backgroundColor: "var(--surface-subtle)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>Listing</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.angebot_marke} {m.angebot_modell}</p>
                    {m.angebot_broker && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{m.angebot_broker}</p>}
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: "var(--surface-subtle)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--text-secondary)" }}>Request</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.gesuch_marke} {m.gesuch_modell}</p>
                    {m.gesuch_broker && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{m.gesuch_broker}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge match={m} />
                </div>
                <MatchActions match={m} isUpdating={updating === m.id} onSeen={() => markSeen(m.id)} onStatus={(s) => setStatus(m.id, s)} mobile />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Status Badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ match }: { match: Match }) {
  if (match.status === "vermittelt") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
        style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--success)" }} />
        Brokered
      </span>
    );
  }
  if (match.status === "geplatzt") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
        style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--error)" }} />
        Cancelled
      </span>
    );
  }
  if (match.gesehen) {
    return <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Seen</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold"
      style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent)" }}>
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
      New
    </span>
  );
}

/* ─── Match Actions ────────────────────────────────────────────────────────── */
function MatchActions({ match, isUpdating, onSeen, onStatus, mobile = false }: {
  match: Match; isUpdating: boolean; onSeen: () => void;
  onStatus: (s: "vermittelt" | "geplatzt") => void; mobile?: boolean;
}) {
  if (match.status !== "offen") return null;

  if (mobile) {
    return (
      <div className="space-y-2">
        {!match.gesehen && (
          <button onClick={onSeen} disabled={isUpdating}
            className="w-full py-2 rounded-lg text-sm transition border disabled:opacity-50"
            style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            {isUpdating ? "…" : "Mark as seen"}
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onStatus("vermittelt")} disabled={isUpdating}
            className="py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            {isUpdating ? "…" : "Brokered"}
          </button>
          <button onClick={() => onStatus("geplatzt")} disabled={isUpdating}
            className="py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            style={{ backgroundColor: "var(--error-bg)", color: "var(--error)" }}>
            {isUpdating ? "…" : "Cancelled"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {!match.gesehen && (
        <button onClick={onSeen} disabled={isUpdating}
          className="text-xs text-left transition disabled:opacity-50 hover:underline"
          style={{ color: "var(--text-secondary)" }}>
          {isUpdating ? "…" : "Mark as seen"}
        </button>
      )}
      <div className="flex gap-3">
        <button onClick={() => onStatus("vermittelt")} disabled={isUpdating}
          className="text-xs font-medium transition disabled:opacity-50 hover:underline"
          style={{ color: "var(--success)" }}>
          Brokered
        </button>
        <span style={{ color: "var(--border)" }}>|</span>
        <button onClick={() => onStatus("geplatzt")} disabled={isUpdating}
          className="text-xs font-medium transition disabled:opacity-50 hover:underline"
          style={{ color: "var(--error)" }}>
          Cancelled
        </button>
      </div>
    </div>
  );
}
