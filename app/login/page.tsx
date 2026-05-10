"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Fehler beim Login");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
        <h1 className="text-white text-2xl font-semibold mb-1">Anmelden</h1>
        <p className="text-neutral-500 text-sm mb-8">Interner Zugang · CarMatcher</p>
        <div className="flex flex-col gap-4">
          <input
            className="bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-neutral-500 transition"
            placeholder="Benutzername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-neutral-500 transition"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-white text-black font-semibold rounded-lg py-3 hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {loading ? "..." : "Einloggen"}
          </button>
        </div>
      </div>
    </div>
  );
}