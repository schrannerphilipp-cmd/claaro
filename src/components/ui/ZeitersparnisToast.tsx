"use client";

import { useState, useEffect, useRef } from "react";
import type { ZeitersparnisEvent } from "@/lib/zeitersparnis";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

function formatZeit(minuten: number): string {
  if (minuten >= 60) {
    const h = Math.floor(minuten / 60);
    const m = minuten % 60;
    return m > 0 ? `${h} Std. ${m} Min.` : `${h} Stunde${h > 1 ? "n" : ""}`;
  }
  return `${minuten} Minute${minuten !== 1 ? "n" : ""}`;
}

interface Toast {
  id: number;
  aktion: string;
  minuten: number;
}

export default function ZeitersparnisToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [sessionMinuten, setSessionMinuten] = useState(0);
  const idRef = useRef(0);

  useEffect(() => {
    function handler(e: Event) {
      const { aktion, minuten } = (e as CustomEvent<ZeitersparnisEvent>).detail;
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, aktion, minuten }]);
      setSessionMinuten((prev) => prev + minuten);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    }

    window.addEventListener("claaro:zeitersparnis", handler);
    return () => window.removeEventListener("claaro:zeitersparnis", handler);
  }, []);

  if (toasts.length === 0) return null;

  // Zeige nur den neuesten Toast
  const latest = toasts[toasts.length - 1];

  return (
    <div
      className="fixed bottom-6 right-6 z-50 pointer-events-none"
      style={sans}
      aria-live="polite"
    >
      <div
        key={latest.id}
        className="pointer-events-auto max-w-xs w-full rounded-2xl border px-5 py-4 shadow-2xl"
        style={{
          backgroundColor: "rgba(30,122,107,0.95)",
          borderColor: "rgba(255,255,255,0.15)",
          animation: "claaro-zeitersparnis-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        <style>{`
          @keyframes claaro-zeitersparnis-in {
            from { opacity: 0; transform: translateY(24px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes claaro-zeitersparnis-in {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          }
        `}</style>

        <div className="flex items-start gap-3">
          {/* Uhr-Icon */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 7v5.5l3 1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-snug">
              Du hast gerade{" "}
              <span className="text-white">{formatZeit(latest.minuten)}</span>{" "}
              gespart!
            </p>
            <p className="text-white/65 text-xs mt-0.5">{latest.aktion}</p>

            {sessionMinuten > latest.minuten && (
              <p className="text-white/50 text-xs mt-2 pt-2 border-t border-white/15">
                Gesamt heute: {formatZeit(sessionMinuten)} gespart
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
