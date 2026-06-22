"use client";

import { useState, useEffect } from "react";

type Vehicle = {
  id: number; typ: string; marke: string; modell: string;
  baujahr: number | null; km_stand: number | null; preis: number | null;
  farbe: string | null; broker_id: number | null; broker_name: string | null;
  notizen: string | null; created_at: string;
};
type Broker = { id: number; name: string; vehicle_count: number };
type ParsedVehicleData = {
  typ?: string | null; marke?: string | null; modell?: string | null;
  baujahr?: number | null; km_stand?: number | null; preis?: number | null;
  farbe?: string | null; notizen?: string | null;
};

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const DeleteIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

type Filter = "alle" | "angebot" | "gesuch";

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [filter, setFilter] = useState<Filter>("alle");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchNotification, setMatchNotification] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([fetch("/api/vehicles"), fetch("/api/brokers")]);
      if (vRes.ok) setVehicles((await vRes.json() as { vehicles: Vehicle[] }).vehicles || []);
      if (bRes.ok) setBrokers((await bRes.json() as { brokers: Broker[] }).brokers || []);
    } catch { setError("Failed to load data"); }
    finally { setLoading(false); }
  }

  async function deleteVehicle(id: number) {
    if (!confirm("Delete this vehicle?")) return;
    const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    if (res.ok) setVehicles((p) => p.filter((v) => v.id !== id));
    else setError("Failed to delete");
  }

  const filtered = vehicles.filter((v) => filter === "alle" || v.typ === filter);
  const filterOptions: { key: Filter; label: string }[] = [
    { key: "alle", label: "All" },
    { key: "angebot", label: "Listings" },
    { key: "gesuch", label: "Requests" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {filtered.length} vehicle{filtered.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { setEditingVehicle(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <PlusIcon /> Add vehicle
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {filterOptions.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-4 py-2.5 text-sm font-medium transition -mb-px"
            style={filter === key
              ? { color: "var(--text-primary)", borderBottom: "2px solid var(--accent)" }
              : { color: "var(--text-secondary)" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm px-4 py-3 rounded-lg border" style={{ color: "var(--error)", backgroundColor: "var(--error-bg)", borderColor: "var(--error)" }}>
          {error}
        </p>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No vehicles found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)" }}>
                {["Type", "Make", "Model", "Year", "Mileage", "Price", "Broker", "Added", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr key={v.id} className="border-b last:border-0 transition" style={{ borderColor: "var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-5 py-3.5">
                    <TypeBadge typ={v.typ} />
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{v.marke}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-primary)" }}>{v.modell}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>{v.baujahr || "—"}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {v.km_stand ? `${v.km_stand.toLocaleString("en-GB")} km` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                    {v.preis ? `€${v.preis.toLocaleString("en-GB")}` : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>{v.broker_name || "—"}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(v.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingVehicle(v); setIsModalOpen(true); }} style={{ color: "var(--accent)" }} className="transition hover:opacity-70"><EditIcon /></button>
                      <button onClick={() => deleteVehicle(v.id)} style={{ color: "var(--error)" }} className="transition hover:opacity-70"><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No vehicles found</p>
        ) : (
          filtered.map((v) => (
            <div key={v.id} className="rounded-xl border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{v.marke} {v.modell}</p>
                  <div className="mt-1"><TypeBadge typ={v.typ} /></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingVehicle(v); setIsModalOpen(true); }} style={{ color: "var(--accent)" }} className="p-1.5"><EditIcon /></button>
                  <button onClick={() => deleteVehicle(v.id)} style={{ color: "var(--error)" }} className="p-1.5"><DeleteIcon /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {v.baujahr && <Row label="Year" value={String(v.baujahr)} />}
                {v.km_stand && <Row label="Mileage" value={`${v.km_stand.toLocaleString("en-GB")} km`} />}
                {v.preis && <Row label="Price" value={`€${v.preis.toLocaleString("en-GB")}`} />}
                {v.farbe && <Row label="Color" value={v.farbe} />}
                {v.broker_name && <Row label="Broker" value={v.broker_name} />}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <VehicleModal
          vehicle={editingVehicle}
          brokers={brokers}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(matchCount) => {
            setIsModalOpen(false);
            fetchData();
            if (matchCount > 0) {
              setMatchNotification(matchCount);
              setTimeout(() => setMatchNotification(null), 8000);
            }
          }}
        />
      )}

      {matchNotification !== null && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 text-sm font-medium shadow-lg"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">✓</span>
            <span className="text-base">
              <strong>{matchNotification}</strong> potential match{matchNotification !== 1 ? "es" : ""} found for this vehicle
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="/dashboard/matches"
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
            >
              View Matches →
            </a>
            <button
              onClick={() => setMatchNotification(null)}
              className="text-lg leading-none transition"
              style={{ color: "rgba(255,255,255,0.7)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ typ }: { typ: string }) {
  return typ === "angebot" ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: "var(--accent-subtle)", color: "var(--accent-text)" }}>
      Listing
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border" style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
      Request
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
      <span style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

/* ─── Vehicle Modal ────────────────────────────────────────────────────────── */
function VehicleModal({ vehicle, brokers, onClose, onSuccess }: {
  vehicle: Vehicle | null; brokers: Broker[]; onClose: () => void; onSuccess: (matchCount: number) => void;
}) {
  const [activeTab, setActiveTab] = useState<"manual" | "parse">("manual");
  const [form, setForm] = useState({
    typ: vehicle?.typ || "angebot",
    marke: vehicle?.marke || "",
    modell: vehicle?.modell || "",
    baujahr: vehicle?.baujahr?.toString() || "",
    km_stand: vehicle?.km_stand?.toString() || "",
    preis: vehicle?.preis?.toString() || "",
    farbe: vehicle?.farbe || "",
    broker_id: vehicle?.broker_id?.toString() || "",
    notizen: vehicle?.notizen || "",
  });
  const [parseText, setParseText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!parseText.trim()) return;
    setParsing(true); setError("");
    try {
      const res = await fetch("/api/vehicles/parse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: parseText }) });
      const data = await res.json() as { data?: ParsedVehicleData; error?: string };
      const d = data.data;
      if (d && (d.marke || d.modell || d.preis || d.baujahr)) {
        setForm((p) => ({ ...p, typ: d.typ || "angebot", marke: d.marke || "", modell: d.modell || "", baujahr: d.baujahr != null ? String(d.baujahr) : "", km_stand: d.km_stand != null ? String(d.km_stand) : "", preis: d.preis != null ? String(d.preis) : "", farbe: d.farbe || "", notizen: d.notizen || "" }));
        setActiveTab("manual"); setParseText("");
      } else { setError(data.error || "Could not extract vehicle data — try rephrasing"); }
    } catch { setError("Parse error"); }
    finally { setParsing(false); }
  }

  async function handleSubmit() {
    if (!form.marke || !form.modell) { setError("Make and model are required"); return; }
    setSubmitting(true); setError("");
    try {
      const method = vehicle ? "PUT" : "POST";
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ typ: form.typ, marke: form.marke, modell: form.modell, baujahr: form.baujahr ? parseInt(form.baujahr) : null, km_stand: form.km_stand ? parseInt(form.km_stand) : null, preis: form.preis ? parseInt(form.preis) : null, farbe: form.farbe || null, broker_id: form.broker_id ? parseInt(form.broker_id) : null, notizen: form.notizen || null }) });
      if (res.ok) {
        let matchCount = 0;
        if (!vehicle) {
          try {
            const data = await res.json() as { success: boolean; id: number; matchCount?: number };
            matchCount = data.matchCount ?? 0;
          } catch { /* ignore */ }
        }
        onSuccess(matchCount);
      } else { const d = await res.json() as { error?: string }; setError(d.error || "Failed to save"); }
    } catch { setError("Failed to save"); }
    finally { setSubmitting(false); }
  }

  const inputStyle = { backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="w-full md:max-w-2xl max-h-[90vh] flex flex-col rounded-xl border shadow-xl overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {vehicle ? "Edit vehicle" : "Add vehicle"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-tertiary)" }} className="transition hover:opacity-70"><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Tabs (new vehicle only) */}
          {!vehicle && (
            <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
              {(["manual", "parse"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 text-sm font-medium transition -mb-px capitalize"
                  style={activeTab === tab ? { color: "var(--text-primary)", borderBottom: "2px solid var(--accent)" } : { color: "var(--text-secondary)" }}
                >
                  {tab === "parse" ? "AI Parse" : "Manual"}
                </button>
              ))}
            </div>
          )}

          {/* AI Parse */}
          {activeTab === "parse" && !vehicle && (
            <div className="space-y-3">
              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder="Paste any vehicle description text — AI will extract the details"
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none min-h-28 resize-none"
                style={inputStyle}
              />
              <button onClick={handleParse} disabled={parsing}
                className="w-full rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {parsing ? "Analysing…" : "Analyse with AI"}
              </button>
            </div>
          )}

          {/* Manual form */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              {/* Type toggle */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>Vehicle type</label>
                <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  {(["angebot", "gesuch"] as const).map((t) => (
                    <button key={t} onClick={() => setForm((p) => ({ ...p, typ: t }))}
                      className="flex-1 py-2 text-sm font-medium transition"
                      style={form.typ === t ? { backgroundColor: "var(--accent)", color: "#fff" } : { backgroundColor: "var(--surface)", color: "var(--text-secondary)" }}
                    >
                      {t === "angebot" ? "Listing" : "Request"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Make *" value={form.marke} onChange={(v) => setForm((p) => ({ ...p, marke: v }))} placeholder="BMW" />
                <Field label="Model *" value={form.modell} onChange={(v) => setForm((p) => ({ ...p, modell: v }))} placeholder="M3 Competition" />
                <Field label="Year" type="number" value={form.baujahr} onChange={(v) => setForm((p) => ({ ...p, baujahr: v }))} placeholder="2022" />
                <Field label="Mileage (km)" type="number" value={form.km_stand} onChange={(v) => setForm((p) => ({ ...p, km_stand: v }))} placeholder="15000" />
                <Field label="Price (€)" type="number" value={form.preis} onChange={(v) => setForm((p) => ({ ...p, preis: v }))} placeholder="85000" />
                <Field label="Color" value={form.farbe} onChange={(v) => setForm((p) => ({ ...p, farbe: v }))} placeholder="Frozen Black Metallic" />
              </div>

              {/* Broker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>Broker</label>
                <select value={form.broker_id} onChange={(e) => setForm((p) => ({ ...p, broker_id: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                  style={inputStyle}
                >
                  <option value="">— No broker —</option>
                  {brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>Notes</label>
                <textarea value={form.notizen} onChange={(e) => setForm((p) => ({ ...p, notizen: e.target.value }))}
                  placeholder="Equipment, condition, extras…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none min-h-20 resize-none"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="flex-1 rounded-lg py-2 text-sm font-medium border transition"
            style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 rounded-lg py-2 text-sm font-medium text-white transition disabled:opacity-50"
            style={{ backgroundColor: "var(--accent)" }}>
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
        style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" }}
      />
    </div>
  );
}
