"use client";

import { useState } from "react";
import { MessageTemplate, Channel, TemplateType } from "@/types/bewertung";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

const VARIABLES = ["{kunde}", "{betrieb}", "{link}"];

interface TemplateEditorProps {
  template: MessageTemplate;
  businessName: string;
  onChange: (patch: Partial<Omit<MessageTemplate, "id">>) => void;
  onDelete?: () => void;
}

export default function TemplateEditor({
  template,
  businessName,
  onChange,
  onDelete,
}: TemplateEditorProps) {
  const [textareaEl, setTextareaEl] = useState<HTMLTextAreaElement | null>(null);

  function insertVariable(v: string) {
    if (!textareaEl) {
      onChange({ body: template.body + v });
      return;
    }
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    const next =
      template.body.substring(0, start) + v + template.body.substring(end);
    onChange({ body: next });
    setTimeout(() => {
      textareaEl.focus();
      textareaEl.setSelectionRange(start + v.length, start + v.length);
    }, 0);
  }

  const preview = template.body
    .replaceAll("{kunde}", "Max Mustermann")
    .replaceAll("{betrieb}", businessName || "Ihr Betrieb")
    .replaceAll("{link}", "https://g.page/…");

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4" style={sans}>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={template.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Vorlage benennen…"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Kanal</label>
          <select
            value={template.channel}
            onChange={(e) => onChange({ channel: e.target.value as Channel | "both" })}
            className={`${inputClass} appearance-none`}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="both">Beide</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Typ</label>
          <select
            value={template.type}
            onChange={(e) => onChange({ type: e.target.value as TemplateType })}
            className={`${inputClass} appearance-none`}
          >
            <option value="request">Anfrage</option>
            <option value="response">Antwort</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelClass}>Nachrichtentext</label>
          <div className="flex items-center gap-1">
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/15 text-white/50 hover:text-white/80 hover:border-white/30 transition-colors"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <textarea
          ref={setTextareaEl}
          rows={4}
          value={template.body}
          onChange={(e) => onChange({ body: e.target.value })}
          placeholder="Nachrichtentext mit {kunde}, {betrieb}, {link} Variablen…"
          className={`${inputClass} resize-none leading-relaxed`}
        />
        <p className="mt-1 text-[10px] text-white/25">{template.body.length} Zeichen</p>
      </div>

      {/* Live preview */}
      <div className="bg-[#1a1814] border border-white/10 rounded-xl p-3">
        <p className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">Vorschau</p>
        <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{preview}</p>
      </div>

      {onDelete && !template.isDefault && (
        <div className="flex justify-end">
          <button
            onClick={onDelete}
            className="text-xs text-white/20 hover:text-[var(--c-accent)] transition-colors"
          >
            Vorlage löschen
          </button>
        </div>
      )}
    </div>
  );
}
