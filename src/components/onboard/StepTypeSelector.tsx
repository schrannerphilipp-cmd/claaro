"use client";

import { StepType } from "@/types/onboard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const TYPES: { type: StepType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    type: "checklist",
    label: "Checkliste",
    desc: "Aufgaben abhaken",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
        <path d="M9 11l3 3L22 4" stroke="var(--c-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    type: "video",
    label: "Video",
    desc: "Lernen durch Zuschauen",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
        <rect x="2" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M17 9l5-3v12l-5-3V9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    type: "quiz",
    label: "Quiz",
    desc: "Wissen überprüfen",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="var(--c-amber)" strokeWidth="1.5"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="var(--c-amber)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="12" cy="17" r="0.5" fill="var(--c-amber)" stroke="var(--c-amber)" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    type: "document",
    label: "Dokument",
    desc: "Lesen & informieren",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="var(--c-accent)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

interface StepTypeSelectorProps {
  onSelect: (type: StepType) => void;
  onCancel: () => void;
}

export default function StepTypeSelector({ onSelect, onCancel }: StepTypeSelectorProps) {
  return (
    <div style={sans}>
      <div className="mb-5">
        <p className="text-sm font-medium text-white mb-1">Schritt-Typ auswählen</p>
        <p className="text-xs text-white/40">Was soll der Mitarbeiter in diesem Schritt tun?</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TYPES.map(({ type, label, desc, icon }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div className="text-white/60 group-hover:text-white/80 transition-colors mb-3">
              {icon}
            </div>
            <p className="text-sm font-medium text-white mb-0.5">{label}</p>
            <p className="text-xs text-white/40">{desc}</p>
          </button>
        ))}
      </div>
      <button
        onClick={onCancel}
        className="mt-4 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        Abbrechen
      </button>
    </div>
  );
}
