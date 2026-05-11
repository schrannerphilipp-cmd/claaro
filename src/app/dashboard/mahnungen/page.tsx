import FeatureLayout from "../_components/feature-layout";
import MahnungenView from "./_components/MahnungenView";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MahnungenPage() {
  const raw = await db.rechnung.findMany({
    include: {
      kunde: { include: { sepaMandat: true } },
      mahnungen: true,
    },
    orderBy: { faelligkeitsdatum: "asc" },
  });

  const rechnungen = raw.map((r) => ({
    ...r,
    faelligkeitsdatum: r.faelligkeitsdatum.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    kunde: {
      ...r.kunde,
      createdAt: r.kunde.createdAt.toISOString(),
      updatedAt: r.kunde.updatedAt.toISOString(),
      sepaMandat: r.kunde.sepaMandat
        ? {
            id: r.kunde.sepaMandat.id,
            kontoinhaber: r.kunde.sepaMandat.kontoinhaber,
            iban: r.kunde.sepaMandat.iban,
          }
        : null,
    },
    mahnungen: r.mahnungen.map((m) => ({
      ...m,
      versandtAm: m.versandtAm?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
  }));

  return (
    <FeatureLayout
      name="Mahnungen"
      description="Offene Rechnungen nachverfolgen, Zahlungserinnerungen fristgerecht versenden und rechtssicher dokumentieren."
    >
      <MahnungenView rechnungen={rechnungen} />
    </FeatureLayout>
  );
}
