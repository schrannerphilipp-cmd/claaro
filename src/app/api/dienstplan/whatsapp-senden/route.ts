import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { NotifTyp } from "@/types/dienstplan";

interface WhatsappBody {
  typ: NotifTyp;
  employeeIds: string[];
  nachricht?: string;
  shiftPlanId?: string;
}

async function sendTwilio(to: string, body: string): Promise<"gesendet" | "fehler"> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    console.warn("[dienstplan/whatsapp] Twilio nicht konfiguriert — Nachricht:", body);
    return "gesendet"; // dev mode
  }

  const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const creds = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${creds}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: toFormatted, Body: body }),
      }
    );
    return res.ok ? "gesendet" : "fehler";
  } catch {
    return "fehler";
  }
}

export async function POST(req: NextRequest) {
  let body: WhatsappBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const supabase = createServerClient();

  // Mitarbeiter-Daten laden
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, name, telefon, email")
    .in("id", body.employeeIds);

  if (error || !employees?.length) {
    return NextResponse.json({ error: "Mitarbeiter nicht gefunden." }, { status: 404 });
  }

  // Schichten laden falls shiftPlanId angegeben
  let shiftsMap: Record<string, { datum: string; von: string; bis: string }[]> = {};
  if (body.shiftPlanId) {
    const { data: shifts } = await supabase
      .from("shifts")
      .select("employee_id, datum, von, bis")
      .eq("shift_plan_id", body.shiftPlanId)
      .in("employee_id", body.employeeIds);

    if (shifts) {
      for (const s of shifts) {
        if (!shiftsMap[s.employee_id]) shiftsMap[s.employee_id] = [];
        shiftsMap[s.employee_id].push({ datum: s.datum, von: s.von, bis: s.bis });
      }
    }
  }

  const results: { employeeId: string; status: "gesendet" | "fehler" }[] = [];

  for (const emp of employees) {
    const nachricht = body.nachricht ?? buildDefaultMessage(body.typ, emp.name, shiftsMap[emp.id] ?? []);
    const status = await sendTwilio(emp.telefon, nachricht);

    // Ins Log schreiben (Fehler werden nie den Hauptflow unterbrechen)
    await supabase.from("notifications_log").insert({
      employee_id: emp.id,
      typ: body.typ,
      whatsapp_status: status,
      nachricht,
      fehler_detail: status === "fehler" ? "Twilio-Fehler" : null,
    });

    results.push({ employeeId: emp.id, status });
  }

  return NextResponse.json({ success: true, results });
}

function buildDefaultMessage(
  typ: NotifTyp,
  name: string,
  schichten: { datum: string; von: string; bis: string }[]
): string {
  const base = `Hallo ${name},\n\n`;
  const footer = "\n\n– Ihr claaro-Team";

  switch (typ) {
    case "schicht": {
      const schichtLines =
        schichten.length > 0
          ? schichten
              .sort((a, b) => a.datum.localeCompare(b.datum))
              .map((s) => `• ${formatDate(s.datum)}: ${s.von}–${s.bis} Uhr`)
              .join("\n")
          : "Keine Schichten in dieser Woche.";
      return `${base}Ihr Schichtplan für diese Woche wurde veröffentlicht:\n\n${schichtLines}${footer}`;
    }
    case "urlaub":
      return `${base}Ihr Urlaubsantrag wurde bearbeitet. Details finden Sie in der claaro App.${footer}`;
    case "tausch":
      return `${base}Sie haben eine neue Schichttausch-Anfrage erhalten. Bitte prüfen Sie diese in der claaro App.${footer}`;
    case "erinnerung":
      return `${base}Erinnerung: Bitte tragen Sie Ihre Verfügbarkeit für die kommende Woche ein.${footer}`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}
