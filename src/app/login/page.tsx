"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;

function translateSupabaseError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid email or password"))
    return "E-Mail oder Passwort ist falsch.";
  if (m.includes("email not confirmed"))
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "Diese E-Mail-Adresse ist bereits registriert.";
  if (m.includes("password should be at least") || m.includes("password is too short"))
    return "Das Passwort muss mindestens 6 Zeichen lang sein.";
  if (m.includes("signup is disabled"))
    return "Registrierung ist derzeit nicht möglich.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Zu viele Versuche. Bitte warte kurz und versuche es erneut.";
  if (m.includes("email") && (m.includes("invalid") || m.includes("format")))
    return "Bitte gib eine gültige E-Mail-Adresse ein.";
  return "Anmeldung fehlgeschlagen. Bitte versuche es erneut.";
}

const inputClass =
  "c-btn w-full bg-white/5 border border-white/15 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30";

// ── Social proof data ─────────────────────────────────────────────────────────
const AVATARS = [
  { initials: "SM", color: "#b54a2a" },
  { initials: "TK", color: "#2a7a6a" },
  { initials: "MH", color: "#6a4a2a" },
];

const TRUST_BADGES = [
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    label: "DSGVO-konform",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "30 Tage kostenlos",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l1.9-5.7a8.5 8.5 0 113.8 3.8z" />
      </svg>
    ),
    label: "Aus Deutschland",
  },
];

const REGISTER_USPS = [
  "Keine Kreditkarte erforderlich — kostenlos starten",
  "Compliance-Checklisten sofort einsatzbereit",
  "Jederzeit kündbar, keine Mindestlaufzeit",
];

const TESTIMONIAL = {
  quote:
    "Claaro hat unsere Verwaltung auf ein neues Level gehoben. Dokumentation, Checklisten, Mitarbeiterkommunikation – alles an einem Ort.",
  name: "Sandra M.",
  role: "Inhaberin, Pflegedienst Mitte",
};

// ── Star component ────────────────────────────────────────────────────────────
function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "/dashboard";
  const refCode      = searchParams.get("ref") ?? null;

  const [mode, setMode]         = useState<"login" | "register">(
    searchParams.get("tab") === "register" ? "register" : "login"
  );
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [info, setInfo]                 = useState<string | null>(null);
  const [shakeKey, setShakeKey]         = useState(0);
  const [emailTouched, setEmailTouched]       = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailFieldError =
    emailTouched && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ? "Bitte gib eine gültige E-Mail-Adresse ein."
      : null;
  const passwordFieldError =
    passwordTouched && mode === "register" && password.length > 0 && password.length < 6
      ? "Das Passwort muss mindestens 6 Zeichen lang sein."
      : null;

  const reduced = useReducedMotion();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = getBrowserClient()!;

    try {
      if (mode === "register") {
        const { data: signUpData, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;

        // Persist marketing consent in profiles (after email confirmation triggers profile creation)
        if (signUpData?.user && marketingConsent) {
          try { localStorage.setItem("claaro-marketing-consent", "1"); } catch {/* ignore */}
        }

        // Record referral asynchronously — fire-and-forget
        if (refCode) {
          fetch("/api/loyalty/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ref_code: refCode, referred_email: email }),
          }).catch(() => {});
        }

        // Welcome email is sent after first login (once the session is established).
        // Store intent in localStorage so the dashboard picks it up.
        try { localStorage.setItem("claaro-send-welcome", "1"); } catch {/* ignore */}

        setInfo("Registrierung erfolgreich – bitte E-Mail bestätigen, dann einloggen.");
        setMode("login");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(translateSupabaseError(err instanceof Error ? err.message : ""));
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
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
        {/* ── Social proof header ─────────────────────────────────────────── */}
        <motion.div
          className="flex items-center justify-center gap-2.5 mb-7"
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.02 }}
        >
          {/* Avatar stack */}
          <div className="flex -space-x-1.5" aria-hidden="true">
            {AVATARS.map(({ initials, color }) => (
              <div
                key={initials}
                className="w-6 h-6 rounded-full border-2 border-[#241c14] flex items-center justify-center text-[9px] font-semibold text-white select-none"
                style={{ backgroundColor: color }}
              >
                {initials}
              </div>
            ))}
          </div>
          <span className="text-white/40 text-xs">Von Unternehmern vertraut</span>
        </motion.div>

        {/* ── Logo + heading ──────────────────────────────────────────────── */}
        <motion.div
          className="text-center mb-8"
          initial={reduced ? {} : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span
            className="text-2xl font-bold text-[var(--c-accent)] tracking-tight"
            style={sans}
          >
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
              <p className="text-white/55 text-sm mt-2">
                {mode === "login"
                  ? "Mit deinem Claaro-Konto einloggen"
                  : "Starte deinen 30-Tage-Test — kostenlos"}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <motion.form
          key={shakeKey}
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div>
            <label className="block text-xs text-white/55 mb-1.5">
              E-Mail <span className="text-[var(--c-accent)]/70">*</span>
            </label>
            <input
              required
              type="email"
              className={`${inputClass}${emailFieldError ? " border-red-500/50" : ""}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              onBlur={() => setEmailTouched(true)}
              placeholder="deine@email.de"
              autoComplete="email"
            />
            {emailFieldError && (
              <p className="text-xs text-red-400 mt-1">{emailFieldError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-white/55 mb-1.5">
              Passwort <span className="text-[var(--c-accent)]/70">*</span>
            </label>
            <input
              required
              type="password"
              className={`${inputClass}${passwordFieldError ? " border-red-500/50" : ""}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              onBlur={() => setPasswordTouched(true)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
            />
            {passwordFieldError && (
              <p className="text-xs text-red-400 mt-1">{passwordFieldError}</p>
            )}
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

          {/* Marketing consent — only shown during registration, DSGVO required, not pre-checked */}
          {mode === "register" && (
            <label className="flex items-start gap-2.5 cursor-pointer group mt-1">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 w-3.5 h-3.5 accent-[var(--c-accent)] shrink-0"
              />
              <span className="text-[11px] text-white/40 leading-relaxed group-hover:text-white/55 transition-colors">
                Ich möchte Tipps, Updates und Angebote von Claaro per E-Mail erhalten.
                (Optional · jederzeit widerrufbar · gemäß{" "}
                <a href="/datenschutz" className="underline hover:text-white/60">Datenschutz</a>)
              </span>
            </label>
          )}

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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Bitte warten…
              </span>
            ) : mode === "login" ? (
              "Einloggen"
            ) : (
              "Kostenlos starten →"
            )}
          </motion.button>
        </motion.form>

        {/* ── Register USPs (slide in when registering) ───────────────────── */}
        <AnimatePresence>
          {mode === "register" && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mt-4 space-y-1.5"
              aria-label="Vorteile der Registrierung"
            >
              {REGISTER_USPS.map((usp) => (
                <li key={usp} className="flex items-start gap-2 text-xs text-white/50">
                  <svg
                    className="w-3.5 h-3.5 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ color: "var(--c-teal)" }}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {usp}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        {/* ── Mode switch ──────────────────────────────────────────────────── */}
        <motion.p
          className="text-center text-sm text-white/55 mt-6"
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
              setEmailTouched(false);
              setPasswordTouched(false);
            }}
            className="c-btn text-[var(--c-accent)] hover:text-[#e05a38] font-medium"
          >
            {mode === "login" ? "Registrieren" : "Einloggen"}
          </button>
        </motion.p>

        {/* ── Trust badges ─────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center gap-5 mt-8 flex-wrap"
          aria-label="Sicherheit und Vertrauen"
        >
          {TRUST_BADGES.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 text-white/35"
              title={label}
            >
              <span style={{ color: "var(--c-teal)" }} aria-hidden="true">
                {icon}
              </span>
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <div className="mt-8 border-t border-white/8" />

        {/* ── Testimonial ──────────────────────────────────────────────────── */}
        <motion.figure
          className="mt-6"
          initial={reduced ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Stars />
          <blockquote className="text-center text-xs text-white/50 italic leading-relaxed mt-3">
            &ldquo;{TESTIMONIAL.quote}&rdquo;
          </blockquote>
          <figcaption className="text-center text-white/30 text-xs mt-2">
            — {TESTIMONIAL.name},{" "}
            <span className="text-white/25">{TESTIMONIAL.role}</span>
          </figcaption>
        </motion.figure>
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
