import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  let body: { name: string; email: string; kategorie: string; nachricht: string; sterne?: number; hauptaccountId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { name, email, kategorie, nachricht, sterne } = body;

  if (!name || !email || !kategorie || !nachricht) {
    return NextResponse.json({ error: "Alle Felder sind pflicht." }, { status: 400 });
  }
  if (nachricht.trim().length < 20) {
    return NextResponse.json({ error: "Nachricht zu kurz (min. 20 Zeichen)." }, { status: 400 });
  }

  const feedbackEmail = process.env.FEEDBACK_EMAIL ?? "schranner.philipp@gmail.com";
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const sterneAnzeige = sterne ? "★".repeat(sterne) + "☆".repeat(5 - sterne) : "–";

  // 1. E-Mail via Resend
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Claaro Feedback <feedback@claaro.de>",
        to: feedbackEmail,
        subject: `Claaro Feedback: ${kategorie} von ${name} ${sterneAnzeige}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#c84b2f;">Neues Feedback über Claaro</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">E-Mail</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Kategorie</td><td style="padding:8px 0;">${kategorie}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Bewertung</td><td style="padding:8px 0;font-size:18px;color:#c84b2f;">${sterneAnzeige}${sterne ? ` <span style="font-size:13px;color:#666;">(${sterne}/5)</span>` : ""}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Zeitstempel</td><td style="padding:8px 0;">${timestamp}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <p style="color:#333;line-height:1.6;white-space:pre-wrap;">${nachricht.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <p style="color:#999;font-size:12px;">Gesendet über Claaro – ${timestamp}</p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[feedback] Resend-Fehler:", err);
      // nicht blockieren — in DB trotzdem speichern
    }
  } else {
    console.warn("[feedback] RESEND_API_KEY nicht gesetzt — E-Mail übersprungen.");
    console.log(`Feedback: ${kategorie} von ${name} <${email}>: ${nachricht.slice(0, 80)}`);
  }

  // 2. Als Backup in DB speichern
  try {
    const supabase = createServerClient();
    await supabase.from("feedback").insert({
      hauptaccount_id: body.hauptaccountId ?? null,
      name,
      email,
      kategorie,
      nachricht,
    });
  } catch (err) {
    console.warn("[feedback] DB-Speicherung fehlgeschlagen:", err);
  }

  return NextResponse.json({ success: true });
}
