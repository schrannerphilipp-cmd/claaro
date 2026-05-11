"use client";

import Link from "next/link";
import FeatureLayout from "../_components/feature-layout";
import { useOnboardTemplates } from "@/hooks/useOnboardTemplates";
import { useOnboardAssignments } from "@/hooks/useOnboardAssignments";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const STATUS_LABEL: Record<string, string> = {
  not_started: "Nicht gestartet",
  in_progress: "Läuft",
  completed: "Abgeschlossen",
};
const STATUS_COLOR: Record<string, string> = {
  not_started: "text-white/30",
  in_progress: "text-[var(--c-amber)]",
  completed: "text-[var(--c-teal)]",
};

export default function OnboardingOverviewPage() {
  const { templates, isLoaded: tLoaded } = useOnboardTemplates();
  const { assignments, isLoaded: aLoaded } = useOnboardAssignments();

  const active = assignments.filter((a) => a.status === "in_progress").length;
  const completed = assignments.filter((a) => a.status === "completed").length;
  const recent = [...assignments]
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 5);

  return (
    <FeatureLayout
      name="Onboarding"
      description="Strukturierte Einarbeitungspläne erstellen und Mitarbeitern zuweisen — alles an einem Ort."
    >
      {!tLoaded || !aLoaded ? (
        <div className="py-20 text-center text-white/30 text-sm" style={sans}>
          Lädt…
        </div>
      ) : (
        <div className="space-y-8" style={sans}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Templates", value: templates.length, sub: "erstellt" },
              { label: "Einarbeitungen", value: active, sub: "laufen gerade", accent: true },
              { label: "Abgeschlossen", value: completed, sub: "gesamt" },
            ].map(({ label, value, sub, accent }) => (
              <div
                key={label}
                className="bg-white/5 border border-white/10 rounded-xl px-5 py-4"
              >
                <p
                  className="text-2xl font-bold mb-0.5"
                  style={accent ? { color: "var(--c-teal)" } : { color: "white" }}
                >
                  {value}
                </p>
                <p className="text-xs font-medium text-white/60">{label}</p>
                <p className="text-[10px] text-white/30">{sub}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/onboarding/templates/new"
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Neues Template
            </Link>
            <Link
              href="/dashboard/onboarding/templates"
              className="text-sm px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Template-Bibliothek
            </Link>
            <Link
              href="/dashboard/onboarding/assignments"
              className="text-sm px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              Alle Zuweisungen
            </Link>
          </div>

          {/* Recent assignments */}
          <div>
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
              Letzte Einarbeitungen
            </p>
            {recent.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl py-10 text-center">
                <p className="text-sm text-white/30">
                  Noch keine Einarbeitungen —{" "}
                  <Link
                    href="/dashboard/onboarding/assignments"
                    className="underline hover:text-white/60 transition-colors"
                  >
                    jetzt zuweisen
                  </Link>
                </p>
              </div>
            ) : (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                {recent.map((a, i) => {
                  const tpl = templates.find((t) => t.id === a.templateId);
                  const totalSteps = tpl?.steps.length ?? 0;
                  const doneSteps = a.progress.length;
                  const pct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-4 px-5 py-3.5 ${
                        i > 0 ? "border-t border-white/10" : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{a.employeeName}</p>
                        <p className="text-xs text-white/40 truncate">
                          {tpl?.title ?? "Gelöschtes Template"}
                        </p>
                      </div>
                      {/* Progress bar */}
                      <div className="w-24 shrink-0">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: "var(--c-teal)",
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5 text-right">{pct}%</p>
                      </div>
                      <span className={`text-xs shrink-0 ${STATUS_COLOR[a.status]}`}>
                        {STATUS_LABEL[a.status]}
                      </span>
                      <Link
                        href={`/dashboard/onboarding/run/${a.id}`}
                        className="shrink-0 text-xs text-white/40 hover:text-white transition-colors border border-white/10 rounded-lg px-3 py-1 hover:bg-white/5"
                      >
                        Öffnen
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </FeatureLayout>
  );
}
