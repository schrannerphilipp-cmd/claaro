"use client";

import { useState } from "react";
import FeatureLayout from "../../_components/feature-layout";
import { useReviewSettings } from "@/hooks/useReviewSettings";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import PlatformConfigurator from "@/components/bewertung/PlatformConfigurator";
import { Channel, AutoSendTrigger } from "@/types/bewertung";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";
const cardClass = "bg-white/5 border border-white/10 rounded-xl p-5 space-y-4";

export default function EinstellungenPage() {
  const {
    settings,
    updateSettings,
    updatePlatform,
    addPlatform,
    removePlatform,
    setDefaultPlatform,
  } = useReviewSettings();
  const { templates } = useMessageTemplates();
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");

  const requestTemplates = templates.filter((t) => t.type === "request");

  async function sendTestMessage() {
    if (!settings.testPhone.trim() || testStatus === "sending") return;
    setTestStatus("sending");
    try {
      const res = await fetch("/api/bewertung/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: settings.testPhone.trim(),
          channel: settings.defaultChannel,
          templateBody: "Das ist eine Testnachricht von claaro. Alles funktioniert! ✅",
          platformId: "test",
          platformUrl: "https://example.com",
          customerId: "test-" + Date.now(),
          customerName: "Test",
          templateId: "test",
          triggerType: "manual",
        }),
      });
      const json = (await res.json()) as { success: boolean };
      setTestStatus(json.success ? "ok" : "error");
    } catch {
      setTestStatus("error");
    }
    setTimeout(() => setTestStatus("idle"), 3000);
  }

  return (
    <FeatureLayout
      name="Einstellungen"
      description="Plattformen konfigurieren, automatischen Versand einrichten und Twilio-Anbindung testen."
      backHref="/dashboard/bewertungen"
    >
      <div className="space-y-5" style={sans}>
        {/* Betrieb */}
        <div className={cardClass}>
          <p className="text-xs font-semibold text-white/60">Betrieb</p>
          <div>
            <label className={labelClass}>Betriebsname</label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => updateSettings({ businessName: e.target.value })}
              placeholder="Mein Betrieb GmbH"
              className={inputClass}
            />
            <p className="text-[10px] text-white/25 mt-1">
              Wird in Nachrichten als {"{betrieb}"} eingesetzt.
            </p>
          </div>
        </div>

        {/* Plattformen */}
        <div className={cardClass}>
          <p className="text-xs font-semibold text-white/60">Bewertungsplattformen</p>
          <PlatformConfigurator
            platforms={settings.platforms}
            onUpdate={updatePlatform}
            onAdd={addPlatform}
            onRemove={removePlatform}
            onSetDefault={setDefaultPlatform}
          />
        </div>

        {/* Auto-Versand */}
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/60">Automatischer Versand</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                Sendet Bewertungsanfragen automatisch nach Auftragsabschluss.
              </p>
            </div>
            <button
              onClick={() => updateSettings({ autoSendEnabled: !settings.autoSendEnabled })}
              className={`relative w-11 h-6 rounded-full border transition-colors shrink-0 ${
                settings.autoSendEnabled
                  ? "border-[var(--c-teal)]/40 bg-[var(--c-teal)]/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                  settings.autoSendEnabled
                    ? "left-[22px] bg-[var(--c-teal)]"
                    : "left-0.5 bg-white/30"
                }`}
              />
            </button>
          </div>

          {settings.autoSendEnabled && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className={labelClass}>Verzögerung (Minuten)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={settings.autoSendDelayMinutes}
                  onChange={(e) =>
                    updateSettings({
                      autoSendDelayMinutes: Math.max(1, parseInt(e.target.value) || 60),
                    })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Standard-Kanal</label>
                <select
                  value={settings.defaultChannel}
                  onChange={(e) =>
                    updateSettings({ defaultChannel: e.target.value as Channel })
                  }
                  className={`${inputClass} appearance-none`}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Auslöser</label>
                <select
                  value={settings.autoSendTrigger}
                  onChange={(e) =>
                    updateSettings({ autoSendTrigger: e.target.value as AutoSendTrigger })
                  }
                  className={`${inputClass} appearance-none`}
                >
                  <option value="transaction">Nach Transaktion</option>
                  <option value="appointment">Nach Termin</option>
                  <option value="both">Beides</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Standard-Vorlage</label>
                <select
                  value={settings.defaultRequestTemplateId}
                  onChange={(e) =>
                    updateSettings({ defaultRequestTemplateId: e.target.value })
                  }
                  className={`${inputClass} appearance-none`}
                >
                  <option value="">Automatisch wählen</option>
                  {requestTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Twilio-Test */}
        <div className={cardClass}>
          <p className="text-xs font-semibold text-white/60">Twilio-Anbindung testen</p>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className={labelClass}>Testtelefonnummer</label>
              <input
                type="tel"
                value={settings.testPhone}
                onChange={(e) => updateSettings({ testPhone: e.target.value })}
                placeholder="+49 151 12345678"
                className={inputClass}
              />
            </div>
            <button
              onClick={sendTestMessage}
              disabled={!settings.testPhone.trim() || testStatus === "sending"}
              className="px-4 py-2 text-sm rounded-lg border transition-colors shrink-0 mb-px"
              style={
                testStatus === "ok"
                  ? {
                      borderColor: "var(--c-teal)",
                      color: "var(--c-teal)",
                      backgroundColor: "rgba(30,122,107,0.1)",
                    }
                  : testStatus === "error"
                  ? {
                      borderColor: "var(--c-accent)",
                      color: "var(--c-accent)",
                      backgroundColor: "rgba(200,75,47,0.1)",
                    }
                  : settings.testPhone.trim() && testStatus !== "sending"
                  ? {
                      borderColor: "rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.7)",
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.2)",
                      cursor: "not-allowed",
                    }
              }
            >
              {testStatus === "sending"
                ? "Wird gesendet…"
                : testStatus === "ok"
                ? "Gesendet ✓"
                : testStatus === "error"
                ? "Fehler ✗"
                : "Testnachricht senden"}
            </button>
          </div>
          <p className="text-[10px] text-white/25">
            Sendet eine Testnachricht an die angegebene Nummer. Erfordert TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN und TWILIO_PHONE_NUMBER in .env.local.
          </p>
        </div>
      </div>
    </FeatureLayout>
  );
}
