"use client";

import { useState, useEffect, useCallback } from "react";
import FeatureLayout from "../../_components/feature-layout";
import MitarbeiterForm from "@/components/dienstplan/MitarbeiterForm";
import type { Employee } from "@/types/dienstplan";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "demo";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const LAND_FLAGS: Record<string, string> = { DE: "🇩🇪", AT: "🇦🇹", CH: "🇨🇭" };

export default function MitarbeiterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (HAUPTACCOUNT_ID === "demo") { setLoading(false); return; }
    try {
      const res = await fetch(`/api/dienstplan/mitarbeiter?hauptaccount_id=${HAUPTACCOUNT_ID}`);
      const data = await res.json();
      setEmployees(data.employees ?? []);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleAktiv(emp: Employee) {
    setToggling(emp.id);
    await fetch(`/api/dienstplan/mitarbeiter/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktiv: !emp.aktiv }),
    });
    setEmployees((prev) => prev.map((e) => e.id === emp.id ? { ...e, aktiv: !emp.aktiv } : e));
    setToggling(null);
  }

  const aktive = employees.filter((e) => e.aktiv);
  const inaktive = employees.filter((e) => !e.aktiv);

  return (
    <FeatureLayout
      name="Mitarbeiter"
      description="Teamverwaltung: Mitarbeiter anlegen, einladen und Rollen zuweisen."
      backHref="/dashboard/dienstplan"
    >
      <div className="space-y-6" style={sans}>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="c-card bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-semibold text-white">{employees.length}</p>
            <p className="text-xs text-white/55 mt-0.5">Gesamt</p>
          </div>
          <div className="c-card bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-semibold" style={{ color: "var(--c-teal)" }}>{aktive.length}</p>
            <p className="text-xs text-white/55 mt-0.5">Aktiv</p>
          </div>
          <div className="c-card bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-semibold text-white/50">{inaktive.length}</p>
            <p className="text-xs text-white/55 mt-0.5">Deaktiviert</p>
          </div>
        </div>

        {/* Neu anlegen */}
        <div className="c-card bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="c-btn w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
          >
            <span className="flex items-center gap-2 text-sm text-white/70">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Neuen Mitarbeiter anlegen
            </span>
            <svg
              className={`w-4 h-4 text-white/50 transition-transform duration-200 ${showForm ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 16 16"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {showForm && (
            <div className="border-t border-white/10 px-5 py-5">
              <MitarbeiterForm
                hauptaccountId={HAUPTACCOUNT_ID}
                onSuccess={(emp) => {
                  try { localStorage.setItem("claaro-setup-team", "1"); } catch {/* ignore */}
                  setEmployees((prev) => [emp, ...prev]);
                  setShowForm(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Mitarbeiter-Liste */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="c-skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl py-16 px-8 text-center">
            <p className="text-3xl mb-4" aria-hidden="true">👥</p>
            <p className="text-sm font-medium text-white mb-1">Noch kein Team angelegt</p>
            <p className="text-xs text-white/55 mb-5 max-w-xs mx-auto">
              Füge deinen ersten Mitarbeiter hinzu — dann kannst du Schichtpläne erstellen.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="c-btn inline-flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.2)", color: "var(--c-teal)", border: "1px solid rgba(var(--c-teal-rgb),0.25)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Ersten Mitarbeiter hinzufügen
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {[...aktive, ...inaktive].map((emp) => (
              <div
                key={emp.id}
                className="c-card bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3"
                style={{ opacity: emp.aktiv ? 1 : 0.5 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.2)", color: "var(--c-accent)" }}
                  >
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium">{emp.name}</p>
                      <span className="text-[10px] text-white/50">{LAND_FLAGS[emp.land]} {emp.land}</span>
                      {emp.rolle === "admin" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/55">Admin</span>
                      )}
                    </div>
                    <p className="text-xs text-white/55">{emp.email} · {emp.vertrag_typ} · {emp.stunden_pro_woche}h/Woche</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/45">seit {formatDate(emp.created_at)}</span>
                  <button
                    onClick={() => toggleAktiv(emp)}
                    disabled={toggling === emp.id}
                    className="c-btn text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40"
                    style={
                      emp.aktiv
                        ? { backgroundColor: "rgba(var(--c-accent-rgb),0.1)", borderColor: "rgba(var(--c-accent-rgb),0.25)", color: "var(--c-accent)" }
                        : { backgroundColor: "rgba(var(--c-teal-rgb),0.15)", borderColor: "rgba(var(--c-teal-rgb),0.3)", color: "var(--c-teal)" }
                    }
                  >
                    {toggling === emp.id ? "…" : emp.aktiv ? "Deaktivieren" : "Reaktivieren"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FeatureLayout>
  );
}
