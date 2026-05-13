"use client";

import { useState, useEffect } from "react";

type Broker = {
  id: number;
  name: string;
  telefon: string | null;
  email: string | null;
  firma: string | null;
  notizen: string | null;
  vehicle_count: number;
  created_at: string;
};

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

export default function BrokerSeite() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  useEffect(() => {
    fetchBrokers();
  }, []);

  async function fetchBrokers() {
    try {
      const res = await fetch("/api/brokers");
      if (res.ok) {
        const data = await res.json() as { brokers: Broker[] };
        setBrokers(data.brokers || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(broker?: Broker) {
    setEditingBroker(broker ?? null);
    setIsModalOpen(true);
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#f0f0f5] mb-1">Broker</h1>
          <p className="text-[#9898a8]">{brokers.length} Broker</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 md:px-6 py-2.5 rounded-lg transition flex items-center justify-center md:justify-start gap-2 font-medium"
        >
          <PlusIcon />
          <span>Broker hinzufügen</span>
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-[#1e1e24] border border-[#2a2a35] rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-[#9898a8]">Lädt...</div>
        ) : brokers.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a35] bg-[#2a2a35]/40">
                {["Name", "Telefon", "Email", "Firma", "Fahrzeuge", "Erstellt", ""].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-[#9898a8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brokers.map((broker) => (
                <tr key={broker.id} className="border-b border-[#2a2a35] hover:bg-[#2a2a35]/50 transition">
                  <td className="px-6 py-4 text-sm font-medium text-[#f0f0f5]">{broker.name}</td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">{broker.telefon || "—"}</td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">{broker.email || "—"}</td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">{broker.firma || "—"}</td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">
                    <span className="bg-[#8b5cf6]/20 text-[#c4b5fd] px-2 py-0.5 rounded text-xs font-semibold">
                      {broker.vehicle_count}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">
                    {new Date(broker.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => openModal(broker)}
                      className="text-[#8b5cf6] hover:text-[#c4b5fd] transition"
                    >
                      <EditIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-[#9898a8]">Keine Broker vorhanden</div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-[#9898a8]">Lädt...</div>
        ) : brokers.length === 0 ? (
          <div className="text-center text-[#9898a8]">Keine Broker vorhanden</div>
        ) : (
          brokers.map((broker) => (
            <div key={broker.id} className="bg-[#1e1e24] border border-[#2a2a35] rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[#f0f0f5] font-bold text-lg">{broker.name}</p>
                  {broker.firma && (
                    <p className="text-[#9898a8] text-sm mt-0.5">{broker.firma}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-[#8b5cf6]/20 text-[#c4b5fd] px-2 py-0.5 rounded text-xs font-semibold">
                    {broker.vehicle_count} Fzg.
                  </span>
                  <button
                    onClick={() => openModal(broker)}
                    className="text-[#8b5cf6] hover:text-[#c4b5fd] transition p-1"
                  >
                    <EditIcon />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {broker.telefon && (
                  <div className="flex justify-between">
                    <span className="text-[#9898a8]">Telefon</span>
                    <span className="text-[#f0f0f5]">{broker.telefon}</span>
                  </div>
                )}
                {broker.email && (
                  <div className="flex justify-between">
                    <span className="text-[#9898a8]">Email</span>
                    <span className="text-[#f0f0f5] break-all">{broker.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#9898a8]">Erstellt</span>
                  <span className="text-[#9898a8]">
                    {new Date(broker.created_at).toLocaleDateString("de-DE")}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <BrokerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          broker={editingBroker}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchBrokers();
          }}
        />
      )}
    </div>
  );
}

function BrokerModal({
  isOpen,
  onClose,
  broker,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  broker: Broker | null;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: broker?.name || "",
    telefon: broker?.telefon || "",
    email: broker?.email || "",
    firma: broker?.firma || "",
    notizen: broker?.notizen || "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit() {
    if (!form.name) {
      setError("Name ist erforderlich");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const method = broker ? "PUT" : "POST";
      const url = broker ? `/api/brokers/${broker.id}` : "/api/brokers";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || "Fehler beim Speichern");
      }
    } catch {
      setError("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e24] border border-[#2a2a35] rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="border-b border-[#2a2a35] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#1e1e24]">
          <h2 className="text-xl font-semibold text-[#f0f0f5]">
            {broker ? "Broker bearbeiten" : "Broker hinzufügen"}
          </h2>
          <button onClick={onClose} className="text-[#9898a8] hover:text-[#f0f0f5] transition text-2xl leading-none">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {[
            { label: "Name *", field: "name" as const, type: "text", placeholder: "Max Mustermann" },
            { label: "Telefon", field: "telefon" as const, type: "tel", placeholder: "+49 123 456789" },
            { label: "Email", field: "email" as const, type: "email", placeholder: "max@example.com" },
            { label: "Firma", field: "firma" as const, type: "text", placeholder: "AutoX GmbH" },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-[#9898a8] mb-2">{label}</label>
              <input
                type={type}
                value={form[field]}
                onChange={update(field)}
                placeholder={placeholder}
                className="w-full bg-[#2a2a35] text-[#f0f0f5] rounded-lg px-4 py-2 outline-none border border-[#3a3a40] focus:border-[#8b5cf6] transition"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#9898a8] mb-2">Notizen</label>
            <textarea
              value={form.notizen}
              onChange={update("notizen")}
              placeholder="Zusätzliche Notizen"
              className="w-full bg-[#2a2a35] text-[#f0f0f5] rounded-lg px-4 py-3 outline-none border border-[#3a3a40] focus:border-[#8b5cf6] transition min-h-20"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#ef4444]/10 border border-[#ef4444] text-[#fca5a5] rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-[#2a2a35] hover:bg-[#3a3a40] text-[#f0f0f5] px-4 py-2 rounded-lg transition font-medium"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.name}
              className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition font-medium"
            >
              {submitting ? "Speichert..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
