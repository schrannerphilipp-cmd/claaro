"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardAssignments } from "@/hooks/useOnboardAssignments";
import { OnboardTemplate } from "@/types/onboard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

interface AssignModalProps {
  template: OnboardTemplate;
  onClose: () => void;
}

export default function AssignModal({ template, onClose }: AssignModalProps) {
  const router = useRouter();
  const { createAssignment } = useOnboardAssignments();
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Bitte einen Namen eingeben.");
      return;
    }
    const a = createAssignment({
      templateId: template.id,
      employeeId: name.trim().toLowerCase().replace(/\s+/g, "-"),
      employeeName: name.trim(),
      dueDate: dueDate || undefined,
    });
    router.push(`/dashboard/onboarding/run/${a.id}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm bg-[#1a1814] border border-white/15 rounded-2xl p-6 shadow-2xl"
        style={sans}
      >
        <h2 className="text-base font-semibold text-white mb-1">Einarbeitung zuweisen</h2>
        <p className="text-xs text-white/40 mb-5">
          Template: <span className="text-white/70">{template.title}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Name des Mitarbeiters</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="Max Mustermann"
              className={inputClass}
            />
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
          {error && (
            <p className="text-xs text-[var(--c-accent)] bg-[var(--c-accent)]/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: "rgba(30,122,107,0.3)", color: "var(--c-teal)" }}
            >
              Einarbeitung starten
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
