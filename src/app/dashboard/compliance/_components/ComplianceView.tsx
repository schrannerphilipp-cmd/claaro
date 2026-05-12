"use client";

import { useState, useMemo } from "react";
import { useComplianceTasks } from "@/hooks/useComplianceTasks";
import { triggerZeitersparnisToast } from "@/lib/zeitersparnis";
import type {
  ComplianceTask,
  Branche,
  ComplianceStatus,
  Priorität,
} from "@/types/compliance";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

// ─── helpers ─────────────────────────────────────────────────────────────────

const BRANCHEN: { key: Branche | "alle"; label: string; emoji: string }[] = [
  { key: "alle", label: "Alle Branchen", emoji: "⚖️" },
  { key: "gastronomie", label: "Gastronomie", emoji: "🍽️" },
  { key: "handwerk", label: "Handwerk", emoji: "🔧" },
  { key: "gesundheitswesen", label: "Gesundheitswesen", emoji: "🏥" },
];

const PRIO_ORDER: Record<Priorität, number> = { hoch: 0, mittel: 1, niedrig: 2 };
const STATUS_ORDER: Record<ComplianceStatus, number> = {
  überfällig: 0,
  offen: 1,
  erledigt: 2,
};

function daysUntil(frist: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const f = new Date(frist);
  f.setHours(0, 0, 0, 0);
  return Math.round((f.getTime() - today.getTime()) / 86_400_000);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function statusColor(s: ComplianceStatus) {
  if (s === "erledigt") return "var(--c-teal)";
  if (s === "überfällig") return "var(--c-accent)";
  return "rgba(255,255,255,0.5)";
}

function prioColor(p: Priorität) {
  if (p === "hoch") return "var(--c-accent)";
  if (p === "mittel") return "var(--c-amber)";
  return "rgba(255,255,255,0.35)";
}

function WiederholungIcon({ w }: { w: ComplianceTask["wiederholung"] }) {
  const map: Record<string, string> = {
    täglich: "↻",
    monatlich: "↻",
    jährlich: "↻",
    einmalig: "◉",
  };
  return (
    <span className="text-white/30 text-xs" title={w}>
      {map[w]} {w}
    </span>
  );
}

// ─── stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 flex flex-col gap-1">
      <span
        className="text-2xl font-semibold"
        style={{ color: accent ?? "white" }}
      >
        {value}
      </span>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}

// ─── task card ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onMarkErledigt,
  onMarkOffen,
  showBranche,
}: {
  task: ComplianceTask;
  onMarkErledigt: (id: string) => void;
  onMarkOffen: (id: string) => void;
  showBranche: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const days = daysUntil(task.frist);
  const isErledigt = task.status === "erledigt";
  const isUeberfaellig = task.status === "überfällig";

  const borderColor = isErledigt
    ? "var(--c-teal)"
    : isUeberfaellig
    ? "var(--c-accent)"
    : task.priorität === "hoch"
    ? "rgba(245,158,11,0.5)"
    : "rgba(255,255,255,0.08)";

  const brancheLabel =
    BRANCHEN.find((b) => b.key === task.branche)?.label ?? task.branche;

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        borderColor,
        borderLeftWidth: 3,
        backgroundColor: isErledigt
          ? "rgba(30,122,107,0.06)"
          : isUeberfaellig
          ? "rgba(200,75,47,0.07)"
          : "rgba(255,255,255,0.04)",
      }}
    >
      {/* header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
      >
        {/* status dot */}
        <span
          className="mt-0.5 flex-shrink-0 w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: statusColor(task.status) }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-sm font-medium ${isErledigt ? "text-white/40 line-through" : "text-white"}`}
            >
              {task.titel}
            </span>
            {/* badges */}
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                color: statusColor(task.status),
                borderColor: statusColor(task.status) + "55",
                backgroundColor: statusColor(task.status) + "15",
              }}
            >
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full border"
              style={{
                color: prioColor(task.priorität),
                borderColor: prioColor(task.priorität) + "55",
                backgroundColor: prioColor(task.priorität) + "12",
              }}
            >
              {task.priorität}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
            <span className="bg-white/5 px-2 py-0.5 rounded-md text-white/50">
              {task.kategorie}
            </span>
            {showBranche && (
              <span className="text-white/30">{brancheLabel}</span>
            )}
            <WiederholungIcon w={task.wiederholung} />
          </div>
        </div>

        {/* frist */}
        <div className="flex-shrink-0 text-right">
          <p
            className="text-xs font-medium"
            style={{ color: isUeberfaellig ? "var(--c-accent)" : "rgba(255,255,255,0.55)" }}
          >
            {formatDate(task.frist)}
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">
            {isErledigt
              ? "erledigt"
              : days === 0
              ? "heute"
              : days < 0
              ? `${Math.abs(days)} T überfällig`
              : `in ${days} T`}
          </p>
        </div>

        {/* chevron */}
        <svg
          className={`w-4 h-4 text-white/25 flex-shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M6 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* expanded body */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/8 pt-4 space-y-4">
          <p className="text-sm text-white/60 leading-relaxed">
            {task.beschreibung}
          </p>

          {/* meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetaItem label="Erinnerung" value={`${task.erinnerungTage} Tage vorher`} />
            <MetaItem label="Wiederholung" value={task.wiederholung} />
            <MetaItem label="Kategorie" value={task.kategorie} />
            <MetaItem label="Branche" value={brancheLabel} />
          </div>

          {/* dokumente */}
          {task.dokumente.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                Vorlagen & Dokumente
              </p>
              <div className="flex flex-wrap gap-2">
                {task.dokumente.map((doc) => (
                  <span
                    key={doc}
                    className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-white/50"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                      <path
                        d="M4 2h5.5L12 4.5V14H4V2z"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 2v3h3"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* action */}
          <div className="flex gap-2 pt-1">
            {!isErledigt ? (
              <button
                onClick={() => onMarkErledigt(task.id)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: "rgba(30,122,107,0.18)",
                  borderColor: "rgba(30,122,107,0.35)",
                  color: "var(--c-teal)",
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M3 8l3.5 3.5L13 4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Als erledigt markieren
              </button>
            ) : (
              <button
                onClick={() => onMarkOffen(task.id)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Zurücksetzen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/4 rounded-lg px-3 py-2">
      <p className="text-[10px] text-white/30 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs text-white/65">{value}</p>
    </div>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl py-14 px-8 text-center">
      <p className="text-3xl mb-4">{filtered ? "🔍" : "✅"}</p>
      <p className="text-white/60 text-sm">
        {filtered
          ? "Keine Aufgaben für diesen Filter gefunden."
          : "Alle Compliance-Aufgaben erledigt."}
      </p>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

type Sort = "frist" | "priorität" | "status";

export default function ComplianceView() {
  const { tasks, loaded, markErledigt: _markErledigt, markOffen } = useComplianceTasks();

  function markErledigt(id: string) {
    _markErledigt(id);
    triggerZeitersparnisToast("Aufgabe abgehakt", 15);
  }

  const [activeBranche, setActiveBranche] = useState<Branche | "alle">("alle");
  const [activeKategorie, setActiveKategorie] = useState<string>("alle");
  const [sort, setSort] = useState<Sort>("frist");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "alle">("alle");

  // derive categories for current branche
  const kategorien = useMemo(() => {
    const base =
      activeBranche === "alle"
        ? tasks
        : tasks.filter((t) => t.branche === activeBranche);
    return Array.from(new Set(base.map((t) => t.kategorie))).sort();
  }, [tasks, activeBranche]);

  // reset category when branche changes
  const handleBrancheChange = (b: Branche | "alle") => {
    setActiveBranche(b);
    setActiveKategorie("alle");
  };

  // stats for current branche selection
  const stats = useMemo(() => {
    const base =
      activeBranche === "alle"
        ? tasks
        : tasks.filter((t) => t.branche === activeBranche);
    return {
      total: base.length,
      offen: base.filter((t) => t.status === "offen").length,
      ueberfaellig: base.filter((t) => t.status === "überfällig").length,
      erledigt: base.filter((t) => t.status === "erledigt").length,
    };
  }, [tasks, activeBranche]);

  // filtered & sorted tasks
  const visible = useMemo(() => {
    let result = tasks;
    if (activeBranche !== "alle")
      result = result.filter((t) => t.branche === activeBranche);
    if (activeKategorie !== "alle")
      result = result.filter((t) => t.kategorie === activeKategorie);
    if (statusFilter !== "alle")
      result = result.filter((t) => t.status === statusFilter);

    return [...result].sort((a, b) => {
      if (sort === "frist")
        return new Date(a.frist).getTime() - new Date(b.frist).getTime();
      if (sort === "priorität")
        return PRIO_ORDER[a.priorität] - PRIO_ORDER[b.priorität];
      return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    });
  }, [tasks, activeBranche, activeKategorie, statusFilter, sort]);

  if (!loaded) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" style={sans}>
      {/* ── Branche Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {BRANCHEN.map((b) => {
          const active = activeBranche === b.key;
          return (
            <button
              key={b.key}
              onClick={() => handleBrancheChange(b.key as Branche | "alle")}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all duration-150"
              style={
                active
                  ? {
                      backgroundColor: "rgba(30,122,107,0.2)",
                      borderColor: "rgba(30,122,107,0.4)",
                      color: "var(--c-teal)",
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.45)",
                    }
              }
            >
              <span>{b.emoji}</span>
              <span>{b.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Aufgaben gesamt" value={stats.total} />
        <StatCard label="Offen" value={stats.offen} />
        <StatCard
          label="Überfällig"
          value={stats.ueberfaellig}
          accent="var(--c-accent)"
        />
        <StatCard
          label="Erledigt"
          value={stats.erledigt}
          accent="var(--c-teal)"
        />
      </div>

      {/* ── Filter row ── */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* category pills */}
        <div className="flex gap-1.5 flex-wrap">
          {["alle", ...kategorien].map((k) => {
            const active = activeKategorie === k;
            return (
              <button
                key={k}
                onClick={() => setActiveKategorie(k)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                style={
                  active
                    ? {
                        backgroundColor: "rgba(255,255,255,0.12)",
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
                {k === "alle" ? "Alle Kategorien" : k}
              </button>
            );
          })}
        </div>

        {/* right-side controls */}
        <div className="flex gap-2 items-center">
          {/* status filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ComplianceStatus | "alle")
            }
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 focus:outline-none focus:border-white/25"
          >
            <option value="alle">Alle Status</option>
            <option value="offen">Offen</option>
            <option value="überfällig">Überfällig</option>
            <option value="erledigt">Erledigt</option>
          </select>

          {/* sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 focus:outline-none focus:border-white/25"
          >
            <option value="frist">Sortierung: Frist</option>
            <option value="priorität">Sortierung: Priorität</option>
            <option value="status">Sortierung: Status</option>
          </select>
        </div>
      </div>

      {/* ── count label ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/30">
          {visible.length} Aufgabe{visible.length !== 1 ? "n" : ""}
          {statusFilter !== "alle" || activeKategorie !== "alle"
            ? " (gefiltert)"
            : ""}
        </p>
        {stats.ueberfaellig > 0 && (
          <p
            className="text-xs flex items-center gap-1.5"
            style={{ color: "var(--c-accent)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
              <path
                d="M8 2l6 12H2L8 2z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M8 6v4M8 11.5v.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            {stats.ueberfaellig} Aufgabe
            {stats.ueberfaellig !== 1 ? "n" : ""} überfällig
          </p>
        )}
      </div>

      {/* ── Task list ── */}
      {visible.length === 0 ? (
        <EmptyState filtered={activeKategorie !== "alle" || statusFilter !== "alle"} />
      ) : (
        <div className="space-y-2">
          {visible.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onMarkErledigt={markErledigt}
              onMarkOffen={markOffen}
              showBranche={activeBranche === "alle"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
