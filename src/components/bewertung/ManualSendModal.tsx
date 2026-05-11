"use client";

import { useState } from "react";
import { ReviewPlatform, MessageTemplate, Channel } from "@/types/bewertung";
import ChannelBadge from "./ChannelBadge";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

interface ManualSendModalProps {
  platforms: ReviewPlatform[];
  templates: MessageTemplate[];
  defaultChannel: Channel;
  defaultPlatformId: string;
  defaultTemplateId: string;
  businessName: string;
  onClose: () => void;
  onSend: (data: {
    customerName: string;
    phone: string;
    channel: Channel;
    platformId: string;
    templateId: string;
    templateBody: string;
    platformUrl: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

function buildPreview(body: string, customerName: string, businessName: string): string {
  return body
    .replaceAll("{kunde}", customerName || "Kunde")
    .replaceAll("{betrieb}", businessName || "Betrieb")
    .replaceAll("{link}", "https://g.page/…");
}

export default function ManualSendModal({
  platforms,
  templates,
  defaultChannel,
  defaultPlatformId,
  defaultTemplateId,
  businessName,
  onClose,
  onSend,
}: ManualSendModalProps) {
  const activePlatforms = platforms.filter((p) => p.isActive && p.url);
  const requestTemplates = templates.filter((t) => t.type === "request");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [platformId, setPlatformId] = useState(
    defaultPlatformId || activePlatforms[0]?.id || ""
  );
  const [templateId, setTemplateId] = useState(
    defaultTemplateId || requestTemplates[0]?.id || ""
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedTemplate = requestTemplates.find((t) => t.id === templateId);
  const selectedPlatform = activePlatforms.find((p) => p.id === platformId);
  const preview = selectedTemplate
    ? buildPreview(selectedTemplate.body, name, businessName)
    : "";

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Bitte Kundennamen eingeben."); return; }
    if (!phone.trim()) { setError("Bitte Telefonnummer eingeben."); return; }
    if (!platformId || !selectedPlatform) { setError("Bitte eine Plattform auswählen."); return; }
    if (!templateId || !selectedTemplate) { setError("Bitte eine Vorlage auswählen."); return; }

    setSending(true);
    const result = await onSend({
      customerName: name.trim(),
      phone: phone.trim(),
      channel,
      platformId,
      templateId,
      templateBody: selectedTemplate.body,
      platformUrl: selectedPlatform.url,
    });
    setSending(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(onClose, 1500);
    } else {
      setError(result.error ?? "Ein Fehler ist aufgetreten.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg bg-[#1a1814] border border-white/15 rounded-2xl overflow-hidden shadow-2xl"
        style={sans}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <p className="text-sm font-semibold text-white">Bewertungsanfrage senden</p>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-sm font-medium text-white">Anfrage gesendet!</p>
            <p className="text-xs text-white/40 mt-1">
              {name} wird benachrichtigt.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kundenname</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Telefonnummer</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+49 151 12345678"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Channel selector */}
            <div>
              <label className={labelClass}>Kanal</label>
              <div className="flex gap-2">
                {(["whatsapp", "sms"] as Channel[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      channel === c
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/40 hover:text-white/70"
                    }`}
                  >
                    <ChannelBadge channel={c} />
                    {c === "whatsapp" ? "WhatsApp" : "SMS"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bewertungsplattform</label>
                <select
                  value={platformId}
                  onChange={(e) => setPlatformId(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Plattform wählen…</option>
                  {activePlatforms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Nachrichtenvorlage</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Vorlage wählen…</option>
                  {requestTemplates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live preview */}
            {preview && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">Vorschau</p>
                <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{preview}</p>
              </div>
            )}

            {activePlatforms.length === 0 && (
              <p className="text-xs text-[var(--c-accent)] bg-[var(--c-accent)]/10 px-3 py-2 rounded-lg">
                Keine aktiven Plattformen konfiguriert. Bitte zuerst eine Plattform mit URL einrichten.
              </p>
            )}

            {error && (
              <p className="text-xs text-[var(--c-accent)] bg-[var(--c-accent)]/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-sm text-white/50 border border-white/10 hover:bg-white/5 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={sending || activePlatforms.length === 0}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={
                  !sending && activePlatforms.length > 0
                    ? { backgroundColor: "rgba(30,122,107,0.3)", color: "var(--c-teal)" }
                    : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
                }
              >
                {sending ? "Wird gesendet…" : "Anfrage senden"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
