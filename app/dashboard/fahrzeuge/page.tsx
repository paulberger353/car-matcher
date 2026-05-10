"use client";

import { useState, useEffect } from "react";

type Vehicle = {
  id: number;
  typ: string;
  marke: string;
  modell: string;
  baujahr: number | null;
  km_stand: number | null;
  preis: number | null;
  broker_name: string | null;
  created_at: string;
};

type Broker = {
  id: number;
  name: string;
};

export default function FahrzeugeSeite() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [filter, setFilter] = useState("alle");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"parse" | "manual">("parse");
  const [loading, setLoading] = useState(true);

  // Fetch vehicles and brokers
  useEffect(() => {
    async function fetchData() {
      try {
        const [vehiclesRes, brokersRes] = await Promise.all([
          fetch("/api/vehicles"),
          fetch("/api/brokers"),
        ]);

        if (vehiclesRes.ok) {
          const data = await vehiclesRes.json();
          setVehicles(data.vehicles || []);
        }

        if (brokersRes.ok) {
          const data = await brokersRes.json();
          setBrokers(data.brokers || []);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) => filter === "alle" || v.typ === filter
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Fahrzeuge</h1>
          <p className="text-neutral-400 mt-1">
            {filteredVehicles.length} Fahrzeuge
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
        >
          + Fahrzeug hinzufügen
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["alle", "angebot", "gesuch"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition ${
              filter === f
                ? "bg-blue-500 text-white"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {f === "alle" ? "Alle" : f === "angebot" ? "Angebote" : "Gesuche"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-neutral-400">
            Lädt...
          </div>
        ) : filteredVehicles.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-800/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Typ
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Marke
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Modell
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Baujahr
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  KM
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Preis
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Broker
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-neutral-400">
                  Datum
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-neutral-800 hover:bg-neutral-800/50 transition"
                >
                  <td className="px-6 py-3 text-sm text-white capitalize">
                    {vehicle.typ}
                  </td>
                  <td className="px-6 py-3 text-sm text-white">
                    {vehicle.marke}
                  </td>
                  <td className="px-6 py-3 text-sm text-white">
                    {vehicle.modell}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {vehicle.baujahr || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {vehicle.km_stand
                      ? `${vehicle.km_stand.toLocaleString("de-DE")}`
                      : "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {vehicle.preis
                      ? `€${vehicle.preis.toLocaleString("de-DE")}`
                      : "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {vehicle.broker_name || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-neutral-400">
                    {new Date(vehicle.created_at).toLocaleDateString("de-DE")}
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

      {/* Modal */}
      {isModalOpen && (
        <VehicleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          brokers={brokers}
          onSuccess={() => {
            setIsModalOpen(false);
            // Refresh vehicles
            fetch("/api/vehicles")
              .then((r) => r.json())
              .then((d) => setVehicles(d.vehicles || []));
          }}
        />
      )}
    </div>
  );
}

function VehicleModal({
  isOpen,
  onClose,
  brokers,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  brokers: Broker[];
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"parse" | "manual">("parse");
  const [parseText, setParseText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const [form, setForm] = useState({
    typ: "angebot",
    marke: "",
    modell: "",
    baujahr: "",
    km_stand: "",
    preis: "",
    farbe: "",
    broker_id: "",
    notizen: "",
  });

  const [submitting, setSubmitting] = useState(false);

  async function handleParse() {
    setParsing(true);
    setParseError("");

    try {
      const res = await fetch("/api/vehicles/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parseText }),
      });

      const data = await res.json();

      if (data.data) {
        setForm((prev) => ({
          ...prev,
          ...(data.data.marke && { marke: data.data.marke }),
          ...(data.data.modell && { modell: data.data.modell }),
          ...(data.data.baujahr && {
            baujahr: data.data.baujahr.toString(),
          }),
          ...(data.data.km_stand && {
            km_stand: data.data.km_stand.toString(),
          }),
          ...(data.data.preis && { preis: data.data.preis.toString() }),
          ...(data.data.farbe && { farbe: data.data.farbe }),
          ...(data.data.typ && { typ: data.data.typ }),
          ...(data.data.notizen && { notizen: data.data.notizen }),
        }));
        setActiveTab("manual");
      }

      if (data.error) {
        setParseError(
          data.error || "Parse nicht möglich - bitte manuell ausfüllen"
        );
      }
    } catch (error) {
      setParseError("Fehler beim Parsen");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit() {
    if (!form.marke || !form.modell) {
      setParseError("Marke und Modell sind erforderlich");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          baujahr: form.baujahr ? parseInt(form.baujahr) : null,
          km_stand: form.km_stand ? parseInt(form.km_stand) : null,
          preis: form.preis ? parseInt(form.preis) : null,
          broker_id: form.broker_id ? parseInt(form.broker_id) : null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setParseError(data.error || "Fehler beim Speichern");
      }
    } catch (error) {
      setParseError("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Fahrzeug hinzufügen
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-neutral-800">
            <button
              onClick={() => setActiveTab("parse")}
              className={`px-4 py-2 font-medium transition ${
                activeTab === "parse"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              KI-Parse
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-4 py-2 font-medium transition ${
                activeTab === "manual"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Manuell
            </button>
          </div>

          {/* Parse Tab */}
          {activeTab === "parse" && (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Text zum Parsen
                </label>
                <textarea
                  value={parseText}
                  onChange={(e) => setParseText(e.target.value)}
                  placeholder="Füge Fahrzeugtext ein (z.B. aus E-Mails, Angeboten, etc.)"
                  className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-blue-500 transition min-h-40"
                />
              </div>

              {parseError && (
                <p className="text-red-400 text-sm">{parseError}</p>
              )}

              <button
                onClick={handleParse}
                disabled={parsing || !parseText}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {parsing ? "Lädt..." : "Automatisch ausfüllen"}
              </button>
            </div>
          )}

          {/* Manual Tab */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Typ *
                  </label>
                  <select
                    value={form.typ}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, typ: e.target.value }))
                    }
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  >
                    <option value="angebot">Angebot</option>
                    <option value="gesuch">Gesuch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Marke *
                  </label>
                  <input
                    type="text"
                    value={form.marke}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, marke: e.target.value }))
                    }
                    placeholder="z.B. BMW"
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Modell *
                  </label>
                  <input
                    type="text"
                    value={form.modell}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, modell: e.target.value }))
                    }
                    placeholder="z.B. 3er"
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Baujahr
                  </label>
                  <input
                    type="number"
                    value={form.baujahr}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, baujahr: e.target.value }))
                    }
                    placeholder="z.B. 2020"
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Kilometerstand
                  </label>
                  <input
                    type="number"
                    value={form.km_stand}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, km_stand: e.target.value }))
                    }
                    placeholder="z.B. 50000"
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Preis (€)
                  </label>
                  <input
                    type="number"
                    value={form.preis}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, preis: e.target.value }))
                    }
                    placeholder="z.B. 25000"
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Farbe
                  </label>
                  <input
                    type="text"
                    value={form.farbe}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, farbe: e.target.value }))
                    }
                    placeholder="z.B. Schwarz"
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Broker
                  </label>
                  <select
                    value={form.broker_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        broker_id: e.target.value,
                      }))
                    }
                    className="w-full bg-neutral-800 text-white rounded-lg px-4 py-2 outline-none border border-neutral-700 focus:border-blue-500 transition"
                  >
                    <option value="">-- Wählen --</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-blue-500 transition min-h-24"
                />
              </div>

              {parseError && (
                <p className="text-red-400 text-sm">{parseError}</p>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !form.marke || !form.modell}
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
          )}
        </div>
      </div>
    </div>
  );
}
