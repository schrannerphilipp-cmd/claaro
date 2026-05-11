"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOnboardTemplates } from "@/hooks/useOnboardTemplates";
import { OnboardTemplate } from "@/types/onboard";
import StepBuilder from "@/components/onboard/StepBuilder";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function TemplateBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getTemplate, updateTemplate, isLoaded } = useOnboardTemplates();

  const [local, setLocal] = useState<OnboardTemplate | null>(null);
  const [savedLabel, setSavedLabel] = useState<"idle" | "saving" | "saved">("idle");
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const t = getTemplate(id);
    if (!t) {
      router.replace("/dashboard/onboarding/templates");
      return;
    }
    setLocal(t);
  }, [isLoaded, id, getTemplate, router]);

  const save = useCallback(() => {
    if (!local) return;
    setSavedLabel("saving");
    updateTemplate(local.id, local);
    setTimeout(() => setSavedLabel("saved"), 300);
    setTimeout(() => setSavedLabel("idle"), 3000);
  }, [local, updateTemplate]);

  useEffect(() => {
    autoRef.current = setInterval(save, 30_000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [save]);

  function handleUpdate(patch: Partial<OnboardTemplate>) {
    setLocal((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function handleBack() {
    save();
    router.push("/dashboard/onboarding/templates");
  }

  const totalMin = local?.steps.reduce((s, step) => s + step.estimatedMinutes, 0) ?? 0;

  if (!isLoaded || !local) {
    return (
      <div className="min-h-screen bg-[#1a1814] flex items-center justify-center" style={sans}>
        <p className="text-sm text-white/30">Lädt…</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1814]" style={sans}>
      {/* ── Builder header ─────────────────────────────────────────────── */}
      <header className="border-b border-white/10 bg-[#1a1814] shrink-0 z-20">
        <div className="px-5 py-3 flex items-center gap-3">
          {/* Back */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Zurück
          </button>

          <div className="w-px h-4 bg-white/10 shrink-0" />

          {/* Inline title */}
          <input
            value={local.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            className="flex-1 bg-transparent text-sm font-medium text-white placeholder-white/30 focus:outline-none min-w-0"
            placeholder="Template-Titel…"
          />

          {/* Role */}
          <input
            value={local.role}
            onChange={(e) => handleUpdate({ role: e.target.value })}
            className="w-36 bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white/70 placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors shrink-0"
            placeholder="Rolle / Position"
          />

          {/* Duration */}
          {totalMin > 0 && (
            <span className="text-xs text-white/30 shrink-0">ca. {totalMin} Min.</span>
          )}

          {/* Published toggle */}
          <button
            onClick={() => handleUpdate({ isPublished: !local.isPublished })}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              local.isPublished
                ? "border-[var(--c-teal)]/40 text-[var(--c-teal)] bg-[var(--c-teal)]/10"
                : "border-white/10 text-white/40 bg-white/5"
            }`}
          >
            {local.isPublished ? "Veröffentlicht" : "Entwurf"}
          </button>

          {/* Save */}
          <button
            onClick={save}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }}
          >
            {savedLabel === "saving" ? "Speichert…" : savedLabel === "saved" ? "Gespeichert ✓" : "Speichern"}
          </button>
        </div>

        {/* Description row */}
        <div className="px-5 pb-2">
          <input
            value={local.description}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            className="w-full bg-transparent text-xs text-white/40 placeholder-white/20 focus:outline-none"
            placeholder="Kurze Beschreibung des Templates (optional)…"
          />
        </div>
      </header>

      {/* ── Builder body ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        <StepBuilder template={local} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
