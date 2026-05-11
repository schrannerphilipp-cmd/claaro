"use client";

import { useState } from "react";
import { ReviewEntry, ReviewPlatform, MessageTemplate } from "@/types/bewertung";
import StarRating from "./StarRating";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none";

const STATUS_STYLE: Record<string, string> = {
  new: "text-[var(--c-amber)] bg-[var(--c-amber)]/10 border-[var(--c-amber)]/20",
  read: "text-white/40 bg-white/5 border-white/10",
  responded: "text-[var(--c-teal)] bg-[var(--c-teal)]/10 border-[var(--c-teal)]/20",
};
const STATUS_LABEL: Record<string, string> = {
  new: "Neu",
  read: "Gelesen",
  responded: "Beantwortet",
};

interface ReviewCardProps {
  entry: ReviewEntry;
  platform?: ReviewPlatform;
  responseTemplates: MessageTemplate[];
  onMarkRead: () => void;
  onRespond: (text: string, templateId?: string) => void;
  onDelete: () => void;
}

export default function ReviewCard({
  entry,
  platform,
  responseTemplates,
  onMarkRead,
  onRespond,
  onDelete,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(entry.status === "new");
  const [responseText, setResponseText] = useState(entry.responseText ?? "");
  const [selectedTplId, setSelectedTplId] = useState(entry.responseTemplateId ?? "");
  const [submitting, setSubmitting] = useState(false);

  function handleExpand() {
    setExpanded((v) => !v);
    if (entry.status === "new") onMarkRead();
  }

  function applyTemplate(id: string) {
    const tpl = responseTemplates.find((t) => t.id === id);
    if (tpl) {
      setResponseText(tpl.body.replace("{kunde}", entry.customerName));
      setSelectedTplId(id);
    }
  }

  async function handleRespond() {
    if (!responseText.trim()) return;
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 300));
    onRespond(responseText.trim(), selectedTplId || undefined);
    setSubmitting(false);
  }

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-colors ${
        entry.status === "new" ? "border-[var(--c-amber)]/20" : "border-white/10"
      }`}
      style={sans}
    >
      {/* Header row */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <StarRating rating={entry.rating} size="sm" />
          <p className="text-sm font-medium text-white truncate">{entry.customerName}</p>
          {platform && (
            <span className="text-[10px] text-white/30 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 shrink-0">
              {platform.name}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLE[entry.status]}`}>
          {STATUS_LABEL[entry.status]}
        </span>
        <p className="text-xs text-white/30 shrink-0">
          {new Date(entry.publishedAt).toLocaleDateString("de-DE")}
        </p>
        <svg
          className={`w-4 h-4 text-white/30 shrink-0 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
          {entry.text && (
            <p className="text-sm text-white/70 leading-relaxed">{entry.text}</p>
          )}

          {entry.status === "responded" && entry.responseText ? (
            <div className="bg-[var(--c-teal)]/5 border border-[var(--c-teal)]/15 rounded-xl p-3">
              <p className="text-xs text-[var(--c-teal)] mb-1">
                Ihre Antwort · {entry.respondedAt ? new Date(entry.respondedAt).toLocaleDateString("de-DE") : ""}
              </p>
              <p className="text-sm text-white/70">{entry.responseText}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">Antwort verfassen</p>
                {responseTemplates.length > 0 && (
                  <select
                    value={selectedTplId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/50 focus:outline-none"
                  >
                    <option value="">Vorlage wählen…</option>
                    {responseTemplates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <textarea
                rows={3}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Antwort eingeben…"
                className={inputClass}
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={onDelete}
                  className="text-xs text-white/20 hover:text-[var(--c-accent)] transition-colors"
                >
                  Löschen
                </button>
                <button
                  onClick={handleRespond}
                  disabled={submitting || !responseText.trim()}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={
                    !submitting && responseText.trim()
                      ? { backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }
                      : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
                  }
                >
                  {submitting ? "Wird gespeichert…" : "Antwort speichern"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
