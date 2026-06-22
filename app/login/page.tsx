"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false); // State für Sichtbarkeit
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || "Fehler beim Login");
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
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

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full bg-neutral-800 text-white rounded-lg px-4 py-3 outline-none border border-neutral-700 focus:border-neutral-500 transition pr-12"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
              aria-label={showPassword ? "Passwort verbergen" : "Passwort zeigen"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-white text-black font-semibold rounded-lg py-3 hover:bg-neutral-200 transition disabled:opacity-50"
          >
            {loading ? "..." : "Einloggen"}
          </button>

          <button
            type="button"
            onClick={() => { setUsername("demo"); setPassword("demo1234"); }}
            className="text-neutral-400 text-sm border border-neutral-700 rounded-lg py-2 hover:border-neutral-500 hover:text-neutral-200 transition"
          >
            Fill demo credentials
          </button>
        </div>
      </div>
    </div>
  );
}
