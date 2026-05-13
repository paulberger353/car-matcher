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
  farbe: string | null;
  broker_id: number | null;
  broker_name: string | null;
  notizen: string | null;
  created_at: string;
};

type Broker = {
  id: number;
  name: string;
  vehicle_count: number;
};

type ParsedVehicleData = {
  typ?: string | null;
  marke?: string | null;
  modell?: string | null;
  baujahr?: number | null;
  km_stand?: number | null;
  preis?: number | null;
  farbe?: string | null;
  notizen?: string | null;
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

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function FahrzeugeSeite() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [filter, setFilter] = useState("alle");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [vehiclesRes, brokersRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/brokers"),
      ]);

      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json() as { vehicles: Vehicle[] };
        setVehicles(data.vehicles || []);
      }

      if (brokersRes.ok) {
        const data = await brokersRes.json() as { brokers: Broker[] };
        setBrokers(data.brokers || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  }

  async function deleteVehicle(id: number) {
    if (!confirm("Fahrzeug wirklich löschen?")) return;

    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
      } else {
        setError("Fehler beim Löschen");
      }
    } catch (error) {
      setError("Fehler beim Löschen");
    }
  }

  const filteredVehicles = vehicles.filter(
    (v) => filter === "alle" || v.typ === filter
  );

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-[#f0f0f5] mb-1">Fahrzeuge</h1>
          <p className="text-[#9898a8]">{filteredVehicles.length} Fahrzeuge</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsModalOpen(true);
          }}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 md:px-6 py-2.5 rounded-lg transition flex items-center justify-center md:justify-start gap-2 font-medium"
        >
          <PlusIcon />
          <span>Fahrzeug hinzufügen</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["alle", "angebot", "gesuch"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition font-medium ${
              filter === f
                ? "bg-[#8b5cf6] text-white"
                : "bg-[#1e1e24] text-[#9898a8] hover:text-[#f0f0f5]"
            }`}
          >
            {f === "alle" ? "Alle" : f === "angebot" ? "Angebote" : "Suchen"}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444] text-[#fca5a5] rounded-lg">
          {error}
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-[#1e1e24] border border-[#2a2a35] rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-[#9898a8]">Lädt...</div>
        ) : filteredVehicles.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a35] bg-[#2a2a35]/40">
                {["Typ", "Marke", "Modell", "Baujahr", "KM", "Preis", "Broker", "Datum", ""].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-[#9898a8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-[#2a2a35] hover:bg-[#2a2a35]/50 transition">
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                        vehicle.typ === "angebot"
                          ? "bg-[#8b5cf6]/20 text-[#c4b5fd]"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {vehicle.typ === "angebot" ? "Angebot" : "Gesucht"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#f0f0f5]">{vehicle.marke}</td>
                  <td className="px-6 py-4 text-sm text-[#f0f0f5]">{vehicle.modell}</td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">{vehicle.baujahr || "—"}</td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">
                    {vehicle.km_stand ? `${vehicle.km_stand.toLocaleString("de-DE")}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">
                    {vehicle.preis ? `${vehicle.preis.toLocaleString("de-DE")} €` : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">{vehicle.broker_name || "—"}</td>
                  <td className="px-6 py-4 text-sm text-[#9898a8]">
                    {new Date(vehicle.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setIsModalOpen(true);
                      }}
                      className="text-[#8b5cf6] hover:text-[#c4b5fd] transition"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => deleteVehicle(vehicle.id)}
                      className="text-[#ef4444] hover:text-[#fca5a5] transition"
                    >
                      <DeleteIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center text-[#9898a8]">Keine Fahrzeuge vorhanden</div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-[#9898a8]">Lädt...</div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center text-[#9898a8]">Keine Fahrzeuge vorhanden</div>
        ) : (
          filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-[#1e1e24] border border-[#2a2a35] rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[#f0f0f5] font-bold text-lg">
                    {vehicle.marke} {vehicle.modell}
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded-md text-xs font-semibold mt-1 ${
                      vehicle.typ === "angebot"
                        ? "bg-[#8b5cf6]/20 text-[#c4b5fd]"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {vehicle.typ === "angebot" ? "Angebot" : "Gesucht"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingVehicle(vehicle);
                      setIsModalOpen(true);
                    }}
                    className="text-[#8b5cf6] hover:text-[#c4b5fd] transition p-2"
                  >
                    <EditIcon />
                  </button>
                  <button
                    onClick={() => deleteVehicle(vehicle.id)}
                    className="text-[#ef4444] hover:text-[#fca5a5] transition p-2"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {vehicle.baujahr && (
                  <div className="flex justify-between">
                    <span className="text-[#9898a8]">Baujahr:</span>
                    <span className="text-[#f0f0f5]">{vehicle.baujahr}</span>
                  </div>
                )}
                {vehicle.km_stand && (
                  <div className="flex justify-between">
                    <span className="text-[#9898a8]">KM:</span>
                    <span className="text-[#f0f0f5]">{vehicle.km_stand.toLocaleString("de-DE")}</span>
                  </div>
                )}
                {vehicle.preis && (
                  <div className="flex justify-between">
                    <span className="text-[#9898a8]">Preis:</span>
                    <span className="text-[#f0f0f5]">{vehicle.preis.toLocaleString("de-DE")} €</span>
                  </div>
                )}
                {vehicle.farbe && (
                  <div className="flex justify-between">
                    <span className="text-[#9898a8]">Farbe:</span>
                    <span className="text-[#f0f0f5]">{vehicle.farbe}</span>
                  </div>
                )}
                {vehicle.broker_name && (
                  <div className="flex justify-between">
                    <span className="text-[#9898a8]">Broker:</span>
                    <span className="text-[#f0f0f5]">{vehicle.broker_name}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <VehicleModal
          vehicle={editingVehicle}
          brokers={brokers}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function VehicleModal({
  vehicle,
  brokers,
  onClose,
  onSuccess,
}: {
  vehicle: Vehicle | null;
  brokers: Broker[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"parse" | "manual">("manual");
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
    if (!parseText.trim()) {
      setError("Bitte Text eingeben");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const res = await fetch("/api/vehicles/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: parseText }),
      });

      const data = await res.json() as { data?: ParsedVehicleData; error?: string };

      if (data.data && Object.keys(data.data).length > 0) {
        const d = data.data;
        setForm((prev) => ({
          typ: d.typ || "angebot",
          marke: d.marke || "",
          modell: d.modell || "",
          baujahr: d.baujahr != null ? String(d.baujahr) : "",
          km_stand: d.km_stand != null ? String(d.km_stand) : "",
          preis: d.preis != null ? String(d.preis) : "",
          farbe: d.farbe || "",
          broker_id: prev.broker_id,
          notizen: d.notizen || "",
        }));
        setActiveTab("manual");
        setParseText("");
      } else if (data.error) {
        setError(data.error);
      }
    } catch (error) {
      setError("Fehler beim Parsen");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit() {
    if (!form.marke || !form.modell) {
      setError("Marke und Modell sind erforderlich");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const method = vehicle ? "PUT" : "POST";
      const url = vehicle ? `/api/vehicles/${vehicle.id}` : "/api/vehicles";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ: form.typ,
          marke: form.marke,
          modell: form.modell,
          baujahr: form.baujahr ? parseInt(form.baujahr) : null,
          km_stand: form.km_stand ? parseInt(form.km_stand) : null,
          preis: form.preis ? parseInt(form.preis) : null,
          farbe: form.farbe || null,
          broker_id: form.broker_id ? parseInt(form.broker_id) : null,
          notizen: form.notizen || null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || "Fehler beim Speichern");
      }
    } catch (error) {
      setError("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 md:p-0">
      <div className="bg-[#1e1e24] border border-[#2a2a35] rounded-xl w-full md:max-w-2xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="border-b border-[#2a2a35] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#1e1e24]">
          <h2 className="text-xl font-semibold text-[#f0f0f5]">
            {vehicle ? "Fahrzeug bearbeiten" : "Fahrzeug hinzufügen"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#9898a8] hover:text-[#f0f0f5] transition text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tabs */}
          {!vehicle && (
            <div className="flex gap-2 border-b border-[#2a2a35]">
              <button
                onClick={() => setActiveTab("manual")}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === "manual"
                    ? "border-b-2 border-[#8b5cf6] text-[#f0f0f5]"
                    : "text-[#9898a8]"
                }`}
              >
                Manuell
              </button>
              <button
                onClick={() => setActiveTab("parse")}
                className={`px-4 py-2 font-medium transition ${
                  activeTab === "parse"
                    ? "border-b-2 border-[#8b5cf6] text-[#f0f0f5]"
                    : "text-[#9898a8]"
                }`}
              >
                KI-Parse
              </button>
            </div>
          )}

          {/* Parse Tab */}
          {activeTab === "parse" && !vehicle && (
            <div className="space-y-4">
              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder="Text eingeben (z.B. Fahrtgestellung aus Website kopieren)"
                className="w-full bg-[#2a2a35] text-[#f0f0f5] rounded-lg px-4 py-3 outline-none border border-[#3a3a40] focus:border-[#8b5cf6] transition min-h-24"
              />
              <button
                onClick={handleParse}
                disabled={parsing}
                className="w-full bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition font-medium"
              >
                {parsing ? "Wird geparst..." : "Mit KI analysieren"}
              </button>
            </div>
          )}

          {/* Manual Tab */}
          {activeTab === "manual" && (
            <div className="space-y-4">
              {/* Typ Toggle - großer Toggle am Anfang */}
              <div>
                <label className="block text-sm font-medium text-[#9898a8] mb-3">
                  Fahrzeugtyp *
                </label>
                <div className="flex gap-4">
                  {(["angebot", "gesuch"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((prev) => ({ ...prev, typ: t }))}
                      className={`flex-1 px-4 py-4 rounded-lg transition font-medium text-lg ${
                        form.typ === t
                          ? "bg-[#8b5cf6] text-white"
                          : "bg-[#2a2a35] text-[#9898a8] hover:text-[#f0f0f5]"
                      }`}
                    >
                      {t === "angebot" ? "🚗 Angebot" : "🔍 Gesucht"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Marke *"
                  value={form.marke}
                  onChange={(e) => setForm((prev) => ({ ...prev, marke: e.target.value }))}
                  placeholder="BMW"
                />
                <InputField
                  label="Modell *"
                  value={form.modell}
                  onChange={(e) => setForm((prev) => ({ ...prev, modell: e.target.value }))}
                  placeholder="320i"
                />
                <InputField
                  label="Baujahr"
                  type="number"
                  value={form.baujahr}
                  onChange={(e) => setForm((prev) => ({ ...prev, baujahr: e.target.value }))}
                  placeholder="2020"
                />
                <InputField
                  label="Kilometerstand"
                  type="number"
                  value={form.km_stand}
                  onChange={(e) => setForm((prev) => ({ ...prev, km_stand: e.target.value }))}
                  placeholder="50000"
                />
                <InputField
                  label="Preis (€)"
                  type="number"
                  value={form.preis}
                  onChange={(e) => setForm((prev) => ({ ...prev, preis: e.target.value }))}
                  placeholder="25000"
                />
                <InputField
                  label="Farbe"
                  value={form.farbe}
                  onChange={(e) => setForm((prev) => ({ ...prev, farbe: e.target.value }))}
                  placeholder="Schwarz"
                />
              </div>

              {/* Broker Select */}
              <div>
                <label className="block text-sm font-medium text-[#9898a8] mb-2">
                  Broker
                </label>
                <select
                  value={form.broker_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, broker_id: e.target.value }))}
                  className="w-full bg-[#2a2a35] text-[#f0f0f5] rounded-lg px-4 py-2 outline-none border border-[#3a3a40] focus:border-[#8b5cf6] transition"
                >
                  <option value="">— Keine Auswahl —</option>
                  {brokers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notizen Textarea */}
              <div>
                <label className="block text-sm font-medium text-[#9898a8] mb-2">
                  Notizen
                </label>
                <textarea
                  value={form.notizen}
                  onChange={(e) => setForm((prev) => ({ ...prev, notizen: e.target.value }))}
                  placeholder="Zusätzliche Informationen"
                  className="w-full bg-[#2a2a35] text-[#f0f0f5] rounded-lg px-4 py-3 outline-none border border-[#3a3a40] focus:border-[#8b5cf6] transition min-h-20"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444] text-[#fca5a5] rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2a2a35] px-6 py-4 flex gap-3 sticky bottom-0 bg-[#1e1e24]">
          <button
            onClick={onClose}
            className="flex-1 bg-[#2a2a35] hover:bg-[#3a3a40] text-[#f0f0f5] px-4 py-2 rounded-lg transition font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            {submitting ? "Speichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#9898a8] mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#2a2a35] text-[#f0f0f5] rounded-lg px-4 py-2 outline-none border border-[#3a3a40] focus:border-[#8b5cf6] transition"
      />
    </div>
  );
}
