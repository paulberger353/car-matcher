"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const IS_ADMIN_BUTTON_VISIBLE = true;

type Vehicle = {
  id: number;
  marke: string;
  modell: string;
  baujahr: number | null;
  km_stand: number | null;
  farbe: string | null;
  broker_name: string | null;
  notizen: string | null;
};

const CarIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function HomePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"angebot" | "gesuch">("angebot");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    checkAdminStatus();
    fetchVehicles();
  }, []);

  async function checkAdminStatus() {
    try {
      const res = await fetch("/api/vehicles?limit=1");
      setIsAdmin(res.ok);
    } catch {
      setIsAdmin(false);
    }
  }

  async function fetchVehicles() {
    try {
      const params = new URLSearchParams();
      params.set("typ", activeTab);
      if (searchTerm) {
        params.set("search", searchTerm);
      }

      const res = await fetch(`/api/public/vehicles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(fetchVehicles, 300);
    return () => clearTimeout(timer);
  }, [activeTab, searchTerm]);

  const filteredVehicles = vehicles;

  return (
    <div className="min-h-screen bg-[#0f0f12]">
      {/* Header */}
      <header className="bg-[#16161a] border-b border-[#2a2a35] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
                <CarIcon />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#f0f0f5]">CarMatcher</h1>
                <p className="text-xs text-[#9898a8]">Fahrzeugangebote & Suchen</p>
              </div>
            </div>

            {/* Admin Button */}
            {IS_ADMIN_BUTTON_VISIBLE && isAdmin && (
              <button
                onClick={() => router.push("/dashboard")}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 transition text-sm font-medium"
              >
                <PlusIcon />
                <span>Fahrzeug hinzufügen</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Tabs */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Nach Marke oder Modell suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-[#1e1e24] border border-[#2a2a35] rounded-lg text-[#f0f0f5] placeholder-[#9898a8] focus:outline-none focus:border-[#8b5cf6] transition"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {(["angebot", "gesuch"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  activeTab === tab
                    ? tab === "angebot"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-blue-500 text-white"
                    : "bg-[#1e1e24] text-[#9898a8] hover:text-[#f0f0f5]"
                }`}
              >
                {tab === "angebot" ? "🚗 Angebote" : "🔍 Suchen"}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#9898a8]">Wird geladen...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9898a8]">Keine Fahrzeuge gefunden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-[#1e1e24] border border-[#2a2a35] rounded-xl p-6 hover:border-[#8b5cf6] transition"
              >
                {/* Marke & Modell */}
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-[#f0f0f5]">
                    {vehicle.marke}
                  </h3>
                  <p className="text-lg text-[#9898a8]">{vehicle.modell}</p>
                </div>

                {/* Info Grid */}
                <div className="space-y-3 mb-4 pb-4 border-b border-[#2a2a35]">
                  {vehicle.baujahr && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9898a8]">Baujahr:</span>
                      <span className="text-[#f0f0f5]">{vehicle.baujahr}</span>
                    </div>
                  )}
                  {vehicle.km_stand !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9898a8]">Kilometerstand:</span>
                      <span className="text-[#f0f0f5]">
                        {vehicle.km_stand.toLocaleString("de-DE")} km
                      </span>
                    </div>
                  )}
                  {vehicle.farbe && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9898a8]">Farbe:</span>
                      <span className="text-[#f0f0f5]">{vehicle.farbe}</span>
                    </div>
                  )}
                </div>

                {/* Broker */}
                {vehicle.broker_name && (
                  <div className="mb-3 text-sm">
                    <p className="text-[#9898a8]">Kontakt:</p>
                    <p className="text-[#f0f0f5] font-medium">
                      {vehicle.broker_name}
                    </p>
                  </div>
                )}

                {/* Notizen */}
                {vehicle.notizen && (
                  <div className="text-sm">
                    <p className="text-[#9898a8]">Notizen:</p>
                    <p className="text-[#f0f0f5] mt-1 line-clamp-2">
                      {vehicle.notizen}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
