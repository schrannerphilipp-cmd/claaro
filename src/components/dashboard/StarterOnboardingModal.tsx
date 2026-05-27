"use client";

import { useState } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";
import {
  STARTER_MODULES_LS_KEY,
  STARTER_ONBOARDING_DONE_KEY,
  type ModuleId,
} from "@/lib/plan-gate";

const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

const MAX_MODULES = 3;

const MODULE_OPTIONS: {
  id: ModuleId;
  icon: string;
  name: string;
  description: string;
}[] = [
  { id: "angebote",    icon: "📄", name: "Angebote",    description: "Professionelle Angebote in Minuten erstellen & versenden" },
  { id: "mahnungen",  icon: "⏰", name: "Mahnungen",   description: "Zahlungserinnerungen automatisch & rechtssicher" },
  { id: "onboarding", icon: "🤝", name: "Onboarding",  description: "Neue Mitarbeiter strukturiert einführen" },
  { id: "bewertungen",icon: "⭐", name: "Bewertungen", description: "Kundenbewertungen einholen & verwalten" },
  { id: "compliance", icon: "🔒", name: "Compliance",  description: "Vorschriften & Pflichten einfach im Blick behalten" },
  { id: "dienstplan", icon: "📅", name: "Dienstplan",  description: "Schichten planen & Team koordinieren" },
];

interface Props {
  /** Initial selection (when reopened from settings). If undefined, no pre-selection. */
  initialModules?: ModuleId[];
  /** Called after user confirms selection with the chosen module IDs. */
  onConfirm: (modules: ModuleId[]) => void;
  /** Called when modal is dismissed without confirming (only if allowDismiss is true). */
  onDismiss?: () => void;
  /** If false (default), no close button — user must choose. Used for first-time onboarding. */
  allowDismiss?: boolean;
}

export default function StarterOnboardingModal({
  initialModules,
  onConfirm,
  onDismiss,
  allowDismiss = false,
}: Props) {
  const [selected, setSelected] = useState<ModuleId[]>(initialModules ?? []);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  function toggle(id: ModuleId) {
    setSelected((prev) => {
      if (prev.includes(id)) {
        // Deselect
        return prev.filter((m) => m !== id);
      }
      if (prev.length < MAX_MODULES) {
        return [...prev, id];
      }
      // Already 3 selected → remove the oldest (first in array), add new one
      return [...prev.slice(1), id];
    });
  }

  async function handleConfirm() {
    if (selected.length !== MAX_MODULES) {
      setError("Bitte wähle genau 3 Features aus.");
      return;
    }
    setError(null);
    setSaving(true);

    // Persist to localStorage
    try {
      localStorage.setItem(STARTER_MODULES_LS_KEY, JSON.stringify(selected));
      localStorage.setItem(STARTER_ONBOARDING_DONE_KEY, "1");
    } catch {/* ignore */}

    // Best-effort save to Supabase
    if (supabaseConfigured) {
      try {
        const supabase = getBrowserClient();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from("profiles")
              .upsert({ id: user.id, starter_modules: selected, updated_at: new Date().toISOString() });
          }
        }
      } catch {/* ignore — localStorage is the source of truth */}
    }

    setSaving(false);
    onConfirm(selected);
  }

  const canConfirm = selected.length === MAX_MODULES && !saving;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={allowDismiss ? onDismiss : undefined}
    >
      <div
        className="relative w-full max-w-lg bg-[#241c14] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
        style={sans}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-7 pb-5 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl text-white" style={serif}>
                Wähle deine 3 wichtigsten Features
              </h2>
              <p className="text-sm text-white/50 mt-1.5 leading-relaxed">
                Dein Starter-Plan enthält <strong className="text-white/70">3 Module deiner Wahl</strong>.
                Du kannst die Auswahl später in den Einstellungen ändern.
              </p>
            </div>
            {allowDismiss && onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-none w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Selection counter */}
          <div className="flex items-center gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: i < selected.length
                    ? "var(--c-accent)"
                    : "rgba(255,255,255,0.10)",
                }}
              />
            ))}
            <span className="text-xs text-white/40 ml-1 tabular-nums">
              {selected.length}/{MAX_MODULES}
            </span>
          </div>
        </div>

        {/* Module grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MODULE_OPTIONS.map(({ id, icon, name, description }) => {
            const isSelected = selected.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="relative text-left rounded-xl border p-4 transition-all group"
                style={{
                  backgroundColor: isSelected
                    ? "rgba(var(--c-accent-rgb),0.12)"
                    : "rgba(255,255,255,0.04)",
                  borderColor: isSelected
                    ? "rgba(var(--c-accent-rgb),0.45)"
                    : "rgba(255,255,255,0.10)",
                }}
              >
                {/* Checkmark badge */}
                {isSelected && (
                  <span
                    className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--c-accent)" }}
                  >
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}

                {/* Selection order indicator */}
                {isSelected && (
                  <span
                    className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                    style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.6)" }}
                  >
                    {selected.indexOf(id) + 1}
                  </span>
                )}

                <span
                  className="block text-2xl mb-2.5 transition-transform duration-150 group-hover:scale-110"
                  style={{ opacity: isSelected ? 1 : 0.7 }}
                >
                  {icon}
                </span>
                <p
                  className="text-xs font-semibold mb-1 transition-colors"
                  style={{ color: isSelected ? "var(--c-accent)" : "rgba(255,255,255,0.75)" }}
                >
                  {name}
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
                  {description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 space-y-3">
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-center">
              {error}
            </p>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40"
            style={{ backgroundColor: "var(--c-accent)" }}
          >
            {saving
              ? "Wird gespeichert…"
              : selected.length < MAX_MODULES
              ? `Noch ${MAX_MODULES - selected.length} auswählen`
              : "Auswahl bestätigen →"}
          </button>

          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
            Jederzeit in den Einstellungen änderbar · Upgrade auf Profi für alle 6 Module
          </p>
        </div>
      </div>
    </div>
  );
}
