"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sendDunningEmail } from "@/lib/email";

const STUFE_MIN_DAYS: Record<1 | 2 | 3, number> = { 1: 1, 2: 7, 3: 14 };

type SendResult =
  | { success: true; stufe: number }
  | { success: false; error: string };

type MandatResult =
  | { success: true }
  | { success: false; error: string };

// ── Send Mahnung ─────────────────────────────────────────────────────────────

export async function sendMahnung(
  rechnungId: string,
  kanal: "email",
  sepaEnabled: boolean
): Promise<SendResult> {
  try {
    const rechnung = await db.rechnung.findUnique({
      where: { id: rechnungId },
      include: { kunde: true, mahnungen: true },
    });

    if (!rechnung) return { success: false, error: "Rechnung nicht gefunden." };
    if (rechnung.status === "bezahlt")
      return { success: false, error: "Diese Rechnung wurde bereits bezahlt." };

    const daysOver = Math.floor(
      (Date.now() - rechnung.faelligkeitsdatum.getTime()) / 86_400_000
    );
    const sentStufen = rechnung.mahnungen.map((m) => m.stufe);

    let nextStufe: 1 | 2 | 3 | null = null;
    for (const stufe of [1, 2, 3] as const) {
      if (!sentStufen.includes(stufe) && daysOver >= STUFE_MIN_DAYS[stufe]) {
        nextStufe = stufe;
        break;
      }
    }

    if (nextStufe === null) {
      return {
        success: false,
        error:
          sentStufen.length >= 3
            ? "Alle drei Mahnstufen wurden bereits gesendet."
            : "Die Rechnung ist noch nicht lange genug überfällig für die nächste Stufe.",
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const zahlungslink = `${baseUrl}/api/payment/${rechnung.zahlungsToken}`;

    await db.$transaction([
      db.mahnung.create({
        data: {
          rechnungId,
          stufe: nextStufe,
          kanal,
          status: "gesendet",
          versandtAm: new Date(),
        },
      }),
      db.rechnung.update({
        where: { id: rechnungId },
        data: { status: "gemahnt" },
      }),
    ]);

    const params = {
      kundenname: rechnung.kunde.name,
      rechnungsnummer: rechnung.rechnungsnummer,
      betrag: rechnung.betrag,
      faelligkeitsdatum: rechnung.faelligkeitsdatum,
      zahlungslink,
      stufe: nextStufe,
      sepaEnabled,
    };

    await sendDunningEmail({ to: rechnung.kunde.email, ...params });

    revalidatePath("/dashboard/mahnungen");
    return { success: true, stufe: nextStufe };
  } catch (err) {
    console.error("[sendMahnung]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.",
    };
  }
}

// ── Create Rechnung ──────────────────────────────────────────────────────────

type CreateRechnungResult =
  | { success: true; rechnungsnummer: string }
  | { success: false; error: string };

export async function createRechnung(data: {
  kundenname: string;
  kundenemail: string;
  betrag: number;
  faelligkeitsdatum: string;
  rechnungsnummer: string;
  beschreibung: string;
  mwstSatz: number;
}): Promise<CreateRechnungResult> {
  try {
    if (!data.kundenname.trim()) return { success: false, error: "Kundenname ist erforderlich." };
    if (!data.kundenemail.trim() || !data.kundenemail.includes("@"))
      return { success: false, error: "Bitte eine gültige E-Mail-Adresse eingeben." };
    if (!data.betrag || data.betrag <= 0) return { success: false, error: "Betrag muss größer als 0 sein." };
    if (!data.faelligkeitsdatum) return { success: false, error: "Fälligkeitsdatum ist erforderlich." };
    if (!data.rechnungsnummer.trim()) return { success: false, error: "Rechnungsnummer ist erforderlich." };
    if (!data.beschreibung.trim()) return { success: false, error: "Leistungsbeschreibung ist erforderlich." };

    const dateParts = data.faelligkeitsdatum.split("-").map(Number);
    const faellig = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    if (isNaN(faellig.getTime())) return { success: false, error: "Ungültiges Fälligkeitsdatum." };

    const kunde = await db.kunde.create({
      data: {
        name: data.kundenname.trim(),
        email: data.kundenemail.trim().toLowerCase(),
        phone: "",
        address: "",
      },
    });

    await db.rechnung.create({
      data: {
        kundeId: kunde.id,
        betrag: data.betrag,
        faelligkeitsdatum: faellig,
        rechnungsnummer: data.rechnungsnummer.trim(),
        beschreibung: data.beschreibung.trim(),
        mwstSatz: data.mwstSatz,
        status: "offen",
      },
    });

    revalidatePath("/dashboard/mahnungen");
    return { success: true, rechnungsnummer: data.rechnungsnummer.trim() };
  } catch (err) {
    console.error("[createRechnung]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.",
    };
  }
}

// ── Save SEPA Mandat ─────────────────────────────────────────────────────────

export async function saveSepaMandat(data: {
  kundeId: string;
  kontoinhaber: string;
  iban: string;
  bic: string;
  datum: string;
  unterschrift: boolean;
}): Promise<MandatResult> {
  try {
    if (!data.unterschrift) {
      return { success: false, error: "Bitte bestätigen Sie das Mandat durch Ankreuzen." };
    }

    const ibanClean = data.iban.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(ibanClean)) {
      return { success: false, error: "Ungültige IBAN. Bitte überprüfen Sie die Eingabe." };
    }

    const bicClean = data.bic.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bicClean)) {
      return { success: false, error: "Ungültiger BIC. Bitte überprüfen Sie die Eingabe." };
    }

    const kunde = await db.kunde.findUnique({ where: { id: data.kundeId } });
    if (!kunde) return { success: false, error: "Kunde nicht gefunden." };

    await db.sepaMandat.upsert({
      where: { kundeId: data.kundeId },
      update: {
        kontoinhaber: data.kontoinhaber,
        iban: ibanClean,
        bic: bicClean,
        datum: new Date(data.datum),
        unterschrift: true,
        updatedAt: new Date(),
      },
      create: {
        kundeId: data.kundeId,
        kontoinhaber: data.kontoinhaber,
        iban: ibanClean,
        bic: bicClean,
        datum: new Date(data.datum),
        unterschrift: true,
      },
    });

    revalidatePath("/dashboard/mahnungen");
    return { success: true };
  } catch (err) {
    console.error("[saveSepaMandat]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten.",
    };
  }
}
