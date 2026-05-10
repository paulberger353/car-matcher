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
        const data = await vehiclesRes.json();
        setVehicles(data.vehicles || []);
      }

      if (brokersRes.ok) {
        const data = await brokersRes.json();
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
    if (!confirm("Fahrzeug wirklich l�schen?")) return;

    try {
      const res = await fetch(`/api/vehicles/$"'{id}'", { method: "DELETE" });
      if (res.ok) {
        setVehicles((prev) => prev.filter((v) => v.id !== id));
      } else {
        setError("Fehler beim L�schen");
      }
    } catch (error) {
      setError("Fehler beim L�schen");
    }
  }

  const filteredVehicles = vehicles.filter(
    (v) => filter === "alle" || v.typ === filter
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#fafafa] mb-1">Fahrzeuge</h1>
          <p className="text-[#a1a1aa]">{filteredVehicles.length} Fahrzeuge</p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsModalOpen(true);
          }}
          className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-[#fafafa] px-6 py-2.5 rounded-lg transition flex items-center gap-2 font-medium"
        >
          <PlusIcon />
          Fahrzeug hinzuf�gen
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        {["alle", "angebot", "gesuch"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition $"'{
              filter === f
                ? "bg-[#8b5cf6] text-[#fafafa]"
                : "bg-[#27272a] text-[#a1a1aa] hover:text-[#fafafa]"
            }'"}
          >
            {f === "alle" ? "Alle" : f === "angebot" ? "Angebote" : "Gesuche"}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 p-4 bg-[#ef4444]/10 border border-[#ef4444] text-[#fca5a5] rounded-lg">{error}</div>}

      <div className="bg-[#1c1c1f] border border-[#27272a] rounded-xl overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-[#a1a1aa]">L�dt...</div>
        ) : filteredVehicles.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#27272a]/40">
                {["Typ", "Marke", "Modell", "Baujahr", "KM", "Preis", "Broker", "Datum", "Aktionen"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold text-[#a1a1aa]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-[#27272a] hover:bg-[#27272a]/30 transition">
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded-md text-xs font-semibold $"'{
                        vehicle.typ === "angebot"
                          ? "bg-[#8b5cf6]/20 text-[#a78bfa]"
                          : "bg-[#3b82f6]/20 text-[#93c5fd]"
                      }'"`}
                    >
                      {vehicle.typ === "angebot" ? "Angebot" : "Gesuch"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#fafafa]">{vehicle.marke}</td>
                  <td className="px-6 py-4 text-sm text-[#fafafa]">{vehicle.modell}</td>
                  <td className="px-6 py-4 text-sm text-[#a1a1aa]">{vehicle.baujahr || "-"}</td>
                  <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                    {vehicle.km_stand ? `${vehicle.km_stand.toLocaleString("de-DE")}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                    {vehicle.preis ? `�${vehicle.preis.toLocaleString("de-DE")}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#a1a1aa]">{vehicle.broker_name || "-"}</td>
                  <td className="px-6 py-4 text-sm text-[#a1a1aa]">
                    {new Date(vehicle.created_at).toLocaleDateString("de-DE")}
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => {
                        setEditingVehicle(vehicle);
                        setIsModalOpen(true);
                      }}
                      className="text-[#8b5cf6] hover:text-[#a78bfa] transition"
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
          <div className="px-6 py-12 text-center text-[#a1a1aa]">Keine Fahrzeuge vorhanden</div>
        )}
      </div>

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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!form.marke || !form.modell) {
      setError("Marke und Modell sind erforderlich");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const method = vehicle ? "PUT" : "POST";
      const url = vehicle ? `/api/vehicles/$"'{vehicle.id}'" : "/api/vehicles";

      const res = await fetch(url, {
        method,
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
        setError(data.error || "Fehler beim Speichern");
      }
    } catch (error) {
      setError("Fehler beim Speichern");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1c1c1f] border border-[#27272a] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-[#27272a] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#1c1c1f]">
          <h2 className="text-xl font-semibold text-[#fafafa]">
            {vehicle ? "Fahrzeug bearbeiten" : "Fahrzeug hinzuf�gen"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#a1a1aa] hover:text-[#fafafa] transition text-2xl"
          >
            ?
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-3">Typ *</label>
            <div className="flex gap-4">
              {["angebot", "gesuch"].map((t) => (
                <button
                  key={t}
                  onClick={() => setForm((prev) => ({ ...prev, typ: t }))}
                  className={`flex-1 px-4 py-3 rounded-lg transition font-medium $"'{
                    form.typ === t
                      ? "bg-[#8b5cf6] text-[#fafafa]"
                      : "bg-[#27272a] text-[#a1a1aa]"
                  }'"}
                >
                  {t === "angebot" ? "?? Angebot" : "?? Gesuch"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Marke *" value={form.marke} onChange={(e) => setForm((prev) => ({ ...prev, marke: e.target.value }))} placeholder="BMW" />
            <InputField label="Modell *" value={form.modell} onChange={(e) => setForm((prev) => ({ ...prev, modell: e.target.value }))} placeholder="320i" />
            <InputField label="Baujahr" type="number" value={form.baujahr} onChange={(e) => setForm((prev) => ({ ...prev, baujahr: e.target.value }))} placeholder="2020" />
            <InputField label="KM" type="number" value={form.km_stand} onChange={(e) => setForm((prev) => ({ ...prev, km_stand: e.target.value }))} placeholder="50000" />
            <InputField label="Preis (�)" type="number" value={form.preis} onChange={(e) => setForm((prev) => ({ ...prev, preis: e.target.value }))} placeholder="25000" />
            <InputField label="Farbe" value={form.farbe} onChange={(e) => setForm((prev) => ({ ...prev, farbe: e.target.value }))} placeholder="Schwarz" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Broker</label>
            <select value={form.broker_id} onChange={(e) => setForm((prev) => ({ ...prev, broker_id: e.target.value }))} className="w-full bg-[#27272a] text-[#fafafa] rounded-lg px-4 py-2 outline-none border border-[#3f3f46] focus:border-[#8b5cf6] transition">
              <option value="">-- Keine Auswahl --</option>
              {brokers.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Notizen</label>
            <textarea value={form.notizen} onChange={(e) => setForm((prev) => ({ ...prev, notizen: e.target.value }))} placeholder="Zus�tzliche Informationen" className="w-full bg-[#27272a] text-[#fafafa] rounded-lg px-4 py-3 outline-none border border-[#3f3f46] focus:border-[#8b5cf6] transition min-h-16" />
          </div>

          {error && <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444] text-[#fca5a5] rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 bg-[#27272a] hover:bg-[#3f3f46] text-[#fafafa] px-4 py-2 rounded-lg transition font-medium">Abbrechen</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-[#fafafa] px-4 py-2 rounded-lg transition font-medium">
              {submitting ? "Speichert..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder }: { label: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#a1a1aa] mb-2">{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-[#27272a] text-[#fafafa] rounded-lg px-4 py-2 outline-none border border-[#3f3f46] focus:border-[#8b5cf6] transition" />
    </div>
  );
}
