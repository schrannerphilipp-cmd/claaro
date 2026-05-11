"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sendDunningEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

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
  kanal: "email" | "whatsapp",
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

    if (kanal === "email") {
      await sendDunningEmail({ to: rechnung.kunde.email, ...params });
    } else {
      await sendWhatsAppMessage({ to: rechnung.kunde.phone, ...params });
    }

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
