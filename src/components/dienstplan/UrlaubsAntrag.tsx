"use client";

import { useState, useEffect } from "react";
import type { Vacation } from "@/types/dienstplan";
import { triggerZeitersparnisToast } from "@/lib/zeitersparnis";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

function statusStyle(status: Vacation["status"]) {
  if (status === "genehmigt")
    return { color: "var(--c-teal)", bg: "rgba(30,122,107,0.15)", border: "rgba(30,122,107,0.3)" };
  if (status === "abgelehnt")
    return { color: "var(--c-accent)", bg: "rgba(200,75,47,0.15)", border: "rgba(200,75,47,0.3)" };
  return { color: "var(--c-amber)", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function daysBetween(von: string, bis: string): number {
  const d1 = new Date(von);
  const d2 = new Date(bis);
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000) + 1;
}

interface Props {
  employeeId: string;
  urlaubTageJahr?: number;
  isAdmin?: boolean;
  hauptaccountId?: string;
}

export default function UrlaubsAntrag({ employeeId, urlaubTageJahr = 25, isAdmin, hauptaccountId }: Props) {
  const [vacations, setVacations] = useState<(Vacation & { employees?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");
  const [notiz, setNotiz] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ablehngrund, setAblehngrund] = useState<Record<string, string>>({});

  useEffect(() => {
    loadVacations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadVacations() {
    setLoading(true);
    try {
      const param = isAdmin && hauptaccountId
        ? `hauptaccount_id=${hauptaccountId}`
        : `employee_id=${employeeId}`;
      const res = await fetch(`/api/dienstplan/urlaub?${param}`);
      const data = await res.json();
      setVacations(data.vacations ?? []);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!von || !bis || von > bis) {
      setError("Bitte gültigen Zeitraum wählen.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/dienstplan/urlaub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: employeeId, von, bis, notiz: notiz || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler.");
      setVacations((prev) => [data.vacation, ...prev]);
      setVon(""); setBis(""); setNotiz("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEntscheiden(id: string, status: "genehmigt" | "abgelehnt") {
    const res = await fetch(`/api/dienstplan/urlaub/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ablehngrund: ablehngrund[id] || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      setVacations((prev) => prev.map((v) => (v.id === id ? data.vacation : v)));
      if (status === "genehmigt") triggerZeitersparnisToast("Urlaub genehmigt", 10);
    }
  }

  const genehmigteTage = vacations
    .filter((v) => v.status === "genehmigt")
    .reduce((sum, v) => sum + daysBetween(v.von, v.bis), 0);

  return (
    <div className="space-y-6" style={sans}>
      {/* Übersicht Urlaubskontingent */}
      {!isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-semibold text-white">{urlaubTageJahr}</p>
            <p className="text-xs text-white/40 mt-0.5">Tage gesamt</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-semibold" style={{ color: "var(--c-accent)" }}>{genehmigteTage}</p>
            <p className="text-xs text-white/40 mt-0.5">Genommen</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-semibold" style={{ color: "var(--c-teal)" }}>
              {Math.max(0, urlaubTageJahr - genehmigteTage)}
            </p>
            <p className="text-xs text-white/40 mt-0.5">Verbleibend</p>
          </div>
        </div>
      )}

      {/* Antrag stellen (nur Mitarbeiter) */}
      {!isAdmin && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-white/70 font-medium mb-4">Urlaubsantrag stellen</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Von *</label>
                <input type="date" required className={inputClass} value={von} onChange={(e) => setVon(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Bis *</label>
                <input type="date" required className={inputClass} value={bis} onChange={(e) => setBis(e.target.value)} />
              </div>
            </div>
            {von && bis && von <= bis && (
              <p className="text-xs text-white/40">{daysBetween(von, bis)} Arbeitstage</p>
            )}
            <div>
              <label className={labelClass}>Notiz (optional)</label>
              <input className={inputClass} value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="z.B. Familienurlaub" />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full text-sm py-2 rounded-lg border transition-colors disabled:opacity-40"
              style={{ backgroundColor: "rgba(30,122,107,0.2)", borderColor: "rgba(30,122,107,0.4)", color: "var(--c-teal)" }}
            >
              {submitting ? "Wird gesendet…" : "Antrag einreichen"}
            </button>
          </form>
        </div>
      )}

      {/* Anträge-Liste */}
      <div>
        <p className="text-sm text-white/60 font-medium mb-3">
          {isAdmin ? "Alle Urlaubsanträge" : "Meine Anträge"}
        </p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : vacations.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-8">Keine Urlaubsanträge.</p>
        ) : (
          <div className="space-y-2">
            {vacations.map((v) => {
              const st = statusStyle(v.status);
              return (
                <div
                  key={v.id}
                  className="rounded-xl border p-4"
                  style={{ borderColor: st.border, backgroundColor: st.bg }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      {isAdmin && v.employees && (
                        <p className="text-xs text-white/50 mb-1">{v.employees.name}</p>
                      )}
                      <p className="text-sm text-white">
                        {formatDate(v.von)} – {formatDate(v.bis)}
                        <span className="text-white/40 text-xs ml-2">({daysBetween(v.von, v.bis)} Tage)</span>
                      </p>
                      {v.notiz && <p className="text-xs text-white/40 mt-0.5">{v.notiz}</p>}
                      {v.ablehngrund && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--c-accent)" }}>
                          Grund: {v.ablehngrund}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border capitalize"
                      style={{ color: st.color, borderColor: st.border, backgroundColor: st.bg }}
                    >
                      {v.status}
                    </span>
                  </div>

                  {/* Admin-Aktionen */}
                  {isAdmin && v.status === "beantragt" && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <input
                        type="text"
                        className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-lg px-2 py-1 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30"
                        placeholder="Ablehngrund (optional)"
                        value={ablehngrund[v.id] ?? ""}
                        onChange={(e) => setAblehngrund((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => handleEntscheiden(v.id, "genehmigt")}
                        className="text-xs px-3 py-1 rounded-lg border"
                        style={{ backgroundColor: "rgba(30,122,107,0.2)", borderColor: "rgba(30,122,107,0.4)", color: "var(--c-teal)" }}
                      >
                        Genehmigen
                      </button>
                      <button
                        onClick={() => handleEntscheiden(v.id, "abgelehnt")}
                        className="text-xs px-3 py-1 rounded-lg border"
                        style={{ backgroundColor: "rgba(200,75,47,0.15)", borderColor: "rgba(200,75,47,0.35)", color: "var(--c-accent)" }}
                      >
                        Ablehnen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
