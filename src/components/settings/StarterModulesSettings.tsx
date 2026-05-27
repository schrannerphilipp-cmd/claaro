"use client";

import { useState, useEffect } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";
import {
  STARTER_MODULES_LS_KEY,
  STARTER_ONBOARDING_DONE_KEY,
  type ModuleId,
} from "@/lib/plan-gate";

const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

const MAX_MODULES = 3;

const MODULE_OPTIONS: {
  id: ModuleId;
  icon: string;
  name: string;
  description: string;
}[] = [
  { id: "angebote",    icon: "📄", name: "Angebote",    description: "Angebote erstellen & versenden" },
  { id: "mahnungen",  icon: "⏰", name: "Mahnungen",   description: "Zahlungserinnerungen automatisch" },
  { id: "onboarding", icon: "🤝", name: "Onboarding",  description: "Neue Mitarbeiter einführen" },
  { id: "bewertungen",icon: "⭐", name: "Bewertungen", description: "Kundenbewertungen verwalten" },
  { id: "compliance", icon: "🔒", name: "Compliance",  description: "Vorschriften im Blick behalten" },
  { id: "dienstplan", icon: "📅", name: "Dienstplan",  description: "Schichten planen & koordinieren" },
];

/** Only renders for Starter plan users. Returns null for all other plans. */
export default function StarterModulesSettings() {
  const [isStarter,  setIsStarter]  = useState<boolean | null>(null); // null = loading
  const [selected,   setSelected]   = useState<ModuleId[]>([]);
  const [origSelected, setOrigSelected] = useState<ModuleId[]>([]);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage first (fast)
    try {
      const raw = localStorage.getItem(STARTER_MODULES_LS_KEY);
      if (raw) {
        const mods = JSON.parse(raw) as ModuleId[];
        if (Array.isArray(mods) && mods.length > 0) {
          setSelected(mods);
          setOrigSelected(mods);
        }
      }
    } catch {/* ignore */}

    // Check plan & load from Supabase
    if (!supabaseConfigured) {
      // No Supabase → can't determine plan → hide
      setIsStarter(false);
      return;
    }

    const supabase = getBrowserClient();
    if (!supabase) { setIsStarter(false); return; }

    let done = false;

    // 1. Check plan from company_settings
    if (HAUPTACCOUNT_ID) {
      supabase
        .from("company_settings")
        .select("abo_plan")
        .eq("hauptaccount_id", HAUPTACCOUNT_ID)
        .maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          const plan = data?.abo_plan as string | undefined;
          setIsStarter(plan === "starter");
        });
    }

    // 2. Load starter_modules from profiles
    supabase.auth.getUser().then(({ data }: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { data: any }) => {
      if (!data?.user || done) return;
      supabase
        .from("profiles")
        .select("starter_modules")
        .eq("id", data.user.id)
        .maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data: p }: { data: any }) => {
          done = true;
          if (!p?.starter_modules) return;
          const mods = p.starter_modules as ModuleId[];
          if (Array.isArray(mods) && mods.length > 0) {
            setSelected(mods);
            setOrigSelected(mods);
            try { localStorage.setItem(STARTER_MODULES_LS_KEY, JSON.stringify(mods)); } catch {/* ignore */}
          }
        });
    });
  }, []);

  function toggle(id: ModuleId) {
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((m) => m !== id);
      if (prev.length < MAX_MODULES) return [...prev, id];
      // Remove oldest, add new
      return [...prev.slice(1), id];
    });
  }

  async function handleSave() {
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
      } catch {/* ignore */}
    }

    setOrigSelected([...selected]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    // Notify dashboard if it's open in the same tab
    try {
      window.dispatchEvent(new CustomEvent("claaro:starter-modules-updated", { detail: { modules: selected } }));
    } catch {/* ignore */}
  }

  // Still loading plan info
  if (isStarter === null) return null;
  // Not a Starter user
  if (!isStarter) return null;

  const hasChanges = JSON.stringify(selected) !== JSON.stringify(origSelected);
  const canSave = selected.length === MAX_MODULES && hasChanges && !saving;

  return (
    <div className="c-card bg-white/5 border border-white/10 rounded-xl p-6" style={sans}>
      <div className="mb-5">
        <h3 className="text-base font-semibold text-white" style={serif}>Meine 3 Features</h3>
        <p className="text-sm text-white/50 mt-1 leading-relaxed">
          Wähle genau 3 Module — diese sind in deinem Starter-Plan enthalten.
          Möchtest du alle 6?{" "}
          <a href="/dashboard/konto?tab=abo" className="underline text-white/60 hover:text-white transition-colors">
            Upgrade auf Profi →
          </a>
        </p>
      </div>

      {/* Counter bar */}
      <div className="flex items-center gap-2 mb-4">
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
        <span className="text-xs text-white/40 ml-1 tabular-nums">{selected.length}/{MAX_MODULES}</span>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        {MODULE_OPTIONS.map(({ id, icon, name, description }) => {
          const isSelected = selected.includes(id);
          return (
            <button
              key={id}
              onClick={() => toggle(id)}
              className="relative text-left rounded-xl border p-3.5 transition-all group"
              style={{
                backgroundColor: isSelected
                  ? "rgba(var(--c-accent-rgb),0.12)"
                  : "rgba(255,255,255,0.03)",
                borderColor: isSelected
                  ? "rgba(var(--c-accent-rgb),0.40)"
                  : "rgba(255,255,255,0.09)",
              }}
            >
              {isSelected && (
                <span
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--c-accent)" }}
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
              <span className="block text-xl mb-1.5" style={{ opacity: isSelected ? 1 : 0.6 }}>{icon}</span>
              <p
                className="text-xs font-semibold"
                style={{ color: isSelected ? "var(--c-accent)" : "rgba(255,255,255,0.70)" }}
              >
                {name}
              </p>
              <p className="text-[10px] text-white/35 mt-0.5 leading-snug">{description}</p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 mb-3">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full text-sm py-2.5 rounded-lg border transition-all disabled:opacity-40"
        style={{
          backgroundColor: saved ? "rgba(var(--c-teal-rgb),0.2)" : "rgba(var(--c-accent-rgb),0.15)",
          borderColor:     saved ? "rgba(var(--c-teal-rgb),0.4)" : "rgba(var(--c-accent-rgb),0.35)",
          color:           saved ? "var(--c-teal)"               : "var(--c-accent)",
        }}
      >
        {saving ? "Wird gespeichert…" : saved ? "Gespeichert ✓" : "Auswahl speichern"}
      </button>
    </div>
  );
}
