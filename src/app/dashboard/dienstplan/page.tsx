"use client";

import { useState, useEffect, useCallback } from "react";
import FeatureLayout from "../_components/feature-layout";
import WochenGrid from "@/components/dienstplan/WochenGrid";
import type { Employee, Shift, ShiftPlan } from "@/types/dienstplan";
import { triggerZeitersparnisToast } from "@/lib/zeitersparnis";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "demo";

function currentIsoWeek(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const dow = jan4.getDay() || 7;
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - (dow - 1));
  const diff = now.getTime() - startOfWeek1.getTime();
  const week = Math.floor(diff / (7 * 86_400_000)) + 1;
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function nextWeek(w: string) {
  const [yr, wk] = w.replace("W", "").split("-").map(Number);
  return wk < 52 ? `${yr}-W${String(wk + 1).padStart(2, "0")}` : `${yr + 1}-W01`;
}
function prevWeek(w: string) {
  const [yr, wk] = w.replace("W", "").split("-").map(Number);
  return wk > 1 ? `${yr}-W${String(wk - 1).padStart(2, "0")}` : `${yr - 1}-W52`;
}

const NAV_TILES = [
  { href: "/dashboard/dienstplan/mitarbeiter", icon: "👥", label: "Mitarbeiter", desc: "Team verwalten & einladen" },
  { href: "/dashboard/dienstplan/verfuegbarkeit", icon: "📅", label: "Verfügbarkeit", desc: "Eigene Zeiten eintragen" },
  { href: "/dashboard/dienstplan/urlaub", icon: "🌴", label: "Urlaub", desc: "Anträge & Genehmigungen" },
  { href: "/dashboard/dienstplan/tausch", icon: "🔄", label: "Tauschbörse", desc: "Schichten tauschen" },
];

export default function DienstplanPage() {
  const [woche, setWoche] = useState(currentIsoWeek());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [plan, setPlan] = useState<ShiftPlan | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [generatingKi, setGeneratingKi] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [warnungen, setWarnungen] = useState<string[]>([]);
  const [kiError, setKiError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    if (HAUPTACCOUNT_ID === "demo") return;
    try {
      const res = await fetch(`/api/dienstplan/mitarbeiter?hauptaccount_id=${HAUPTACCOUNT_ID}`);
      const data = await res.json();
      setEmployees(data.employees ?? []);
    } catch {/* ignore */}
  }, []);

  useEffect(() => { loadEmployees(); }, [loadEmployees]);

  useEffect(() => {
    setPlan(null);
    setShifts([]);
    setKiError(null);
    setWarnungen([]);
  }, [woche]);

  async function generiereKiPlan() {
    setGeneratingKi(true);
    setKiError(null);
    setWarnungen([]);
    try {
      const res = await fetch("/api/dienstplan/ki-erstellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ woche, hauptaccount_id: HAUPTACCOUNT_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "KI-Fehler.");
      setPlan(data.plan);
      setShifts(data.schichten ?? []);
      setWarnungen(data.warnungen ?? []);
      triggerZeitersparnisToast("Dienstplan erstellt", 180);
    } catch (err) {
      setKiError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setGeneratingKi(false);
    }
  }

  async function veroeffentlichen() {
    if (!plan) return;
    setPublishing(true);
    try {
      const empIds = employees.map((e) => e.id);
      if (empIds.length > 0) {
        await fetch("/api/dienstplan/whatsapp-senden", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typ: "schicht", employeeIds: empIds, shiftPlanId: plan.id }),
        });
      }
      setPlan((p) => p ? { ...p, status: "veroeffentlicht" } : p);
      triggerZeitersparnisToast("Dienstplan veröffentlicht", 45);
    } catch {/* ignore */} finally {
      setPublishing(false);
    }
  }

  const needsSetup = HAUPTACCOUNT_ID === "demo";

  return (
    <FeatureLayout
      name="Dienstplan"
      description="KI-gestützter Schichtplan mit automatischer Gesetzeskonformität für Deutschland, Österreich und die Schweiz."
    >
      <div className="space-y-8" style={sans}>
        {/* Setup-Hinweis */}
        {needsSetup && (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm" style={{ color: "var(--c-amber)" }}>
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16">
              <path d="M8 2l6 12H2L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <div>
              Supabase noch nicht konfiguriert. Bitte{" "}
              <code className="text-xs bg-white/10 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
              <code className="text-xs bg-white/10 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              und{" "}
              <code className="text-xs bg-white/10 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID</code>{" "}
              in <code className="text-xs bg-white/10 px-1 py-0.5 rounded">.env</code> setzen.
            </div>
          </div>
        )}

        {/* Quick nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {NAV_TILES.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className="bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-white/20 rounded-xl p-4 transition-all"
            >
              <span className="text-xl">{t.icon}</span>
              <p className="text-sm text-white font-medium mt-2">{t.label}</p>
              <p className="text-xs text-white/40 mt-0.5 leading-snug">{t.desc}</p>
            </a>
          ))}
        </div>

        {/* Wochenauswahl + Grid */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setWoche(prevWeek(woche))}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 16 16">
                  <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="text-white text-sm font-medium">{woche.replace("-W", " – KW ")}</span>
              <button
                onClick={() => setWoche(nextWeek(woche))}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 16 16">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <button
              onClick={generiereKiPlan}
              disabled={generatingKi || needsSetup}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-40"
              style={{
                backgroundColor: "rgba(200,75,47,0.15)",
                borderColor: "rgba(200,75,47,0.35)",
                color: "var(--c-accent)",
              }}
            >
              {generatingKi ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  KI erstellt Plan…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5L8 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                  KI-Schichtplan erstellen
                </>
              )}
            </button>
          </div>

          {kiError && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 16 16">
                <path d="M8 2l6 12H2L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {kiError}
            </div>
          )}

          {warnungen.map((w, i) => (
            <div key={i} className="mb-2 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm" style={{ color: "var(--c-amber)" }}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 16 16">
                <path d="M8 2l6 12H2L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {w}
            </div>
          ))}

          <WochenGrid
            plan={plan}
            shifts={shifts}
            employees={employees}
            woche={woche}
            onVeroeffentlichen={veroeffentlichen}
            isPublishing={publishing}
          />
        </div>
      </div>
    </FeatureLayout>
  );
}
