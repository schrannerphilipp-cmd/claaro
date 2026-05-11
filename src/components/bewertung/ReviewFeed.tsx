"use client";

import { useState } from "react";
import { ReviewEntry, ReviewPlatform, MessageTemplate, EntryStatus } from "@/types/bewertung";
import ReviewCard from "./ReviewCard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const TABS: { key: EntryStatus | "all"; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "new", label: "Neu" },
  { key: "read", label: "Gelesen" },
  { key: "responded", label: "Beantwortet" },
];

interface ReviewFeedProps {
  entries: ReviewEntry[];
  platforms: ReviewPlatform[];
  responseTemplates: MessageTemplate[];
  onMarkRead: (id: string) => void;
  onRespond: (id: string, text: string, templateId?: string) => void;
  onDelete: (id: string) => void;
}

export default function ReviewFeed({
  entries,
  platforms,
  responseTemplates,
  onMarkRead,
  onRespond,
  onDelete,
}: ReviewFeedProps) {
  const [activeTab, setActiveTab] = useState<EntryStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const filtered = entries
    .filter((e) => activeTab === "all" || e.status === activeTab)
    .filter((e) => platformFilter === "all" || e.platformId === platformFilter)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const newCount = entries.filter((e) => e.status === "new").length;

  return (
    <div style={sans}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                activeTab === key
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {label}
              {key === "new" && newCount > 0 && (
                <span className="ml-1.5 text-[9px] bg-[var(--c-amber)] text-[#1a1814] rounded-full w-4 h-4 inline-flex items-center justify-center font-bold">
                  {newCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {platforms.length > 1 && (
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/50 focus:outline-none"
          >
            <option value="all">Alle Plattformen</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <p className="text-xs text-white/30 ml-auto">
          {filtered.length} Bewertung{filtered.length !== 1 ? "en" : ""}
        </p>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div className="py-16 bg-white/5 border border-white/10 rounded-xl text-center">
          <p className="text-3xl mb-3">⭐</p>
          <p className="text-sm font-medium text-white mb-1">Noch keine Bewertungen</p>
          <p className="text-xs text-white/40 leading-relaxed max-w-xs mx-auto">
            Sende Bewertungsanfragen an Kunden — hier erscheinen ihre Rückmeldungen.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => (
            <ReviewCard
              key={entry.id}
              entry={entry}
              platform={platforms.find((p) => p.id === entry.platformId)}
              responseTemplates={responseTemplates.filter((t) => t.type === "response")}
              onMarkRead={() => onMarkRead(entry.id)}
              onRespond={(text, tplId) => onRespond(entry.id, text, tplId)}
              onDelete={() => onDelete(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
