"use client";

import { useState } from "react";
import Link from "next/link";
import FeatureLayout from "../_components/feature-layout";
import { useReviewEntries } from "@/hooks/useReviewEntries";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { useReviewSettings } from "@/hooks/useReviewSettings";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";
import { useAutoReviewTrigger } from "@/hooks/useAutoReviewTrigger";
import RatingChart from "@/components/bewertung/RatingChart";
import ReviewFeed from "@/components/bewertung/ReviewFeed";
import ManualSendModal from "@/components/bewertung/ManualSendModal";
import { Channel } from "@/types/bewertung";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function KpiTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-xs text-white/40 mb-2">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[10px] text-white/30 mt-1">{sub}</p>}
    </div>
  );
}

export default function BewertungenPage() {
  const { entries, markRead, respond, deleteEntry } = useReviewEntries();
  const { requests, addRequest, deleteRequest } = useReviewRequests();
  const { settings } = useReviewSettings();
  const { templates } = useMessageTemplates();
  const { pendingToasts, cancelTrigger } = useAutoReviewTrigger();
  const [showSendModal, setShowSendModal] = useState(false);

  // KPI calculations
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.publishedAt).getTime() >= cutoff30);
  const avgRating =
    recent.length > 0
      ? (recent.reduce((s, e) => s + e.rating, 0) / recent.length).toFixed(1)
      : "—";
  const clickRate =
    requests.length > 0
      ? Math.round(
          (requests.filter((r) => r.status === "clicked").length / requests.length) * 100
        )
      : 0;
  const newCount = entries.filter((e) => e.status === "new").length;

  const defaultPlatform =
    settings.platforms.find((p) => p.isDefault && p.isActive && p.url) ??
    settings.platforms.find((p) => p.isActive && p.url);
  const defaultTemplate =
    templates.find((t) => t.id === settings.defaultRequestTemplateId && t.type === "request") ??
    templates.find((t) => t.type === "request");
  const responseTemplates = templates.filter((t) => t.type === "response");

  async function handleSend(data: {
    customerName: string;
    phone: string;
    channel: Channel;
    platformId: string;
    templateId: string;
    templateBody: string;
    platformUrl: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch("/api/bewertung/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: data.phone,
          channel: data.channel,
          templateBody: data.templateBody,
          platformId: data.platformId,
          platformUrl: data.platformUrl,
          customerId: genId(),
          customerName: data.customerName,
          templateId: data.templateId,
          triggerType: "manual",
        }),
      });
      const json = (await res.json()) as {
        success: boolean;
        requestId?: string;
        token?: string;
        error?: string;
      };
      if (json.success && json.token) {
        addRequest({
          customerId: genId(),
          customerName: data.customerName,
          customerPhone: data.phone,
          channel: data.channel,
          templateId: data.templateId,
          sentAt: new Date().toISOString(),
          status: "sent",
          triggerType: "manual",
          platformId: data.platformId,
          trackingToken: json.token,
        });
        return { success: true };
      }
      return { success: false, error: json.error ?? "Fehler beim Senden" };
    } catch {
      return { success: false, error: "Netzwerkfehler" };
    }
  }

  return (
    <FeatureLayout
      name="Bewertungen"
      description="Sammeln Sie nach Auftragsabschluss gezielt Kundenfeedback und verwalten Sie Ihr digitales Ansehen an einem Ort."
    >
      {/* Sub-nav links */}
      <div className="flex items-center gap-2 mb-8 flex-wrap" style={sans}>
        {[
          {
            href: "/dashboard/bewertungen/anfragen",
            label: "Anfragen",
            badge: requests.length > 0 ? String(requests.length) : undefined,
          },
          { href: "/dashboard/bewertungen/vorlagen", label: "Vorlagen", badge: undefined },
          { href: "/dashboard/bewertungen/einstellungen", label: "Einstellungen", badge: undefined },
        ].map(({ href, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors"
          >
            {label}
            {badge !== undefined && (
              <span className="text-[9px] bg-white/10 rounded-full px-1.5 py-0.5 font-medium">
                {badge}
              </span>
            )}
            <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 12 12">
              <path
                d="M4 2l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6" style={sans}>
        <KpiTile
          label="Ø Bewertung (30 Tage)"
          value={avgRating}
          sub={recent.length > 0 ? `${recent.length} Bewertungen` : "Noch keine Daten"}
        />
        <KpiTile
          label="Anfragen gesamt"
          value={String(requests.length)}
          sub="alle Zeiträume"
        />
        <KpiTile
          label="Klickrate"
          value={`${clickRate} %`}
          sub="Link-Klicks / Anfragen"
        />
        <KpiTile
          label="Neue Bewertungen"
          value={String(newCount)}
          sub={newCount === 0 ? "alle gelesen" : "unbeantwortet"}
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <RatingChart entries={entries} />
      </div>

      {/* Review feed */}
      <div className="mb-24" style={sans}>
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">
          Bewertungen
        </p>
        <ReviewFeed
          entries={entries}
          platforms={settings.platforms}
          responseTemplates={responseTemplates}
          onMarkRead={markRead}
          onRespond={respond}
          onDelete={deleteEntry}
        />
      </div>

      {/* Auto-send pending toasts */}
      {pendingToasts.length > 0 && (
        <div className="fixed bottom-24 right-6 z-40 space-y-2" style={sans}>
          {pendingToasts.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 bg-[#1a1814] border border-white/15 rounded-xl px-4 py-3 shadow-lg max-w-[260px]"
            >
              <span
                className="w-2 h-2 rounded-full bg-[var(--c-amber)] shrink-0"
                style={{ animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{t.customerName}</p>
                <p className="text-[10px] text-white/40">Anfrage in {t.delayMinutes} Min.</p>
              </div>
              <button
                onClick={() => cancelTrigger(t.id)}
                title="Abbrechen"
                className="text-white/30 hover:text-[var(--c-accent)] transition-colors shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                  <path
                    d="M3 3l8 8M11 3l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowSendModal(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-xl hover:opacity-90 transition-opacity"
        style={{ backgroundColor: "var(--c-teal)", color: "#fff" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        Jetzt anfragen
      </button>

      {showSendModal && (
        <ManualSendModal
          platforms={settings.platforms}
          templates={templates}
          defaultChannel={settings.defaultChannel}
          defaultPlatformId={defaultPlatform?.id ?? ""}
          defaultTemplateId={defaultTemplate?.id ?? ""}
          businessName={settings.businessName}
          onClose={() => setShowSendModal(false)}
          onSend={handleSend}
        />
      )}
    </FeatureLayout>
  );
}
