"use client";

import { useState, useEffect } from "react";

type Broker = {
  id: number;
  name: string;
  telefon: string | null;
  email: string | null;
  firma: string | null;
  vehicle_count: number;
  created_at: string;
};

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
        const data = await res.json();
        setBrokers(data.brokers || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(broker?: Broker) {
    if (broker) {
      setEditingBroker(broker);
    } else {
      setEditingBroker(null);
    }
    setIsModalOpen(true);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Broker</h1>
          <p className="text-neutral-400 mt-1">{brokers.length} Broker</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
        >
          + Broker hinzufügen
        </button>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-neutral-400">
            Lädt...
          </div>
        ) : brokers.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-800/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Firma
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Fahrzeuge
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {brokers.map((broker) => (
                <tr
                  key={broker.id}
                  className="border-b border-neutral-800 hover:bg-neutral-800/50 transition"
                >
                  <td className="px-6 py-3 text-sm text-white">{broker.name}</td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {broker.telefon || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {broker.email || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {broker.firma || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {broker.vehicle_count}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {new Date(broker.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <button
                      onClick={() => openModal(broker)}
                      className="text-blue-400 hover:text-blue-300 transition"
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-8 text-center text-neutral-400">
            Keine Broker vorhanden
          </div>
        )}
      </div>

      {/* Modal */}
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
    notizen: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        const data = await res.json();
        setError(data.error || "Fehler beim Speichern");
      }
    } catch (error) {
      setError("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-md">
        <div className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {broker ? "Broker bearbeiten" : "Broker hinzufügen"}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="z.B. Max Mustermann"
              className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Telefon
            </label>
            <input
              type="tel"
              value={form.telefon}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, telefon: e.target.value }))
              }
              placeholder="z.B. +49 123 456789"
              className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="z.B. max@example.com"
              className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Firma
            </label>
            <input
              type="text"
              value={form.firma}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, firma: e.target.value }))
              }
              placeholder="z.B. AutoX GmbH"
              className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              Notizen
            </label>
            <textarea
              value={form.notizen}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notizen: e.target.value }))
              }
              placeholder="Zusätzliche Notizen"
              className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-blue-500 transition min-h-20"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.name}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Speichert..." : "Speichern"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-2 rounded-lg transition"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
