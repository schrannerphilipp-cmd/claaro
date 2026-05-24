"use client";

import { useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;
const inputClass =
  "c-btn w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30";

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
  const [shakeKey, setShakeKey] = useState(0);

  const reduced = useReducedMotion();

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
      setShakeKey((k) => k + 1); // re-trigger shake animation
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1814] flex items-center justify-center px-4" style={sans}>
      <motion.div
        className="w-full max-w-sm"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo + heading */}
        <motion.div
          className="text-center mb-8"
          initial={reduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="text-2xl font-bold text-[var(--c-accent)] tracking-tight" style={sans}>
            Claaro
          </span>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <h1 className="text-3xl text-white mt-3" style={serif}>
                {mode === "login" ? "Willkommen zurück" : "Konto erstellen"}
              </h1>
              <p className="text-white/40 text-sm mt-2">
                {mode === "login"
                  ? "Mit deinem Claaro-Konto einloggen"
                  : "Neues Claaro-Konto registrieren"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Form */}
        <motion.form
          key={shakeKey}
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
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

          {/* Error with shake */}
          <AnimatePresence>
            {error && (
              <motion.p
                key={`err-${shakeKey}`}
                className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 c-shake"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Info (success) */}
          <AnimatePresence>
            {info && (
              <motion.p
                className="text-xs px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 c-success-pop"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              >
                {info}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            className="c-btn w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--c-accent)" }}
            whileTap={reduced ? {} : { scale: 0.97 }}
            whileHover={reduced ? {} : { brightness: 1.1 } as never}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Bitte warten…
              </span>
            ) : mode === "login" ? "Einloggen" : "Registrieren"}
          </motion.button>
        </motion.form>

        <motion.p
          className="text-center text-sm text-white/40 mt-6"
          initial={reduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {mode === "login" ? "Noch kein Konto?" : "Bereits registriert?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
              setInfo(null);
            }}
            className="c-btn text-[var(--c-accent)] hover:text-[#e05a38] font-medium"
          >
            {mode === "login" ? "Registrieren" : "Einloggen"}
          </button>
        </motion.p>
      </motion.div>
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
