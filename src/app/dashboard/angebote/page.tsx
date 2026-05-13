"use client";

import { useState } from "react";
import FeatureLayout from "../_components/feature-layout";
import AngebotFormular from "../../angebot/AngebotFormular";
import AngeboteListe from "./AngeboteListe";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;

export default function AngebotePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <FeatureLayout
      name="Angebote"
      description="Erstellen Sie in wenigen Minuten professionelle Angebote mit automatischer Berechnung, Mehrwertsteuerausweis und direktem PDF-Export."
    >
      <AngeboteListe key={refreshKey} />

      <div className="border-t border-white/8 pt-10">
        <h2 className="text-2xl text-white mb-8" style={serif}>Neues Angebot</h2>
        <AngebotFormular onSaved={() => setRefreshKey(k => k + 1)} />
      </div>
    </FeatureLayout>
  );
}
