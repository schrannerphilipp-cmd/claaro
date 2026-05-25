"use client";

/**
 * DEV-Toggle Button — wird nur gerendert wenn NEXT_PUBLIC_DEV_TOGGLE=true in .env.local.
 * Erscheint ausschließlich im Browser (ssr: false), keine Hydration-Konflikte.
 *
 * Zustände (Klick wechselt durch alle 4):
 *   ● Trial           → amber   (Zustand A)
 *   ● Bestandskunde   → grün    (Zustand B)
 *   ● Abgelaufen      → rot     (Zustand C)
 *   ● Nicht eingeloggt→ violett (Zustand D)
 *
 * null (Echtdaten, vor erstem Klick) → grau, nicht im Cycle
 */

import { useDevView } from "@/hooks/useDevView";
import type { DevView } from "@/hooks/useDevView";

type ColorSet = { bg: string; border: string; text: string; dot: string };

const COLORS: Record<NonNullable<DevView> | "__none__", ColorSet> = {
  __none__:  { bg: "rgba(255,255,255,0.07)", border: "rgba(255,255,255,0.16)", text: "rgba(255,255,255,0.45)", dot: "rgba(255,255,255,0.30)" },
  trial:     { bg: "rgba(200,155,40,0.20)",  border: "rgba(200,155,40,0.45)",  text: "#c8b060",               dot: "#c8a030" },
  paid:      { bg: "rgba(30,122,107,0.22)",  border: "rgba(30,122,107,0.50)",  text: "var(--c-teal)",         dot: "var(--c-teal)" },
  expired:   { bg: "rgba(200,60,30,0.20)",   border: "rgba(200,60,30,0.50)",   text: "#e06848",               dot: "#d05030" },
  landing:   { bg: "rgba(120,70,210,0.20)",  border: "rgba(120,70,210,0.45)",  text: "#c0a0f8",               dot: "#a880e8" },
};

export default function DevToggleButton() {
  const { devView, isDev, cycleDevView, devLabel } = useDevView();

  if (!isDev) return null;

  const color = devView ? COLORS[devView] : COLORS.__none__;

  return (
    <div className="fixed bottom-6 left-44 z-[9999]">
      <button
        onClick={cycleDevView}
        title={`DEV: Zustand wechseln — aktuell: ${devLabel}`}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xl border transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: color.bg,
          borderColor:     color.border,
          color:           color.text,
          backdropFilter:  "blur(8px)",
          fontFamily:      "monospace",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-none"
          style={{ backgroundColor: color.dot }}
        />
        <span>DEV · {devLabel}</span>
      </button>
    </div>
  );
}
