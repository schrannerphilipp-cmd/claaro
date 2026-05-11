"use client";

import { OnboardStep, StepProgress, StepType } from "@/types/onboard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const TYPE_LABEL: Record<StepType, string> = {
  checklist: "Checkliste",
  video: "Video",
  quiz: "Quiz",
  document: "Dokument",
};

interface ProgressTrackerProps {
  steps: OnboardStep[];
  progress: StepProgress[];
}

export default function ProgressTracker({ steps, progress }: ProgressTrackerProps) {
  const total = steps.length;
  const done = progress.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - pct / 100);

  const completedIds = new Set(progress.map((p) => p.stepId));

  return (
    <div style={sans} className="space-y-5">
      {/* Circle */}
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none"/>
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="var(--c-teal)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.5s ease" }}
            />
            <text x="48" y="53" textAnchor="middle" fontSize="18" fontWeight="700" fill="white" fontFamily="var(--font-dm-sans)">
              {pct}%
            </text>
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {done} von {total} Schritten
          </p>
          <p className="text-xs text-white/40 mt-0.5">
            {pct === 100 ? "Abgeschlossen 🎉" : `Noch ${total - done} offen`}
          </p>
        </div>
      </div>

      {/* Step timeline */}
      <div className="space-y-1.5">
        {steps.map((step, i) => {
          const isDone = completedIds.has(step.id);
          const quizScore = progress.find((p) => p.stepId === step.id)?.quizScore;
          return (
            <div key={step.id} className="flex items-center gap-3">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDone
                      ? "border-[var(--c-teal)] bg-[var(--c-teal)]/20"
                      : "border-white/20 bg-white/5"
                  }`}
                >
                  {isDone && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10">
                      <path d="M1.5 5l2.5 2.5 4.5-4" stroke="var(--c-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-px h-4 ${isDone ? "bg-[var(--c-teal)]/30" : "bg-white/10"}`} />
                )}
              </div>
              <div className="flex-1 pb-2">
                <p className={`text-xs font-medium ${isDone ? "text-white/70" : "text-white/40"}`}>
                  {step.title || `Schritt ${step.order}`}
                </p>
                <p className="text-[10px] text-white/25 flex items-center gap-1">
                  {TYPE_LABEL[step.type]}
                  {quizScore !== undefined && ` · ${quizScore}% Punkte`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
