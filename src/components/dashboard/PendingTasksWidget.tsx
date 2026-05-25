"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { Plan } from "@/lib/plan-gate";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";
import type { ComplianceTask } from "@/types/compliance";
import { COMPLIANCE_SEED } from "@/lib/compliance-data";

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

interface PendingTask {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
}

interface Props {
  userPlan: Plan | null;
  displayAvatar: string | null;
}

export default function PendingTasksWidget({ userPlan, displayAvatar }: Props) {
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  useEffect(() => {
    async function loadTasks() {
      const pending: PendingTask[] = [];

      if (!displayAvatar) {
        pending.push({
          id: "avatar",
          title: "Profilbild fehlt",
          description: "Lade ein Profilbild hoch, damit dein Team dich erkennt.",
          href: "/dashboard/konto",
          icon: "👤",
        });
      }

      if (!userPlan) {
        pending.push({
          id: "abo",
          title: "Kein aktives Abo",
          description: "Wähle einen Plan, um alle Claaro-Funktionen zu nutzen.",
          href: "/dashboard/konto",
          icon: "💳",
        });
      }

      if (HAUPTACCOUNT_ID && supabaseConfigured) {
        const supabase = getBrowserClient();
        if (supabase) {
          const [firmaRes, todosRes] = await Promise.all([
            supabase
              .from("company_settings")
              .select("firmenname")
              .eq("hauptaccount_id", HAUPTACCOUNT_ID)
              .maybeSingle(),
            supabase
              .from("team_todos")
              .select("id,titel")
              .eq("hauptaccount_id", HAUPTACCOUNT_ID)
              .eq("erledigt", false),
          ]);

          if (!firmaRes.data?.firmenname) {
            pending.push({
              id: "firmendaten",
              title: "Firmendaten unvollständig",
              description: "Trage Firmenname und Adresse ein.",
              href: "/dashboard/konto",
              icon: "🏢",
            });
          }

          if (!firmaRes.error && todosRes.data) {
            const slice = todosRes.data.slice(0, 3);
            for (const todo of slice) {
              pending.push({
                id: `todo-${todo.id}`,
                title: "Offene Teamaufgabe",
                description: todo.titel,
                href: "/dashboard/konto",
                icon: "📋",
              });
            }
            const rest = todosRes.data.length - slice.length;
            if (rest > 0) {
              pending.push({
                id: "todos-more",
                title: `+${rest} weitere Teamaufgaben`,
                description: "Im Bereich 'Mein Konto' alle Aufgaben anzeigen.",
                href: "/dashboard/konto",
                icon: "📋",
              });
            }
          }
        }
      }

      try {
        const raw = localStorage.getItem("claaro-compliance-tasks");
        const all: ComplianceTask[] = raw ? JSON.parse(raw) : COMPLIANCE_SEED;
        const openOnes = all.filter((t) => t.status === "offen");
        for (const t of openOnes.slice(0, 2)) {
          pending.push({
            id: `compliance-${t.id}`,
            title: t.titel,
            description: t.kategorie,
            href: "/dashboard/compliance",
            icon: "⚠️",
          });
        }
        const moreCompliance = openOnes.length - Math.min(openOnes.length, 2);
        if (moreCompliance > 0) {
          pending.push({
            id: "compliance-more",
            title: `+${moreCompliance} offene Compliance-Aufgaben`,
            description: "Im Compliance-Bereich alle anzeigen.",
            href: "/dashboard/compliance",
            icon: "📑",
          });
        }
      } catch {/* ignore */}

      setTasks(pending);
      setLoading(false);
    }

    loadTasks();
  }, [userPlan, displayAvatar]);

  if (loading) return null;

  const count = tasks.length;
  const allDone = count === 0;

  return (
    <div
      ref={containerRef}
      className="fixed z-40"
      style={{ top: 80, right: 24 }}
    >
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 h-9 rounded-full shadow-lg transition-all duration-200"
        style={{
          backgroundColor: allDone ? "var(--c-teal)" : "var(--c-accent)",
          paddingLeft: 12,
          paddingRight: allDone ? 12 : 8,
        }}
        aria-label={allDone ? "Alle Aufgaben erledigt" : `${count} ausstehende Aufgaben`}
      >
        {allDone ? (
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 20 20">
            <path d="M5 10l3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <>
            {/* Warning icon */}
            <svg className="w-4 h-4 text-white flex-none" fill="none" viewBox="0 0 20 20">
              <path d="M10 3a7 7 0 100 14A7 7 0 0010 3zm0 4v3.5M10 13.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {/* Badge */}
            <span
              className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold leading-none"
              style={{ backgroundColor: "rgba(255,255,255,0.25)", color: "white" }}
            >
              {count}
            </span>
          </>
        )}
      </button>

      {/* Dropdown panel */}
      <div
        className="absolute right-0 mt-2 w-80 rounded-xl border border-white/15 shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "rgba(22, 20, 16, 0.97)",
          backdropFilter: "blur(12px)",
          maxHeight: open ? "320px" : "0",
          opacity: open ? 1 : 0,
          transition: "max-height 260ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Panel header */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-white/55 uppercase tracking-wider">
            {allDone ? "Alles erledigt" : "Ausstehende Aufgaben"}
          </p>
          {allDone && (
            <svg className="w-3.5 h-3.5 flex-none" fill="none" viewBox="0 0 20 20" style={{ color: "var(--c-teal)" }}>
              <path d="M5 10l3.5 3.5L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {!allDone && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.2)", color: "var(--c-accent)" }}
            >
              {count}
            </span>
          )}
        </div>

        {/* Task list */}
        <div className="overflow-y-auto" style={{ maxHeight: 272 }}>
          {allDone ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-white/50">Keine offenen Aufgaben.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors group border-b border-white/[0.06] last:border-0"
              >
                <span className="text-sm mt-0.5 leading-none flex-none">{task.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/75 group-hover:text-white transition-colors truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-white/50 truncate mt-0.5">{task.description}</p>
                </div>
                <svg
                  className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors mt-1 flex-none"
                  fill="none" viewBox="0 0 16 16"
                >
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
