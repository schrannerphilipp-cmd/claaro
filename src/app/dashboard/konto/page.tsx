"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
import FeatureLayout from "../_components/feature-layout";
import ProfilBearbeiten from "@/components/konto/ProfilBearbeiten";
import AboAbrechnung from "@/components/konto/AboAbrechnung";
import FirmenChat from "@/components/konto/FirmenChat";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

type Tab = "profil" | "firmendaten" | "abo" | "benachrichtigungen" | "sicherheit";

const TABS: { id: Tab; label: string }[] = [
  { id: "profil", label: "Profil" },
  { id: "firmendaten", label: "Firmendaten" },
  { id: "abo", label: "Abo & Abrechnung" },
  { id: "benachrichtigungen", label: "Benachrichtigungen" },
  { id: "sicherheit", label: "Passwort & Sicherheit" },
];

// ── Eye icon ──────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

// ── Password input with show/hide toggle ──────────────────────────────────────

function PasswordField({
  label, value, onChange, show, onToggle, placeholder, autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1">{label}</label>
      <div className="relative">
        <input
          autoFocus={autoFocus}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          required
          className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 pr-10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

// ── Passwort & Sicherheit ─────────────────────────────────────────────────────

function PasswortSection() {
  const [userEmail, setUserEmail] = useState("");

  // Step 1 – verify current password
  const [altPass, setAltPass]       = useState("");
  const [showAlt, setShowAlt]       = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verified, setVerified]     = useState(false);

  // Step 2 – set new password (visible only after verification)
  const [neuPass, setNeuPass]       = useState("");
  const [bestPass, setBestPass]     = useState("");
  const [showNeu, setShowNeu]       = useState(false);
  const [showBest, setShowBest]     = useState(false);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail]         = useState("");
  const [resetSending, setResetSending]     = useState(false);
  const [resetSuccess, setResetSuccess]     = useState(false);
  const [resetError, setResetError]         = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setUserEmail(data.user.email);
        setResetEmail(data.user.email);
      }
    });
  }, []);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setVerifyError(null);
    if (!altPass) { setVerifyError("Aktuelles Passwort ist erforderlich."); return; }

    const supabase = getBrowserClient();
    if (!supabase) { setVerifyError("Supabase nicht konfiguriert."); return; }

    setVerifying(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: altPass,
    });
    setVerifying(false);

    if (error) {
      setVerifyError("Aktuelles Passwort ist falsch.");
    } else {
      setVerified(true);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangeError(null);
    if (neuPass.length < 8) { setChangeError("Das neue Passwort muss mindestens 8 Zeichen lang sein."); return; }
    if (neuPass !== bestPass) { setChangeError("Die Passwörter stimmen nicht überein."); return; }

    const supabase = getBrowserClient();
    if (!supabase) { setChangeError("Supabase nicht konfiguriert."); return; }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: neuPass });
    setSaving(false);

    if (error) {
      setChangeError(error.message);
    } else {
      setSuccess(true);
      setAltPass(""); setNeuPass(""); setBestPass("");
      setVerified(false);
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccess(false), 4000);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    setResetError(null);
    if (!resetEmail) { setResetError("Bitte E-Mail-Adresse eingeben."); return; }

    const supabase = getBrowserClient();
    if (!supabase) { setResetError("Supabase nicht konfiguriert."); return; }

    setResetSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/dashboard/konto`,
    });
    setResetSending(false);

    if (error) {
      setResetError("E-Mail-Adresse nicht gefunden.");
    } else {
      setResetSuccess(true);
    }
  }

  function openResetModal() {
    setShowResetModal(true);
    setResetSuccess(false);
    setResetError(null);
  }

  return (
    <div className="max-w-sm space-y-6">
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Passwort & Sicherheit</p>
        <p className="text-sm text-white/45">Aktuelles Passwort bestätigen, dann neues vergeben.</p>
      </div>

      {/* Success banner (shown after successful change, back on step 1) */}
      {success && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.15)", color: "var(--c-teal)" }}>
          Passwort erfolgreich geändert.
        </p>
      )}

      {/* ── Schritt 1: aktuelles Passwort prüfen ── */}
      {!verified ? (
        <form onSubmit={handleVerify} className="space-y-4">
          <PasswordField
            label="Aktuelles Passwort"
            value={altPass}
            onChange={setAltPass}
            show={showAlt}
            onToggle={() => setShowAlt((v) => !v)}
            autoFocus
          />

          {verifyError && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.12)", color: "var(--c-accent)" }}>
              {verifyError}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={verifying}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.2)", color: "var(--c-accent)", border: "1px solid rgba(var(--c-accent-rgb),0.3)" }}
            >
              {verifying ? "Wird geprüft …" : "Weiter →"}
            </button>
            <button
              type="button"
              onClick={openResetModal}
              className="text-xs text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
            >
              Passwort vergessen?
            </button>
          </div>
        </form>
      ) : (
        /* ── Schritt 2: neues Passwort setzen ── */
        <div className="space-y-4">
          {/* Confirmation badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.15)", color: "var(--c-teal)" }}>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16">
              <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Passwort bestätigt ✓
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <PasswordField
              label="Neues Passwort"
              value={neuPass}
              onChange={setNeuPass}
              show={showNeu}
              onToggle={() => setShowNeu((v) => !v)}
              placeholder="Mindestens 8 Zeichen"
              autoFocus
            />
            <PasswordField
              label="Passwort bestätigen"
              value={bestPass}
              onChange={setBestPass}
              show={showBest}
              onToggle={() => setShowBest((v) => !v)}
            />

            {changeError && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.12)", color: "var(--c-accent)" }}>
                {changeError}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.2)", color: "var(--c-accent)", border: "1px solid rgba(var(--c-accent-rgb),0.3)" }}
              >
                {saving ? "Speichern …" : "Passwort ändern"}
              </button>
              <button
                type="button"
                onClick={() => { setVerified(false); setAltPass(""); setVerifyError(null); }}
                className="text-xs text-white/35 hover:text-white/60 transition-colors"
              >
                Zurück
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reset modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false); }}
        >
          <div className="w-full max-w-sm bg-[#1a1814] border border-white/15 rounded-2xl shadow-2xl overflow-hidden" style={sans}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <p className="text-sm font-semibold text-white">Passwort zurücksetzen</p>
              <button
                onClick={() => setShowResetModal(false)}
                className="text-white/30 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {resetSuccess ? (
              <div className="px-6 py-12 text-center">
                <p className="text-4xl mb-3">📧</p>
                <p className="text-sm font-medium text-white mb-1">Reset-Link gesendet</p>
                <p className="text-xs text-white/40 mt-1">Bitte prüfe dein E-Mail-Postfach.</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="p-6 space-y-4">
                <p className="text-xs text-white/45 leading-relaxed">
                  Wir senden dir einen Link zum Zurücksetzen des Passworts.
                </p>
                <div>
                  <label className="block text-xs text-white/40 mb-1">E-Mail-Adresse</label>
                  <input
                    autoFocus
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="deine@email.de"
                    required
                    className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>

                {resetError && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.12)", color: "var(--c-accent)" }}>
                    {resetError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="flex-1 py-2 rounded-lg text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={resetSending}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.2)", color: "var(--c-accent)", border: "1px solid rgba(var(--c-accent-rgb),0.3)" }}
                  >
                    {resetSending ? "Senden …" : "Link senden"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KontoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profil");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (TABS.some((t) => t.id === hash)) setActiveTab(hash);

    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setShowSuccess(true);
      setActiveTab("abo");
      router.refresh();
      history.replaceState(null, "", `/dashboard/konto#abo`);
    } else if (params.get("cancelled") === "1") {
      router.refresh();
      history.replaceState(null, "", `/dashboard/konto${hash ? `#${hash}` : ""}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    history.replaceState(null, "", `#${tab}`);
  }

  return (
    <FeatureLayout
      name="Mein Konto"
      description="Profil, Abonnement und Teamkommunikation verwalten."
    >
      <div className="space-y-6" style={sans}>
        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex-shrink-0 text-sm px-4 py-2 rounded-xl border transition-all duration-150"
              style={
                activeTab === tab.id
                  ? {
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.2)",
                      color: "white",
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)",
                    }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[300px]">
          {activeTab === "profil" && <ProfilBearbeiten />}

          {activeTab === "firmendaten" && (
            <div className="space-y-4">
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Firmendaten</p>
              <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.15)" }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-accent)" }}>
                    <path d="M2 14V6l6-4 6 4v8H10v-4H6v4H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Firmenlogo & Stammdaten</p>
                  <p className="text-xs text-white/45 leading-relaxed mb-3">
                    Logo, Firmenname, Adresse und Kontaktdaten verwalten Sie unter Einstellungen. Die Daten erscheinen automatisch auf Ihren Angeboten.
                  </p>
                  <Link
                    href="/dashboard/einstellungen"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: "rgba(var(--c-accent-rgb),0.12)",
                      borderColor: "rgba(var(--c-accent-rgb),0.3)",
                      color: "var(--c-accent)",
                    }}
                  >
                    Zu den Einstellungen
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === "abo" && <AboAbrechnung showSuccess={showSuccess} onSuccessDismissed={() => setShowSuccess(false)} />}

          {activeTab === "benachrichtigungen" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Team-Chat</p>
                <p className="text-xs text-white/25">Echtzeit · nur für Ihr Team</p>
              </div>
              <FirmenChat />
            </div>
          )}

          {activeTab === "sicherheit" && <PasswortSection />}
        </div>
      </div>
    </FeatureLayout>
  );
}
