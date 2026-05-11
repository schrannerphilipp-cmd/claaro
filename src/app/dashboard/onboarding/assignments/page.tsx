"use client";

import { useState } from "react";
import Link from "next/link";
import FeatureLayout from "../../_components/feature-layout";
import { useOnboardTemplates } from "@/hooks/useOnboardTemplates";
import { useOnboardAssignments } from "@/hooks/useOnboardAssignments";
import { OnboardAssignment } from "@/types/onboard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Nicht gestartet",
  in_progress: "Läuft",
  completed: "Abgeschlossen",
};
const STATUS_COLOR: Record<string, string> = {
  not_started: "text-white/30 bg-white/5 border-white/10",
  in_progress: "text-[var(--c-amber)] bg-[var(--c-amber)]/10 border-[var(--c-amber)]/20",
  completed: "text-[var(--c-teal)] bg-[var(--c-teal)]/10 border-[var(--c-teal)]/20",
};

export default function AssignmentsPage() {
  const { templates, isLoaded: tLoaded } = useOnboardTemplates();
  const { assignments, isLoaded: aLoaded, createAssignment, deleteAssignment } = useOnboardAssignments();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setFormError("Name ist erforderlich."); return; }
    if (!templateId) { setFormError("Bitte ein Template auswählen."); return; }
    createAssignment({
      templateId,
      employeeId: name.trim().toLowerCase().replace(/\s+/g, "-"),
      employeeName: name.trim(),
      dueDate: dueDate || undefined,
    });
    setName("");
    setTemplateId("");
    setDueDate("");
    setFormError("");
    setShowForm(false);
  }

  const sorted = [...assignments].sort(
    (a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
  );

  function getProgress(a: OnboardAssignment) {
    const tpl = templates.find((t) => t.id === a.templateId);
    const total = tpl?.steps.length ?? 0;
    const done = a.progress.length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  return (
    <FeatureLayout
      name="Zuweisungen"
      description="Einarbeitungs-Templates Mitarbeitern zuweisen und den Fortschritt verfolgen."
    >
      <div className="space-y-5" style={sans}>
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            {assignments.length} Einarbeitung{assignments.length !== 1 ? "en" : ""}
          </p>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Neue Einarbeitung
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4"
          >
            <p className="text-sm font-medium text-white">Mitarbeiter einarbeiten</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name des Mitarbeiters</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFormError(""); }}
                  placeholder="Max Mustermann"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Template</label>
                <select
                  value={templateId}
                  onChange={(e) => { setTemplateId(e.target.value); setFormError(""); }}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Template auswählen…</option>
                  {templates
                    .filter((t) => t.isPublished)
                    .map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fällig bis (optional)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {formError && (
              <p className="text-xs text-[var(--c-accent)] bg-[var(--c-accent)]/10 px-3 py-2 rounded-lg">
                {formError}
              </p>
            )}
            {tLoaded && templates.filter((t) => t.isPublished).length === 0 && (
              <p className="text-xs text-white/30">
                Keine veröffentlichten Templates.{" "}
                <Link href="/dashboard/onboarding/templates" className="underline">
                  Templates bearbeiten
                </Link>
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: "rgba(30,122,107,0.3)", color: "var(--c-teal)" }}
              >
                Einarbeitung starten
              </button>
            </div>
          </form>
        )}

        {/* Table */}
        {!aLoaded || !tLoaded ? (
          <div className="py-16 text-center text-white/30 text-sm">Lädt…</div>
        ) : sorted.length === 0 ? (
          <div className="py-16 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-4xl mb-4">🤝</p>
            <p className="text-sm font-medium text-white mb-1">Noch keine Einarbeitungen</p>
            <p className="text-xs text-white/40">Weise ein Template einem Mitarbeiter zu.</p>
          </div>
        ) : (
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_100px_90px_80px] items-center px-5 py-2.5 border-b border-white/10 text-xs text-white/30">
              <span>Mitarbeiter</span>
              <span>Template</span>
              <span>Fortschritt</span>
              <span>Status</span>
              <span />
            </div>
            {sorted.map((a, i) => {
              const { done, total, pct } = getProgress(a);
              const tpl = templates.find((t) => t.id === a.templateId);
              return (
                <div
                  key={a.id}
                  className={`grid grid-cols-[1fr_1fr_100px_90px_80px] items-center px-5 py-3.5 ${
                    i > 0 ? "border-t border-white/10" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm text-white">{a.employeeName}</p>
                    {a.dueDate && (
                      <p className="text-[10px] text-white/30">
                        Fällig: {new Date(a.dueDate).toLocaleDateString("de-DE")}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-white/50 truncate pr-4">
                    {tpl?.title ?? "—"}
                  </p>
                  <div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: "var(--c-teal)" }}
                      />
                    </div>
                    <p className="text-[10px] text-white/30">{done}/{total} Schritte</p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[a.status]}`}
                  >
                    {STATUS_LABEL[a.status]}
                  </span>
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/dashboard/onboarding/run/${a.id}`}
                      className="text-xs text-white/40 hover:text-white border border-white/10 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors"
                    >
                      Öffnen
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm(`Einarbeitung von ${a.employeeName} löschen?`)) {
                          deleteAssignment(a.id);
                        }
                      }}
                      className="text-white/20 hover:text-[var(--c-accent)] transition-colors"
                      title="Löschen"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                        <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FeatureLayout>
  );
}
