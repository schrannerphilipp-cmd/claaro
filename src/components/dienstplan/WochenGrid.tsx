"use client";

import { useState } from "react";
import type { Shift, Employee, ShiftPlan } from "@/types/dienstplan";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const TAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function isoWeekToMonday(woche: string): Date {
  const [yearStr, weekStr] = woche.replace("W", "").split("-");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dow - 1) + (week - 1) * 7);
  return monday;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIso(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function shiftDuration(von: string, bis: string, pauseMin: number): string {
  const [h1, m1] = von.split(":").map(Number);
  const [h2, m2] = bis.split(":").map(Number);
  const total = (h2 * 60 + m2) - (h1 * 60 + m1) - pauseMin;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function statusStyle(status: Shift["status"]) {
  if (status === "bestaetigt")
    return { bg: "rgba(30,122,107,0.2)", border: "rgba(30,122,107,0.4)", color: "var(--c-teal)" };
  if (status === "getauscht")
    return { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.35)", color: "var(--c-amber)" };
  return { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" };
}

interface Props {
  plan: ShiftPlan | null;
  shifts: Shift[];
  employees: Employee[];
  woche: string;
  onVeroeffentlichen?: () => void;
  isPublishing?: boolean;
}

export default function WochenGrid({
  plan,
  shifts,
  employees,
  woche,
  onVeroeffentlichen,
  isPublishing,
}: Props) {
  const [expandedShift, setExpandedShift] = useState<string | null>(null);
  const [showBegruendung, setShowBegruendung] = useState(false);

  const monday = isoWeekToMonday(woche);
  const days = TAGE.map((tag, i) => ({
    label: tag,
    datum: toIso(addDays(monday, i)),
  }));

  const shiftsByEmpDay: Record<string, Record<string, Shift[]>> = {};
  for (const s of shifts) {
    if (!shiftsByEmpDay[s.employee_id]) shiftsByEmpDay[s.employee_id] = {};
    if (!shiftsByEmpDay[s.employee_id][s.datum]) shiftsByEmpDay[s.employee_id][s.datum] = [];
    shiftsByEmpDay[s.employee_id][s.datum].push(s);
  }

  const activeEmployees = employees.filter((e) => e.aktiv);

  return (
    <div className="space-y-4" style={sans}>
      {/* Plan header */}
      {plan && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="text-xs px-2.5 py-1 rounded-full border"
              style={
                plan.status === "veroeffentlicht"
                  ? { backgroundColor: "rgba(30,122,107,0.2)", borderColor: "rgba(30,122,107,0.4)", color: "var(--c-teal)" }
                  : { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)" }
              }
            >
              {plan.status === "veroeffentlicht" ? "Veröffentlicht" : "Entwurf"}
            </span>
            {plan.ki_begruendung && (
              <button
                onClick={() => setShowBegruendung((v) => !v)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 7v4M8 5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                KI-Begründung
              </button>
            )}
          </div>
          {plan.status === "entwurf" && onVeroeffentlichen && (
            <button
              onClick={onVeroeffentlichen}
              disabled={isPublishing}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-40"
              style={{
                backgroundColor: "rgba(30,122,107,0.2)",
                borderColor: "rgba(30,122,107,0.4)",
                color: "var(--c-teal)",
              }}
            >
              {isPublishing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              Plan veröffentlichen
            </button>
          )}
        </div>
      )}

      {/* KI-Begründung */}
      {showBegruendung && plan?.ki_begruendung && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/60 leading-relaxed">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">KI-Begründung</p>
          {plan.ki_begruendung}
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs text-white/40 font-medium w-36 bg-white/4">
                Mitarbeiter
              </th>
              {days.map((d) => (
                <th key={d.datum} className="px-2 py-3 text-center bg-white/4 border-l border-white/8">
                  <p className="text-xs text-white/70 font-medium">{d.label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{formatDate(d.datum)}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeEmployees.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-white/30 text-sm">
                  Keine aktiven Mitarbeiter.
                </td>
              </tr>
            )}
            {activeEmployees.map((emp, i) => (
              <tr
                key={emp.id}
                className={`border-b border-white/6 ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
              >
                <td className="px-4 py-2">
                  <p className="text-sm text-white/80 font-medium truncate">{emp.name}</p>
                  <p className="text-[10px] text-white/30">{emp.vertrag_typ} · {emp.stunden_pro_woche}h</p>
                </td>
                {days.map((d) => {
                  const dayShifts = shiftsByEmpDay[emp.id]?.[d.datum] ?? [];
                  return (
                    <td key={d.datum} className="px-1.5 py-1.5 border-l border-white/6 align-top min-w-[90px]">
                      {dayShifts.length === 0 ? (
                        <div className="h-10 flex items-center justify-center">
                          <span className="text-white/10 text-xs">—</span>
                        </div>
                      ) : (
                        dayShifts.map((s) => {
                          const st = statusStyle(s.status);
                          const isExpanded = expandedShift === s.id;
                          return (
                            <button
                              key={s.id}
                              onClick={() => setExpandedShift(isExpanded ? null : s.id)}
                              className="w-full text-left rounded-lg px-2 py-1.5 border mb-1 transition-colors"
                              style={{ backgroundColor: st.bg, borderColor: st.border }}
                            >
                              <p className="text-xs font-medium" style={{ color: st.color }}>
                                {s.von.slice(0, 5)}–{s.bis.slice(0, 5)}
                              </p>
                              {isExpanded && (
                                <div className="mt-1 space-y-0.5">
                                  <p className="text-[10px] text-white/40">
                                    {shiftDuration(s.von, s.bis, s.pause_minuten)} · {s.pause_minuten}min Pause
                                  </p>
                                  {s.rolle_im_dienst && (
                                    <p className="text-[10px] text-white/40">{s.rolle_im_dienst}</p>
                                  )}
                                  <p className="text-[10px] text-white/30 capitalize">{s.status}</p>
                                  {s.erstellt_von_ki && (
                                    <p className="text-[10px]" style={{ color: "var(--c-teal)" }}>✦ KI</p>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-4 text-[11px] text-white/35">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-white/10 border border-white/15" />
          Entwurf
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(30,122,107,0.3)" }} />
          Bestätigt
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "rgba(245,158,11,0.25)" }} />
          Getauscht
        </span>
        <span className="flex items-center gap-1.5 text-white/20">✦ KI-generiert</span>
      </div>
    </div>
  );
}
