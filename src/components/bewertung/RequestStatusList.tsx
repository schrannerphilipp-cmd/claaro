"use client";

import { ReviewRequest, ReviewPlatform } from "@/types/bewertung";
import ChannelBadge from "./ChannelBadge";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const STATUS_STYLE: Record<string, string> = {
  pending: "text-white/40 bg-white/5 border-white/10",
  sent: "text-[var(--c-amber)] bg-[var(--c-amber)]/10 border-[var(--c-amber)]/20",
  delivered: "text-[var(--c-teal)] bg-[var(--c-teal)]/10 border-[var(--c-teal)]/20",
  clicked: "text-[var(--c-teal)] bg-[var(--c-teal)]/15 border-[var(--c-teal)]/30",
  failed: "text-[var(--c-accent)] bg-[var(--c-accent)]/10 border-[var(--c-accent)]/20",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Ausstehend",
  sent: "Gesendet",
  delivered: "Zugestellt",
  clicked: "Geklickt ✓",
  failed: "Fehlgeschlagen",
};

interface RequestStatusListProps {
  requests: ReviewRequest[];
  platforms: ReviewPlatform[];
  onDelete: (id: string) => void;
}

export default function RequestStatusList({
  requests,
  platforms,
  onDelete,
}: RequestStatusListProps) {
  const sorted = [...requests].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="py-16 bg-white/5 border border-white/10 rounded-xl text-center" style={sans}>
        <p className="text-3xl mb-3">📨</p>
        <p className="text-sm font-medium text-white mb-1">Noch keine Anfragen gesendet</p>
        <p className="text-xs text-white/40">
          Nutze den „Jetzt anfragen"-Button, um die erste Bewertungsanfrage zu senden.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden" style={sans}>
      <div className="grid grid-cols-[1fr_auto_120px_110px_80px] gap-3 px-5 py-2.5 border-b border-white/10 text-xs text-white/30">
        <span>Kunde</span>
        <span>Kanal</span>
        <span>Plattform</span>
        <span>Status</span>
        <span />
      </div>
      {sorted.map((r, i) => {
        const platform = platforms.find((p) => p.id === r.platformId);
        return (
          <div
            key={r.id}
            className={`grid grid-cols-[1fr_auto_120px_110px_80px] gap-3 items-center px-5 py-3.5 ${
              i > 0 ? "border-t border-white/10" : ""
            }`}
          >
            <div>
              <p className="text-sm text-white">{r.customerName}</p>
              <p className="text-[10px] text-white/30">
                {new Date(r.sentAt).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <ChannelBadge channel={r.channel} showLabel />
            <p className="text-xs text-white/50 truncate">{platform?.name ?? "—"}</p>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}>
              {STATUS_LABEL[r.status]}
            </span>
            <div className="flex justify-end">
              <button
                onClick={() => onDelete(r.id)}
                className="text-white/20 hover:text-[var(--c-accent)] transition-colors"
                title="Löschen"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                  <path d="M2 3.5h10M5.5 3.5V2.5h3v1M4 3.5l.5 8h5l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
