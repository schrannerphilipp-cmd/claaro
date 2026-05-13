"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode]         = useState<"login" | "register">("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = getBrowserClient()!;

    try {
      if (mode === "register") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setInfo("Registrierung erfolgreich – bitte E-Mail bestätigen, dann einloggen.");
        setMode("login");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1814] flex items-center justify-center px-4" style={sans}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#c84b2f] tracking-tight" style={sans}>
            Claaro
          </span>
          <h1 className="text-3xl text-white mt-3" style={serif}>
            {mode === "login" ? "Willkommen zurück" : "Konto erstellen"}
          </h1>
          <p className="text-white/40 text-sm mt-2">
            {mode === "login" ? "Mit deinem Claaro-Konto einloggen" : "Neues Claaro-Konto registrieren"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">E-Mail</label>
            <input
              required
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Passwort</label>
            <input
              required
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#c84b2f" }}
          >
            {loading ? "Bitte warten…" : mode === "login" ? "Einloggen" : "Registrieren"}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          {mode === "login" ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setInfo(null); }}
            className="text-[#c84b2f] hover:text-[#e05a38] transition-colors font-medium"
          >
            {mode === "login" ? "Registrieren" : "Einloggen"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
