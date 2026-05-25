"use client";

import Link from "next/link";
import type { TrialState } from "@/hooks/useTrial";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

interface Props {
  trial: TrialState;
}

export default function TrialBanner({ trial }: Props) {
  // Nur während aktivem Trial zeigen, nicht bei paid / loading / expired
  if (trial.status !== "trial" && trial.status !== "expiring") return null;

  const urgent = trial.status === "expiring";

  return (
    <div
      className="w-full px-4 sm:px-6 py-2 flex items-center justify-between gap-4"
      style={{
        backgroundColor: urgent
          ? "rgba(245,158,11,0.12)"
          : "rgba(var(--c-teal-rgb),0.08)",
        borderBottom: urgent
          ? "1px solid rgba(245,158,11,0.2)"
          : "1px solid rgba(var(--c-teal-rgb),0.15)",
        ...sans,
      }}
    >
      <p
        className="text-xs"
        style={{ color: urgent ? "rgb(245,158,11)" : "var(--c-teal)" }}
      >
        {urgent ? (
          <>
            ⚠️{" "}
            <span className="font-medium">
              Testzeitraum endet in {trial.daysLeft}{" "}
              {trial.daysLeft === 1 ? "Tag" : "Tagen"}
            </span>{" "}
            — danach ist ein Abo erforderlich.
          </>
        ) : (
          <>
            🕒{" "}
            <span className="font-medium">
              Testzeitraum: noch {trial.daysLeft} Tage
            </span>
            {trial.trialEndsAt && (
              <span className="text-white/45 ml-1">
                (bis{" "}
                {trial.trialEndsAt.toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
                )
              </span>
            )}
          </>
        )}
      </p>

      <Link
        href="/dashboard/konto?tab=abo"
        className="shrink-0 text-xs font-medium px-3 py-1 rounded-lg transition-colors"
        style={
          urgent
            ? {
                backgroundColor: "rgba(245,158,11,0.2)",
                color: "rgb(245,158,11)",
                border: "1px solid rgba(245,158,11,0.3)",
              }
            : {
                backgroundColor: "rgba(var(--c-teal-rgb),0.15)",
                color: "var(--c-teal)",
                border: "1px solid rgba(var(--c-teal-rgb),0.25)",
              }
        }
      >
        Jetzt upgraden →
      </Link>
    </div>
  );
}
