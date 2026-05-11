"use client";

import FeatureLayout from "../../_components/feature-layout";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useReviewSettings } from "@/hooks/useReviewSettings";
import TemplateEditor from "@/components/bewertung/TemplateEditor";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function VorlagenPage() {
  const { templates, isLoaded, createTemplate, updateTemplate, deleteTemplate } =
    useMessageTemplates();
  const { settings } = useReviewSettings();

  if (!isLoaded) return null;

  const requestTemplates = templates.filter((t) => t.type === "request");
  const responseTemplates = templates.filter((t) => t.type === "response");

  function handleCreate() {
    createTemplate({
      name: "Neue Vorlage",
      channel: "both",
      type: "request",
      body: "Hallo {kunde}, vielen Dank für Ihren Auftrag bei {betrieb}! {link}",
      variables: ["{kunde}", "{betrieb}", "{link}"],
      isDefault: false,
    });
  }

  return (
    <FeatureLayout
      name="Vorlagen"
      description="Erstellen und verwalten Sie Nachrichten-Vorlagen für Bewertungsanfragen und Antworten."
      backHref="/dashboard/bewertungen"
    >
      <div className="space-y-10" style={sans}>
        {/* Anfrage-Vorlagen */}
        <section>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
            Anfrage-Vorlagen
          </p>
          <div className="space-y-3">
            {requestTemplates.map((t) => (
              <TemplateEditor
                key={t.id}
                template={t}
                businessName={settings.businessName}
                onChange={(patch) => updateTemplate(t.id, patch)}
                onDelete={t.isDefault ? undefined : () => deleteTemplate(t.id)}
              />
            ))}
          </div>
        </section>

        {/* Antwort-Vorlagen */}
        <section>
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
            Antwort-Vorlagen
          </p>
          <div className="space-y-3">
            {responseTemplates.map((t) => (
              <TemplateEditor
                key={t.id}
                template={t}
                businessName={settings.businessName}
                onChange={(patch) => updateTemplate(t.id, patch)}
                onDelete={t.isDefault ? undefined : () => deleteTemplate(t.id)}
              />
            ))}
          </div>
        </section>

        {/* Add template */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
            <path
              d="M7 2v10M2 7h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Neue Vorlage erstellen
        </button>
      </div>
    </FeatureLayout>
  );
}
