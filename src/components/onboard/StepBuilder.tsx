"use client";

import { useState } from "react";
import {
  OnboardStep,
  OnboardTemplate,
  StepType,
  ChecklistContent,
  VideoContent,
  QuizContent,
  DocumentContent,
  StepContent,
} from "@/types/onboard";
import StepTypeSelector from "./StepTypeSelector";
import ChecklistEditor from "./ChecklistEditor";
import VideoEmbedEditor from "./VideoEmbedEditor";
import QuizEditor from "./QuizEditor";
import DocumentEditor from "./DocumentEditor";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_CONTENT: Record<StepType, StepContent> = {
  checklist: { items: [] } satisfies ChecklistContent,
  video: { url: "", title: "", description: "", duration: 5 } satisfies VideoContent,
  quiz: { questions: [] } satisfies QuizContent,
  document: { title: "", richText: "" } satisfies DocumentContent,
};

const TYPE_LABEL: Record<StepType, string> = {
  checklist: "Checkliste",
  video: "Video",
  quiz: "Quiz",
  document: "Dokument",
};

const TYPE_DOT: Record<StepType, string> = {
  checklist: "var(--c-teal)",
  video: "#a855f7",
  quiz: "var(--c-amber)",
  document: "var(--c-accent)",
};

interface StepBuilderProps {
  template: OnboardTemplate;
  onUpdate: (patch: Partial<OnboardTemplate>) => void;
}

export default function StepBuilder({ template, onUpdate }: StepBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    template.steps[0]?.id ?? null
  );
  const [addingStep, setAddingStep] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const steps = template.steps;
  const selected = steps.find((s) => s.id === selectedId) ?? null;

  function addStep(type: StepType) {
    const newStep: OnboardStep = {
      id: genId(),
      order: steps.length + 1,
      title: `Neuer ${TYPE_LABEL[type]}-Schritt`,
      type,
      content: DEFAULT_CONTENT[type],
      isRequired: true,
      estimatedMinutes: 5,
    };
    const newSteps = [...steps, newStep];
    onUpdate({ steps: newSteps });
    setSelectedId(newStep.id);
    setAddingStep(false);
  }

  function updateStep(stepId: string, patch: Partial<OnboardStep>) {
    onUpdate({
      steps: steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  }

  function removeStep(stepId: string) {
    const newSteps = steps
      .filter((s) => s.id !== stepId)
      .map((s, i) => ({ ...s, order: i + 1 }));
    onUpdate({ steps: newSteps });
    if (selectedId === stepId) {
      setSelectedId(newSteps[0]?.id ?? null);
    }
  }

  // Native HTML5 drag-and-drop reorder
  function handleDragStart(idx: number) {
    setDraggedIdx(idx);
  }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }
  function handleDrop(targetIdx: number) {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }
    const next = [...steps];
    const [moved] = next.splice(draggedIdx, 1);
    next.splice(targetIdx, 0, moved);
    onUpdate({ steps: next.map((s, i) => ({ ...s, order: i + 1 })) });
    setDraggedIdx(null);
    setDragOverIdx(null);
  }
  function handleDragEnd() {
    setDraggedIdx(null);
    setDragOverIdx(null);
  }

  return (
    <div className="flex h-full" style={sans}>
      {/* ── Left sidebar ─────────────────────────────────────────────────── */}
      <div className="w-64 shrink-0 border-r border-white/10 flex flex-col bg-white/[0.02]">
        <div className="p-3 border-b border-white/10">
          <button
            onClick={() => { setAddingStep(true); setSelectedId(null); }}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{ backgroundColor: "rgba(30,122,107,0.2)", color: "var(--c-teal)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Schritt hinzufügen
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {steps.length === 0 && !addingStep && (
            <div className="py-10 text-center">
              <p className="text-xs text-white/25 leading-relaxed">
                Noch keine Schritte.<br />Klicke oben, um anzufangen.
              </p>
            </div>
          )}
          {steps.map((step, idx) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onClick={() => { setSelectedId(step.id); setAddingStep(false); }}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                selectedId === step.id
                  ? "bg-white/10 border border-white/15"
                  : dragOverIdx === idx && draggedIdx !== idx
                  ? "bg-white/8 border border-white/15 border-dashed"
                  : "hover:bg-white/5 border border-transparent"
              } ${draggedIdx === idx ? "opacity-40" : ""}`}
            >
              {/* grip */}
              <svg
                className="w-3 h-3 text-white/20 shrink-0 cursor-grab"
                fill="currentColor"
                viewBox="0 0 8 12"
              >
                <circle cx="2" cy="2" r="1"/><circle cx="6" cy="2" r="1"/>
                <circle cx="2" cy="6" r="1"/><circle cx="6" cy="6" r="1"/>
                <circle cx="2" cy="10" r="1"/><circle cx="6" cy="10" r="1"/>
              </svg>

              {/* type dot */}
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_DOT[step.type] }}
              />

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${selectedId === step.id ? "text-white" : "text-white/60"}`}>
                  {step.title || `Schritt ${step.order}`}
                </p>
                <p className="text-[10px] text-white/25">{TYPE_LABEL[step.type]}</p>
              </div>

              {step.isRequired && (
                <span className="shrink-0 text-[9px] text-[var(--c-accent)]/60">●</span>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                className="shrink-0 opacity-0 group-hover:opacity-100 text-white/30 hover:text-white/70 transition-all"
                title="Schritt entfernen"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right editor ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {addingStep ? (
          <StepTypeSelector
            onSelect={addStep}
            onCancel={() => setAddingStep(false)}
          />
        ) : selected ? (
          <StepEditorPanel
            key={selected.id}
            step={selected}
            onUpdate={(patch) => updateStep(selected.id, patch)}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl mb-3">👈</p>
              <p className="text-sm text-white/40">
                Schritt auswählen oder neu anlegen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step editor panel (right side) ───────────────────────────────────────────

interface StepEditorPanelProps {
  step: OnboardStep;
  onUpdate: (patch: Partial<OnboardStep>) => void;
}

function StepEditorPanel({ step, onUpdate }: StepEditorPanelProps) {
  return (
    <div className="space-y-5 max-w-xl">
      {/* Step meta */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={labelClass}>Titel dieses Schritts</label>
          <input
            type="text"
            value={step.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Titel eingeben…"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Geschätzte Dauer (Min.)</label>
          <input
            type="number"
            min={0}
            value={step.estimatedMinutes}
            onChange={(e) => onUpdate({ estimatedMinutes: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={step.isRequired}
                onChange={(e) => onUpdate({ isRequired: e.target.checked })}
              />
              <div
                className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
                style={{
                  borderColor: step.isRequired ? "var(--c-accent)" : "rgba(255,255,255,0.2)",
                  backgroundColor: step.isRequired ? "rgba(200,75,47,0.2)" : "transparent",
                }}
              >
                {step.isRequired && (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10">
                    <path d="M1.5 5l2.5 2.5 4.5-4" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-white/40">Pflichtschritt</span>
          </label>
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="text-xs font-medium text-white/50 mb-4 uppercase tracking-wider">
          Inhalt — {TYPE_LABEL[step.type]}
        </p>
        {step.type === "checklist" && (
          <ChecklistEditor
            content={step.content as ChecklistContent}
            onChange={(content) => onUpdate({ content })}
          />
        )}
        {step.type === "video" && (
          <VideoEmbedEditor
            content={step.content as VideoContent}
            onChange={(content) => onUpdate({ content })}
          />
        )}
        {step.type === "quiz" && (
          <QuizEditor
            content={step.content as QuizContent}
            onChange={(content) => onUpdate({ content })}
          />
        )}
        {step.type === "document" && (
          <DocumentEditor
            content={step.content as DocumentContent}
            onChange={(content) => onUpdate({ content })}
          />
        )}
      </div>
    </div>
  );
}
