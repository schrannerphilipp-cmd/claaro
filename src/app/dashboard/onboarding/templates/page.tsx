"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FeatureLayout from "../../_components/feature-layout";
import { useOnboardTemplates } from "@/hooks/useOnboardTemplates";
import { useOnboardAssignments } from "@/hooks/useOnboardAssignments";
import TemplateCard from "@/components/onboard/TemplateCard";
import AssignModal from "./AssignModal";
import { OnboardTemplate } from "@/types/onboard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, isLoaded, createTemplate, deleteTemplate } = useOnboardTemplates();
  const { assignments } = useOnboardAssignments();
  const [assignTarget, setAssignTarget] = useState<OnboardTemplate | null>(null);
  const [search, setSearch] = useState("");
  const [showVorlagen, setShowVorlagen] = useState(false);
  const vorlagenRef = useRef<HTMLDivElement>(null);

  const VORLAGEN = [
    "Neue Mitarbeiter — Erste Woche",
    "Neuer Kunde — Auftragsaufnahme",
    "Jahresabschluss Betrieb",
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (vorlagenRef.current && !vorlagenRef.current.contains(e.target as Node)) {
        setShowVorlagen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleCreateFromVorlage(title: string) {
    setShowVorlagen(false);
    const t = createTemplate(title);
    router.push(`/dashboard/onboarding/templates/${t.id}`);
  }

  const filtered = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.role.toLowerCase().includes(search.toLowerCase())
  );

  function countAssignments(templateId: string) {
    return assignments.filter((a) => a.templateId === templateId).length;
  }

  return (
    <FeatureLayout
      name="Template-Bibliothek"
      description="Verwalte deine Einarbeitungs-Templates und weise sie Mitarbeitern zu."
      backHref="/dashboard/onboarding"
    >
      <div className="space-y-5" style={sans}>
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
          />
          <Link
            href="/dashboard/onboarding/templates/new"
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium shrink-0 transition-colors"
            style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.25)", color: "var(--c-teal)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Neues Template
          </Link>

          <div className="relative shrink-0" ref={vorlagenRef}>
            <button
              onClick={() => setShowVorlagen((v) => !v)}
              className="c-btn flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                <path d="M2 4h10M2 7h7M2 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Aus Vorlage
            </button>

            {showVorlagen && (
              <div className="absolute right-0 top-10 z-40 w-64 bg-[#23211c] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {VORLAGEN.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleCreateFromVorlage(name)}
                    className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isLoaded ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="c-skeleton rounded-xl h-36" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 bg-white/5 border border-white/10 rounded-xl text-center">
            {templates.length === 0 ? (
              <>
                <p className="text-4xl mb-4">📋</p>
                <p className="text-sm font-medium text-white mb-1">Noch keine Templates</p>
                <p className="text-xs text-white/55 mb-5">
                  Erstelle dein erstes Einarbeitungs-Template.
                </p>
                <Link
                  href="/dashboard/onboarding/templates/new"
                  className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.25)", color: "var(--c-teal)" }}
                >
                  Ersten Schritt hinzufügen
                </Link>
              </>
            ) : (
              <p className="text-sm text-white/55">
                Keine Templates gefunden für „{search}".
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                assignmentCount={countAssignments(t.id)}
                onEdit={() => router.push(`/dashboard/onboarding/templates/${t.id}`)}
                onDelete={() => {
                  if (confirm(`Template „${t.title}" wirklich löschen?`)) {
                    deleteTemplate(t.id);
                  }
                }}
                onAssign={() => setAssignTarget(t)}
              />
            ))}
          </div>
        )}
      </div>

      {assignTarget && (
        <AssignModal
          template={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}
    </FeatureLayout>
  );
}
