"use client";

import { useState, useEffect } from "react";

type Broker = {
  id: number; name: string; telefon: string | null; email: string | null;
  firma: string | null; notizen: string | null; created_at: string; vehicle_count: number;
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

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  useEffect(() => { fetchBrokers(); }, []);

  async function fetchBrokers() {
    setLoading(true);
    try {
      const res = await fetch("/api/brokers");
      if (res.ok) setBrokers((await res.json() as { brokers: Broker[] }).brokers || []);
    } catch { setError("Failed to load brokers"); }
    finally { setLoading(false); }
  }

  async function deleteBroker(broker: Broker) {
    if (broker.vehicle_count > 0) {
      setError(`Cannot delete "${broker.name}" — ${broker.vehicle_count} vehicle${broker.vehicle_count !== 1 ? "s" : ""} assigned`);
      return;
    }
    if (!confirm(`Delete ${broker.name}?`)) return;
    const res = await fetch(`/api/brokers/${broker.id}`, { method: "DELETE" });
    if (res.ok) setBrokers((p) => p.filter((b) => b.id !== broker.id));
    else setError("Failed to delete");
  }

  return (
    <div className="p-6 md:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {brokers.length} broker{brokers.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => { setEditingBroker(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <PlusIcon /> Add broker
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border text-sm"
          style={{ color: "var(--error)", backgroundColor: "var(--error-bg)", borderColor: "var(--error)" }}>
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-3 opacity-60 hover:opacity-100"><CloseIcon /></button>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        {loading ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</div>
        ) : brokers.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No brokers yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)" }}>
                {["Name", "Company", "Phone", "Email", "Vehicles", "Added", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brokers.map((b) => (
                <tr key={b.id} className="border-b last:border-0 transition" style={{ borderColor: "var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td className="px-5 py-3.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>{b.name}</td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-secondary)" }}>{b.firma || "—"}</td>
                  <td className="px-5 py-3.5 text-sm">
                    {b.telefon ? (
                      <a href={`tel:${b.telefon}`} style={{ color: "var(--accent)" }} className="hover:underline">{b.telefon}</a>
                    ) : <span style={{ color: "var(--text-secondary)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    {b.email ? (
                      <a href={`mailto:${b.email}`} style={{ color: "var(--accent)" }} className="hover:underline">{b.email}</a>
                    ) : <span style={{ color: "var(--text-secondary)" }}>—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold"
                      style={{ backgroundColor: "var(--accent-subtle)", color: "var(--text-primary)" }}>
                      {b.vehicle_count}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {new Date(b.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditingBroker(b); setIsModalOpen(true); }} style={{ color: "var(--accent)" }} className="hover:opacity-70 transition"><EditIcon /></button>
                      <button onClick={() => deleteBroker(b)} style={{ color: "var(--error)" }} className="hover:opacity-70 transition"><DeleteIcon /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>Loading…</p>
        ) : brokers.length === 0 ? (
          <p className="text-center text-sm" style={{ color: "var(--text-tertiary)" }}>No brokers yet</p>
        ) : (
          brokers.map((b) => (
            <div key={b.id} className="rounded-xl border p-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{b.name}</p>
                  {b.firma && <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{b.firma}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingBroker(b); setIsModalOpen(true); }} style={{ color: "var(--accent)" }} className="p-1.5"><EditIcon /></button>
                  <button onClick={() => deleteBroker(b)} style={{ color: "var(--error)" }} className="p-1.5"><DeleteIcon /></button>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {b.telefon && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-tertiary)" }}>Phone</span>
                    <a href={`tel:${b.telefon}`} style={{ color: "var(--accent)" }} className="hover:underline">{b.telefon}</a>
                  </div>
                )}
                {b.email && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-tertiary)" }}>Email</span>
                    <a href={`mailto:${b.email}`} style={{ color: "var(--accent)" }}>{b.email}</a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-tertiary)" }}>Vehicles</span>
                  <span style={{ color: "var(--text-primary)" }}>{b.vehicle_count}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <BrokerModal
          broker={editingBroker}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => { setIsModalOpen(false); fetchBrokers(); }}
        />
      )}
    </div>
  );
}

/* ─── Modal ────────────────────────────────────────────────────────────────── */
function BrokerModal({ broker, onClose, onSuccess }: {
  broker: Broker | null; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: broker?.name || "",
    firma: broker?.firma || "",
    telefon: broker?.telefon || "",
    email: broker?.email || "",
    notizen: broker?.notizen || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSubmitting(true); setError("");
    try {
      const method = broker ? "PUT" : "POST";
      const url = broker ? `/api/brokers/${broker.id}` : "/api/brokers";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), firma: form.firma.trim() || null, telefon: form.telefon.trim() || null, email: form.email.trim() || null, notizen: form.notizen.trim() || null }),
      });
      if (res.ok) onSuccess();
      else { const d = await res.json() as { error?: string }; setError(d.error || "Failed to save"); }
    } catch { setError("Failed to save"); }
    finally { setSubmitting(false); }
  }

  const inputStyle: React.CSSProperties = { backgroundColor: "var(--surface-subtle)", borderColor: "var(--border)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
      <div className="w-full max-w-md rounded-xl border shadow-xl flex flex-col overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            {broker ? "Edit broker" : "Add broker"}
          </h2>
          <button onClick={onClose} style={{ color: "var(--text-tertiary)" }} className="hover:opacity-70 transition"><CloseIcon /></button>
        </div>

        <div className="p-5 space-y-4">
          {([ ["Name *", "name", "text", "Max Müller"], ["Company", "firma", "text", "Müller Sportwagen GmbH"], ["Phone", "telefon", "tel", "+49 69 123456"], ["Email", "email", "email", "info@example.de"] ] as [string, keyof typeof form, string, string][]).map(([label, field, type, placeholder]) => (
            <div key={field}>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
              <input type={type} value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} placeholder={placeholder}
                className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                style={inputStyle}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>Notes</label>
            <textarea value={form.notizen} onChange={(e) => setForm((p) => ({ ...p, notizen: e.target.value }))}
              placeholder="Additional information…"
              className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none min-h-20 resize-none"
              style={inputStyle}
            />
          </div>
          {error && <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
        </div>

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
