"use client";

import { useState, useEffect } from "react";
import type { Availability } from "@/types/dienstplan";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";

const TAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

function currentIsoWeek(): string {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  const dow = jan4.getDay() || 7;
  startOfWeek1.setDate(jan4.getDate() - (dow - 1));
  const diff = now.getTime() - startOfWeek1.getTime();
  const week = Math.floor(diff / (7 * 86_400_000)) + 1;
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function nextWeek(woche: string): string {
  const [yr, wk] = woche.replace("W", "").split("-").map(Number);
  if (wk < 52) return `${yr}-W${String(wk + 1).padStart(2, "0")}`;
  return `${yr + 1}-W01`;
}

function prevWeek(woche: string): string {
  const [yr, wk] = woche.replace("W", "").split("-").map(Number);
  if (wk > 1) return `${yr}-W${String(wk - 1).padStart(2, "0")}`;
  return `${yr - 1}-W52`;
}

interface DayState {
  verfuegbar: boolean;
  von: string;
  bis: string;
  notiz: string;
  saving: boolean;
  saved: boolean;
}

interface Props {
  employeeId: string;
}

export default function VerfuegbarkeitsForm({ employeeId }: Props) {
  const [woche, setWoche] = useState(nextWeek(currentIsoWeek()));
  const [days, setDays] = useState<DayState[]>(
    TAGE.map(() => ({ verfuegbar: true, von: "08:00", bis: "17:00", notiz: "", saving: false, saved: false }))
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [woche]);

  async function loadAvailability() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dienstplan/verfuegbarkeit?employee_id=${employeeId}&woche=${woche}`
      );
      const data = await res.json();
      if (data.availability?.length) {
        setDays((prev) =>
          prev.map((d, i) => {
            const a: Availability | undefined = data.availability.find(
              (av: Availability) => av.tag === i
            );
            if (!a) return d;
            return {
              ...d,
              verfuegbar: a.verfuegbar,
              von: a.von?.slice(0, 5) ?? "08:00",
              bis: a.bis?.slice(0, 5) ?? "17:00",
              notiz: a.notiz ?? "",
            };
          })
        );
      } else {
        setDays(TAGE.map(() => ({ verfuegbar: true, von: "08:00", bis: "17:00", notiz: "", saving: false, saved: false })));
      }
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }

  function updateDay(index: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function saveDay(index: number) {
    const d = days[index];
    updateDay(index, { saving: true });
    try {
      await fetch("/api/dienstplan/verfuegbarkeit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          woche,
          tag: index,
          von: d.verfuegbar ? d.von : null,
          bis: d.verfuegbar ? d.bis : null,
          verfuegbar: d.verfuegbar,
          notiz: d.notiz || null,
        }),
      });
      updateDay(index, { saving: false, saved: true });
      setTimeout(() => updateDay(index, { saved: false }), 2000);
    } catch {
      updateDay(index, { saving: false });
    }
  }

  async function saveAll() {
    await Promise.all(TAGE.map((_, i) => saveDay(i)));
  }

  return (
    <div className="space-y-5" style={sans}>
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWoche(prevWeek(woche))}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Vorwoche
        </button>
        <span className="text-sm text-white font-medium">{woche.replace("-W", " – KW ")}</span>
        <button
          onClick={() => setWoche(nextWeek(woche))}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          Nächste
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Deadline info */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/40">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Verfügbarkeit bitte bis Freitag 12:00 Uhr eintragen.
      </div>

      {/* Days */}
      {loading ? (
        <div className="space-y-2">
          {TAGE.map((_, i) => (
            <div key={i} className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {TAGE.map((tag, i) => {
            const d = days[i];
            return (
              <div
                key={i}
                className="rounded-xl border p-4 transition-colors"
                style={{
                  borderColor: d.verfuegbar ? "rgba(30,122,107,0.3)" : "rgba(255,255,255,0.08)",
                  backgroundColor: d.verfuegbar ? "rgba(30,122,107,0.05)" : "rgba(255,255,255,0.03)",
                }}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {/* Toggle */}
                  <button
                    onClick={() => updateDay(i, { verfuegbar: !d.verfuegbar })}
                    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${
                      d.verfuegbar ? "" : "bg-white/10"
                    }`}
                    style={d.verfuegbar ? { backgroundColor: "var(--c-teal)" } : {}}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all"
                      style={{ left: d.verfuegbar ? "calc(100% - 18px)" : "2px" }}
                    />
                  </button>

                  <span className="text-sm text-white/70 w-24">{tag}</span>

                  {d.verfuegbar && (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          className={inputClass}
                          value={d.von}
                          onChange={(e) => updateDay(i, { von: e.target.value })}
                        />
                        <span className="text-white/30 text-sm">–</span>
                        <input
                          type="time"
                          className={inputClass}
                          value={d.bis}
                          onChange={(e) => updateDay(i, { bis: e.target.value })}
                        />
                      </div>
                      <input
                        type="text"
                        className={`${inputClass} flex-1 min-w-0`}
                        value={d.notiz}
                        onChange={(e) => updateDay(i, { notiz: e.target.value })}
                        placeholder="Notiz (optional)"
                      />
                    </>
                  )}

                  {!d.verfuegbar && (
                    <span className="text-xs text-white/30">Nicht verfügbar</span>
                  )}

                  {/* Save indicator */}
                  <button
                    onClick={() => saveDay(i)}
                    disabled={d.saving}
                    className="flex-shrink-0 ml-auto"
                  >
                    {d.saving ? (
                      <svg className="w-4 h-4 animate-spin text-white/30" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : d.saved ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-teal)" }}>
                        <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white/20 hover:text-white/50 transition-colors" fill="none" viewBox="0 0 16 16">
                        <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save all */}
      <button
        onClick={saveAll}
        className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg border transition-colors"
        style={{
          backgroundColor: "rgba(30,122,107,0.2)",
          borderColor: "rgba(30,122,107,0.4)",
          color: "var(--c-teal)",
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Alle Tage speichern
      </button>
    </div>
  );
}
