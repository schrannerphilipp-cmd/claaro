"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOnboardAssignments } from "@/hooks/useOnboardAssignments";
import { useOnboardTemplates } from "@/hooks/useOnboardTemplates";
import { OnboardStep, ChecklistContent, VideoContent, QuizContent, DocumentContent } from "@/types/onboard";
import ProgressTracker from "@/components/onboard/ProgressTracker";
import QuizRunner from "@/components/onboard/QuizRunner";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const CONFETTI_COLORS = [
  "var(--c-teal)", "var(--c-accent)", "var(--c-amber)", "#a855f7", "#38bdf8",
  "#f472b6", "var(--c-warm)", "#4ade80",
];

export default function RunPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const router = useRouter();
  const { getAssignment, updateProgress, completeAssignment, isLoaded: aLoaded } = useOnboardAssignments();
  const { getTemplate, isLoaded: tLoaded } = useOnboardTemplates();

  const [stepIdx, setStepIdx] = useState(0);
  const [checklistDone, setChecklistDone] = useState<Set<string>>(new Set());
  const [docRead, setDocRead] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [done, setDone] = useState(false);

  const assignment = aLoaded ? getAssignment(assignmentId) : null;
  const template = assignment && tLoaded ? getTemplate(assignment.templateId) : null;

  useEffect(() => {
    if (!aLoaded || !tLoaded) return;
    if (!assignment || !template) {
      router.replace("/dashboard/onboarding");
    }
  }, [aLoaded, tLoaded, assignment, template, router]);

  if (!aLoaded || !tLoaded || !assignment || !template) {
    return (
      <div className="min-h-screen bg-[#1a1814] flex items-center justify-center" style={sans}>
        <p className="text-sm text-white/30">Lädt…</p>
      </div>
    );
  }

  const steps = template.steps;
  const step: OnboardStep | undefined = steps[stepIdx];
  const completedIds = new Set(assignment.progress.map((p) => p.stepId));
  const totalPct = steps.length > 0 ? Math.round((completedIds.size / steps.length) * 100) : 0;

  function isStepUnlockable(): boolean {
    if (!step) return false;
    if (!step.isRequired) return true;
    if (step.type === "checklist") {
      const content = step.content as ChecklistContent;
      const required = content.items.filter((i) => i.required).map((i) => i.id);
      return required.every((id) => checklistDone.has(id));
    }
    if (step.type === "quiz") return quizScore !== null;
    if (step.type === "document") return docRead;
    if (step.type === "video") return videoWatched;
    return true;
  }

  function handleComplete() {
    if (!step) return;
    const score = step.type === "quiz" ? quizScore ?? 0 : undefined;
    updateProgress(assignmentId, step.id, score);
    setChecklistDone(new Set());
    setDocRead(false);
    setVideoWatched(false);
    setQuizScore(null);

    if (stepIdx + 1 >= steps.length) {
      completeAssignment(assignmentId);
      setDone(true);
    } else {
      setStepIdx((i) => i + 1);
    }
  }

  // ── Completion screen ───────────────────────────────────────────────────────
  if (done) {
    const scores = assignment.progress
      .map((p) => p.quizScore)
      .filter((s): s is number => s !== undefined);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const confetti = Array.from({ length: 30 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${Math.random() * 1.5}s`,
      duration: `${1.5 + Math.random() * 2}s`,
      size: `${6 + Math.random() * 8}px`,
    }));

    return (
      <div className="min-h-screen bg-[#1a1814] flex items-center justify-center px-6 relative overflow-hidden" style={sans}>
        <style>{`
          @keyframes claaro-confetti-fall {
            0%   { transform: translateY(-40px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
        `}</style>
        {confetti.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-sm pointer-events-none"
            style={{
              left: p.left,
              top: "-20px",
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animation: `claaro-confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
            }}
          />
        ))}

        <div className="relative z-10 max-w-md w-full text-center bg-white/5 border border-white/10 rounded-2xl p-10">
          <p className="text-5xl mb-5">🎉</p>
          <h1 className="text-3xl text-white mb-2" style={serif}>Geschafft!</h1>
          <p className="text-white/60 mb-1">{assignment.employeeName} hat die Einarbeitung</p>
          <p className="text-white font-medium mb-6">„{template.title}"</p>

          {avgScore !== null && (
            <div className="mb-6 px-5 py-3 bg-[var(--c-teal)]/10 border border-[var(--c-teal)]/20 rounded-xl">
              <p className="text-xs text-white/40 mb-1">Quiz-Ergebnis (Ø)</p>
              <p className="text-2xl font-bold" style={{ color: "var(--c-teal)" }}>
                {avgScore}%
              </p>
            </div>
          )}

          <div className="space-y-2 text-left mb-6">
            <ProgressTracker steps={steps} progress={assignment.progress} />
          </div>

          <button
            onClick={() => router.push("/dashboard/onboarding")}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ backgroundColor: "rgba(30,122,107,0.3)", color: "var(--c-teal)" }}
          >
            Zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  // ── Run screen ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#1a1814] flex flex-col" style={sans}>
      <style>{`
        @keyframes claaro-page-fade { from { opacity: 0; } to { opacity: 1; } }
        .step-appear { animation: claaro-page-fade 300ms ease-out both; }
      `}</style>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#1a1814] border-b border-white/10">
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/onboarding")}
            className="text-sm text-white/40 hover:text-white transition-colors shrink-0"
          >
            ✕
          </button>
          <div className="flex-1">
            <p className="text-xs text-white/40 mb-1 truncate">{template.title}</p>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${totalPct}%`, backgroundColor: "var(--c-teal)" }}
              />
            </div>
          </div>
          <p className="text-xs text-white/40 shrink-0">{totalPct}%</p>
          <button
            onClick={() => setShowSidebar((v) => !v)}
            className="text-white/40 hover:text-white transition-colors shrink-0"
            title="Fortschritt"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 8V5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-2xl mx-auto w-full px-5 py-8 gap-6">
        {/* ── Main step content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {step ? (
            <div key={stepIdx} className="step-appear space-y-5">
              {/* Step header */}
              <div>
                <p className="text-xs text-white/30 mb-1">
                  Schritt {stepIdx + 1} von {steps.length}
                  {step.isRequired && <span className="ml-2 text-[var(--c-accent)]/60">Pflicht</span>}
                </p>
                <h1 className="text-xl text-white font-medium">{step.title}</h1>
              </div>

              {/* Step content */}
              {step.type === "checklist" && (
                <ChecklistStep
                  content={step.content as ChecklistContent}
                  done={checklistDone}
                  onChange={setChecklistDone}
                />
              )}
              {step.type === "video" && (
                <VideoStep
                  content={step.content as VideoContent}
                  onWatched={() => setVideoWatched(true)}
                />
              )}
              {step.type === "quiz" && (
                <QuizRunner
                  content={step.content as QuizContent}
                  onComplete={(score) => setQuizScore(score)}
                />
              )}
              {step.type === "document" && (
                <DocumentStep
                  content={step.content as DocumentContent}
                  onRead={() => setDocRead(true)}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-2">
                {stepIdx > 0 && (
                  <button
                    onClick={() => { setStepIdx((i) => i - 1); setChecklistDone(new Set()); setDocRead(false); setVideoWatched(false); setQuizScore(null); }}
                    className="px-4 py-2.5 rounded-xl text-sm border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    ← Zurück
                  </button>
                )}
                <button
                  onClick={handleComplete}
                  disabled={!isStepUnlockable()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={
                    isStepUnlockable()
                      ? { backgroundColor: "rgba(30,122,107,0.3)", color: "var(--c-teal)" }
                      : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.2)", cursor: "not-allowed" }
                  }
                >
                  {completedIds.has(step.id)
                    ? "Weiter →"
                    : stepIdx + 1 >= steps.length
                    ? "Einarbeitung abschließen 🎉"
                    : "Schritt abschließen & weiter →"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-white/30 text-sm">Kein Schritt gefunden.</p>
          )}
        </div>

        {/* ── Sidebar (progress) ────────────────────────────────────────── */}
        {showSidebar && (
          <div className="w-56 shrink-0 hidden md:block">
            <ProgressTracker steps={steps} progress={assignment.progress} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-step components ───────────────────────────────────────────────────────

function ChecklistStep({
  content,
  done,
  onChange,
}: {
  content: ChecklistContent;
  done: Set<string>;
  onChange: (s: Set<string>) => void;
}) {
  function toggle(id: string) {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {content.items.map((item) => (
        <label
          key={item.id}
          className="flex items-start gap-3 cursor-pointer group bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-colors"
        >
          <div
            className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors"
            style={{
              borderColor: done.has(item.id) ? "var(--c-teal)" : "rgba(255,255,255,0.2)",
              backgroundColor: done.has(item.id) ? "rgba(30,122,107,0.2)" : "transparent",
            }}
          >
            {done.has(item.id) && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                <path d="M2 6l3 3 5-5" stroke="var(--c-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <input type="checkbox" className="sr-only" checked={done.has(item.id)} onChange={() => toggle(item.id)} />
          <div className="flex-1">
            <p className={`text-sm transition-colors ${done.has(item.id) ? "text-white/40 line-through" : "text-white"}`}>
              {item.label}
            </p>
            {item.required && <p className="text-[10px] text-[var(--c-accent)]/60 mt-0.5">Pflichtaufgabe</p>}
          </div>
        </label>
      ))}
    </div>
  );
}

function VideoStep({
  content,
  onWatched,
}: {
  content: VideoContent;
  onWatched: () => void;
}) {
  function getEmbedUrl(url: string): string | null {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  }

  const embedUrl = content.url ? getEmbedUrl(content.url) : null;

  return (
    <div className="space-y-4">
      {embedUrl ? (
        <div className="rounded-xl overflow-hidden border border-white/10 aspect-video">
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen title={content.title} />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 aspect-video flex items-center justify-center">
          <p className="text-white/30 text-sm">Kein Video hinterlegt.</p>
        </div>
      )}
      {content.description && (
        <p className="text-sm text-white/60 leading-relaxed">{content.description}</p>
      )}
      <button
        onClick={onWatched}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Video angesehen ✓
      </button>
    </div>
  );
}

function DocumentStep({
  content,
  onRead,
}: {
  content: DocumentContent;
  onRead: () => void;
}) {
  return (
    <div className="space-y-4">
      {content.richText && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-white/70 leading-relaxed whitespace-pre-wrap">
          {content.richText}
        </div>
      )}
      {content.fileUrl && (
        <a
          href={content.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[var(--c-teal)] hover:underline"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Dokument öffnen
        </a>
      )}
      <button
        onClick={onRead}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
          <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Gelesen ✓
      </button>
    </div>
  );
}
