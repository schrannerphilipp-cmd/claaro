"use client";

import { OnboardTemplate, StepType } from "@/types/onboard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const TYPE_ICON: Record<StepType, React.ReactNode> = {
  checklist: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
      <path d="M2 6l3 3 5-5" stroke="var(--c-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  video: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
      <path d="M2 3h7v6H2zM9 5l3-2v6l-3-2V5z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
    </svg>
  ),
  quiz: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
      <circle cx="6" cy="6" r="5" stroke="var(--c-amber)" strokeWidth="1"/>
      <path d="M4.5 4.5a1.5 1.5 0 012.83.7c0 1-1.33 1.5-1.33 1.5" stroke="var(--c-amber)" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="6" cy="8.5" r="0.4" fill="var(--c-amber)"/>
    </svg>
  ),
  document: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
      <path d="M2 1h6l2 2v8H2V1zM8 1v2h2M4 5h4M4 7h4M4 9h2" stroke="var(--c-accent)" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
};

const TYPE_LABEL: Record<StepType, string> = {
  checklist: "Checkliste",
  video: "Video",
  quiz: "Quiz",
  document: "Dokument",
};

interface TemplateCardProps {
  template: OnboardTemplate;
  assignmentCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
}

export default function TemplateCard({
  template,
  assignmentCount,
  onEdit,
  onDelete,
  onAssign,
}: TemplateCardProps) {
  const stepTypeCounts = template.steps.reduce<Partial<Record<StepType, number>>>(
    (acc, s) => ({ ...acc, [s.type]: (acc[s.type] ?? 0) + 1 }),
    {}
  );

  return (
    <div
      className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col gap-4 hover:border-white/20 transition-colors"
      style={sans}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{template.title}</p>
          {template.role && (
            <p className="mt-0.5 text-xs text-white/40 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 inline-block">
              {template.role}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            template.isPublished
              ? "border-[var(--c-teal)]/30 text-[var(--c-teal)] bg-[var(--c-teal)]/10"
              : "border-white/10 text-white/30 bg-white/5"
          }`}
        >
          {template.isPublished ? "Veröffentlicht" : "Entwurf"}
        </span>
      </div>

      {/* Description */}
      {template.description && (
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Step type pills */}
      {Object.keys(stepTypeCounts).length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(stepTypeCounts) as [StepType, number][]).map(([type, count]) => (
            <span
              key={type}
              className="flex items-center gap-1 text-[10px] text-white/40 bg-white/5 border border-white/10 rounded-full px-2 py-0.5"
            >
              {TYPE_ICON[type]}
              {count}× {TYPE_LABEL[type]}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/20">Keine Schritte</p>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-white/30">
        <span>{template.steps.length} Schritte</span>
        <span>·</span>
        <span>
          {template.estimatedMinutes > 0
            ? `ca. ${template.estimatedMinutes} Min.`
            : "Dauer unbekannt"}
        </span>
        {assignmentCount > 0 && (
          <>
            <span>·</span>
            <span>{assignmentCount}× zugewiesen</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/10">
        <button
          onClick={onEdit}
          className="flex-1 text-xs py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Bearbeiten
        </button>
        <button
          onClick={onAssign}
          className="flex-1 text-xs py-1.5 rounded-lg border transition-colors"
          style={{ backgroundColor: "rgba(30,122,107,0.15)", borderColor: "rgba(30,122,107,0.3)", color: "var(--c-teal)" }}
        >
          Zuweisen
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-white/20 hover:text-[var(--c-accent)] hover:bg-[var(--c-accent)]/10 transition-colors"
          title="Löschen"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
            <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
