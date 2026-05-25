"use client";

// Fonts werden global in src/app/layout.tsx geladen (DM_Serif_Display + DM_Sans).
// Dieses Layout steuert den Trial-Status für alle Dashboard-Seiten.

import { usePathname } from "next/navigation";
import { useTrial } from "@/hooks/useTrial";
import TrialBanner from "@/components/trial/TrialBanner";
import TrialGate from "@/components/trial/TrialGate";

// Routen die auch nach Ablauf des Testzeitraums zugänglich bleiben
const ALWAYS_ALLOWED = ["/dashboard/konto"];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const trial = useTrial();
  const pathname = usePathname();

  const isAllowed = ALWAYS_ALLOWED.some((r) => pathname.startsWith(r));
  const showGate = trial.status === "expired" && !isAllowed;

  return (
    <>
      {/* Dezentes Banner während des Testzeitraums */}
      <TrialBanner trial={trial} />

      {/* Sperr-Seite wenn Trial abgelaufen – außer auf erlaubten Routen */}
      {showGate ? <TrialGate /> : children}
    </>
  );
}
