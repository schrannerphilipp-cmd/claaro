"use client";

import { DocumentContent } from "@/types/onboard";

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

interface DocumentEditorProps {
  content: DocumentContent;
  onChange: (content: DocumentContent) => void;
}

export default function DocumentEditor({ content, onChange }: DocumentEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Titel</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Arbeitsschutzbelehrung 2025"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Inhalt (Freitext)</label>
        <textarea
          value={content.richText ?? ""}
          onChange={(e) => onChange({ ...content, richText: e.target.value })}
          placeholder="Hier den Dokumenteninhalt einfügen — Formatierung mit Leerzeilen…"
          rows={10}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <div>
        <label className={labelClass}>Datei-URL (optional)</label>
        <input
          type="url"
          value={content.fileUrl ?? ""}
          onChange={(e) => onChange({ ...content, fileUrl: e.target.value })}
          placeholder="https://example.com/dokument.pdf"
          className={inputClass}
        />
        {content.fileUrl && (
          <a
            href={content.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--c-teal)] hover:underline"
          >
            Vorschau öffnen
            <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
              <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M7 1h4m0 0v4m0-4L5 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
