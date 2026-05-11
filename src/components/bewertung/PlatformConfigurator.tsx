"use client";

import { useState } from "react";
import { ReviewPlatform, PlatformType } from "@/types/bewertung";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";

const PLATFORM_ICONS: Record<PlatformType, React.ReactNode> = {
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
      <path d="M22 12.24c0-.75-.07-1.47-.19-2.17H12v4.1h5.62a4.8 4.8 0 01-2.08 3.15v2.62h3.37C20.83 18.01 22 15.3 22 12.24z" fill="#4285F4"/>
      <path d="M12 23c2.82 0 5.19-.94 6.91-2.54l-3.37-2.62a6.9 6.9 0 01-3.54.97 6.9 6.9 0 01-6.48-4.74H2.04v2.7A10.99 10.99 0 0012 23z" fill="#34A853"/>
      <path d="M5.52 14.07A6.9 6.9 0 015.16 12c0-.72.12-1.42.36-2.07V7.23H2.04A10.99 10.99 0 001 12c0 1.77.42 3.44 1.04 4.77l3.48-2.7z" fill="#FBBC05"/>
      <path d="M12 5.1a5.93 5.93 0 014.2 1.64l3.16-3.16A10.54 10.54 0 0012 1 10.99 10.99 0 002.04 7.23l3.48 2.7A6.9 6.9 0 0112 5.1z" fill="#EA4335"/>
    </svg>
  ),
  yelp: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#d32323">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-.5 14.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1-4.5h-1l-.5-5h2l-.5 5z"/>
    </svg>
  ),
  trustpilot: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#00b67a">
      <path d="M12 2l2.5 7.5H22l-6.5 4.5 2.5 7.5L12 17l-6 4.5 2.5-7.5L2 9.5h7.5z"/>
    </svg>
  ),
  custom: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
      <path d="M12 8v4l3 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface PlatformConfiguratorProps {
  platforms: ReviewPlatform[];
  onUpdate: (id: string, patch: Partial<ReviewPlatform>) => void;
  onAdd: (platform: ReviewPlatform) => void;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export default function PlatformConfigurator({
  platforms,
  onUpdate,
  onAdd,
  onRemove,
  onSetDefault,
}: PlatformConfiguratorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function handleAdd() {
    if (!newName.trim() || !newUrl.trim()) return;
    onAdd({
      id: genId(),
      name: newName.trim(),
      url: newUrl.trim(),
      isActive: true,
      type: "custom",
    });
    setNewName("");
    setNewUrl("");
    setShowAdd(false);
  }

  return (
    <div style={sans} className="space-y-3">
      {platforms.map((p) => (
        <div
          key={p.id}
          className={`border rounded-xl p-4 transition-colors ${
            p.isDefault && p.isActive
              ? "border-[var(--c-teal)]/30 bg-[var(--c-teal)]/5"
              : "border-white/10 bg-white/5"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="shrink-0">{PLATFORM_ICONS[p.type]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{p.name}</p>
                {p.isDefault && p.isActive && (
                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full border border-[var(--c-teal)]/30 text-[var(--c-teal)]">
                    Standard
                  </span>
                )}
              </div>
            </div>
            {/* Active toggle */}
            <button
              onClick={() => onUpdate(p.id, { isActive: !p.isActive })}
              className={`relative w-9 h-5 rounded-full border transition-colors shrink-0 ${
                p.isActive
                  ? "border-[var(--c-teal)]/40 bg-[var(--c-teal)]/20"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                  p.isActive
                    ? "left-4 bg-[var(--c-teal)]"
                    : "left-0.5 bg-white/30"
                }`}
              />
            </button>
          </div>
          <input
            type="url"
            value={p.url}
            onChange={(e) => onUpdate(p.id, { url: e.target.value })}
            placeholder="https://g.page/r/…"
            className={inputClass}
          />
          {p.url && p.isActive && (
            <div className="flex items-center gap-2 mt-2">
              {!p.isDefault && (
                <button
                  onClick={() => onSetDefault(p.id)}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Als Standard setzen
                </button>
              )}
              {p.type === "custom" && (
                <button
                  onClick={() => onRemove(p.id)}
                  className="text-xs text-white/20 hover:text-[var(--c-accent)] transition-colors ml-auto"
                >
                  Entfernen
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="border border-white/10 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-white/60">Benutzerdefinierte Plattform</p>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Plattform-Name (z.B. Houzz)"
            className={inputClass}
            autoFocus
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="flex-1 py-2 text-sm text-white/40 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newUrl.trim()}
              className="flex-1 py-2 text-sm rounded-lg transition-colors"
              style={{ backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }}
            >
              Hinzufügen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Benutzerdefinierte Plattform hinzufügen
        </button>
      )}
    </div>
  );
}
