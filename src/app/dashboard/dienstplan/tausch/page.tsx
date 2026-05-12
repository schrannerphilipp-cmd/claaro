"use client";

import { useState } from "react";
import FeatureLayout from "../../_components/feature-layout";
import TauschBoerse from "@/components/dienstplan/TauschBoerse";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const EMPLOYEE_ID = process.env.NEXT_PUBLIC_SUPABASE_EMPLOYEE_ID ?? "demo";
const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "demo";

export default function TauschPage() {
  const [ansicht, setAnsicht] = useState<"mitarbeiter" | "admin">("mitarbeiter");
  const isDemo = EMPLOYEE_ID === "demo" && HAUPTACCOUNT_ID === "demo";

  return (
    <FeatureLayout
      name="Tauschbörse"
      description="Schichten unkompliziert tauschen — mit automatischer Benachrichtigung und Admin-Genehmigung."
      backHref="/dashboard/dienstplan"
    >
      <div className="space-y-6" style={sans}>
        {isDemo ? (
          <div className="bg-white/5 border border-white/10 rounded-xl py-14 px-8 text-center">
            <p className="text-3xl mb-4">🔑</p>
            <p className="text-sm text-white/50">
              Supabase-Credentials in <code className="text-xs bg-white/10 px-1 py-0.5 rounded">.env</code> konfigurieren.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {(["mitarbeiter", "admin"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setAnsicht(t)}
                  className="text-sm px-4 py-2 rounded-lg border transition-colors"
                  style={
                    ansicht === t
                      ? { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "white" }
                      : { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {t === "mitarbeiter" ? "Meine Tausche" : "Admin-Genehmigung"}
                </button>
              ))}
            </div>

            <TauschBoerse
              employeeId={ansicht === "mitarbeiter" ? EMPLOYEE_ID : undefined}
              hauptaccountId={ansicht === "admin" ? HAUPTACCOUNT_ID : undefined}
              isAdmin={ansicht === "admin"}
            />
          </>
        )}
      </div>
    </FeatureLayout>
  );
}
