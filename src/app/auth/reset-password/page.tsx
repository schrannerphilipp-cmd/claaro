"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;

const inputClass =
  "c-btn w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30";

type Status = "loading" | "ready" | "success" | "expired";

export default function ResetPasswordPage() {
  const router  = useRouter();
  const reduced = useReducedMotion();

  const [status,     setStatus]     = useState<Status>("loading");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) {
      setStatus("expired");
      return;
    }

    const supabase = getBrowserClient()!;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setStatus("ready");
      }
    });

    const timer = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "expired" : s));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);

    if (password.length < 6) {
      setFieldError("Das Passwort muss mindestens 6 Zeichen lang sein.");
      return;
    }
    if (password !== confirm) {
      setFieldError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setSubmitting(true);
    const supabase = getBrowserClient()!;
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("expired") || msg.includes("invalid") || msg.includes("session")) {
        setStatus("expired");
      } else {
        setFieldError("Fehler: " + error.message);
        setSubmitting(false);
      }
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <div
      className="min-h-screen bg-[#241c14] flex items-center justify-center px-4 py-12"
      style={sans}
    >
      <motion.div
        className="w-full max-w-sm"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span
              className="text-2xl font-bold text-[var(--c-accent)] tracking-tight cursor-pointer"
              style={sans}
            >
              Claaro
            </span>
          </Link>
        </div>

        <AnimatePresence mode="wait">

          {/* Loading — überprüft Token */}
          {status === "loading" && (
            <motion.div
              key="loading"
              className="text-center py-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="w-8 h-8 animate-spin mx-auto text-white/25"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-white/35 text-sm mt-3">Link wird überprüft…</p>
            </motion.div>
          )}

          {/* Ready — Formular */}
          {status === "ready" && (
            <motion.div
              key="form"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl text-white" style={serif}>Neues Passwort</h1>
                <p className="text-white/55 text-sm mt-2">
                  Wähle ein sicheres Passwort — mindestens 6 Zeichen.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/55 mb-1.5">
                    Neues Passwort <span className="text-[var(--c-accent)]/70">*</span>
                  </label>
                  <input
                    required
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldError(null); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={6}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/55 mb-1.5">
                    Passwort bestätigen <span className="text-[var(--c-accent)]/70">*</span>
                  </label>
                  <input
                    required
                    type="password"
                    className={inputClass}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setFieldError(null); }}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>

                <AnimatePresence>
                  {fieldError && (
                    <motion.p
                      className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {fieldError}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="c-btn w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--c-accent)" }}
                  whileTap={reduced ? {} : { scale: 0.97 }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Bitte warten…
                    </span>
                  ) : (
                    "Passwort speichern"
                  )}
                </motion.button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="text-[11px] text-white/30 hover:text-white/50 transition-colors"
                  >
                    ← Zurück zum Login
                  </Link>
                </div>
              </form>
            </motion.div>
          )}

          {/* Erfolg */}
          {status === "success" && (
            <motion.div
              key="success"
              className="text-center py-4"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="w-14 h-14 rounded-full bg-teal-500/15 mx-auto mb-5 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl text-white" style={serif}>Passwort gespeichert!</h2>
              <p className="text-white/55 text-sm mt-2">Du wirst gleich weitergeleitet…</p>
            </motion.div>
          )}

          {/* Abgelaufen / ungültig */}
          {status === "expired" && (
            <motion.div
              key="expired"
              className="text-center py-4"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 mx-auto mb-5 flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl text-white" style={serif}>Link abgelaufen</h2>
              <p className="text-white/55 text-sm mt-2 leading-relaxed">
                Dieser Link ist nicht mehr gültig.<br />
                Reset-Links laufen nach 1 Stunde ab.
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 text-sm font-medium text-[var(--c-accent)] hover:text-[#e05a38] transition-colors"
              >
                Neuen Link anfordern →
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}
