"use client";

import FeatureLayout from "../../_components/feature-layout";
import VerfuegbarkeitsForm from "@/components/dienstplan/VerfuegbarkeitsForm";

const EMPLOYEE_ID = process.env.NEXT_PUBLIC_SUPABASE_EMPLOYEE_ID ?? "demo";

export default function VerfuegbarkeitsPage() {
  const isDemo = EMPLOYEE_ID === "demo";

  return (
    <FeatureLayout
      name="Verfügbarkeit"
      description="Trage hier deine verfügbaren Zeiten für die kommende Woche ein. Dein Chef sieht diese Angaben bei der Schichtplanung."
      backHref="/dashboard/dienstplan"
    >
      {isDemo ? (
        <div className="bg-white/5 border border-white/10 rounded-xl py-14 px-8 text-center">
          <p className="text-3xl mb-4">🔑</p>
          <p className="text-sm text-white/50">
            Bitte{" "}
            <code className="text-xs bg-white/10 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_EMPLOYEE_ID</code>{" "}
            in{" "}
            <code className="text-xs bg-white/10 px-1 py-0.5 rounded">.env</code>{" "}
            setzen.
          </p>
        </div>
      ) : (
        <VerfuegbarkeitsForm employeeId={EMPLOYEE_ID} />
      )}
    </FeatureLayout>
  );
}
