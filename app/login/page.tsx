"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const LogoIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
    <rect x="9" y="11" width="14" height="10" rx="2" />
    <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

export default function LoginPage() {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
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
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Connection error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Brand panel (desktop only) ───────────────────────────────── */}
      <div
        className="hidden md:flex w-1/2 flex-col justify-between p-12"
        style={{ backgroundColor: "#07283f" }}
      >
        {/* Top logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#7bbfc7" }}
          >
            <LogoIcon />
          </div>
          <span className="text-white font-semibold text-base">CarMatcher</span>
        </div>

        {/* Center tagline */}
        <div>
          <p className="text-white text-2xl font-semibold leading-snug mb-3">
            Vehicle brokerage,<br />managed.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)" }} className="text-sm leading-relaxed max-w-xs">
            Match listings with buyer requests automatically. Track brokers, deals, and match quality in one place.
          </p>
        </div>

        {/* Footer */}
        <p style={{ color: "rgba(255,255,255,0.25)" }} className="text-xs">
          © {new Date().getFullYear()} paulberg-software.de — Showcase project
        </p>
      </div>

      {/* ── Form panel ──────────────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-8"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 md:hidden">
            <div
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ backgroundColor: "#07283f", color: "#7bbfc7" }}
            >
              <LogoIcon />
            </div>
            <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              CarMatcher
            </span>
          </div>

          <h1 className="text-2xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            Sign in
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
            CarMatcher · Demo access
          </p>

          <div className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Username
              </label>
              <input
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition border"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-lg px-3 py-2.5 pr-10 text-sm outline-none transition border"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: "var(--text-tertiary)" }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>
            )}

            {/* Sign in */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {/* Fill demo credentials */}
            <button
              type="button"
              onClick={() => { setUsername("demo"); setPassword("demo1234"); }}
              className="w-full rounded-lg py-2 text-sm transition border"
              style={{
                color: "var(--text-secondary)",
                borderColor: "var(--border)",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent-text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              Fill demo credentials
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
