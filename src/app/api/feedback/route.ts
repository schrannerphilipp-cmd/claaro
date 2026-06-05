import { NextRequest, NextResponse } from "next/server";
import { getResend } from "@/lib/email";
import { createServerClient } from "@/lib/supabase";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  // Rate limiting: 10 requests per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = checkRateLimit(ip, 10, 60_000);
  if (!rl.allowed) return rateLimitExceeded();

  let body: {
    name: string;
    email: string;
    kategorie: string;
    nachricht: string;
    sterne?: number;
    hauptaccountId?: string;
    _honeypot?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  // Honeypot: bots fill this, humans don't
  if (body._honeypot) {
    // Silently accept to not tip off bots
    return NextResponse.json({ success: true });
  }

  const { name, email, kategorie, nachricht, sterne } = body;

  if (!name || !email || !kategorie || !nachricht) {
    return NextResponse.json({ error: "Alle Felder sind pflicht." }, { status: 400 });
  }
  if (nachricht.trim().length < 20) {
    return NextResponse.json({ error: "Nachricht zu kurz (min. 20 Zeichen)." }, { status: 400 });
  }
  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }

  const feedbackEmail = process.env.FEEDBACK_EMAIL ?? "hallo@getclaaro.de";
  const timestamp = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });
  const sterneAnzeige = sterne ? "★".repeat(sterne) + "☆".repeat(5 - sterne) : "–";

  // All user-supplied values are escaped before insertion into HTML
  const safeName      = escapeHtml(name);
  const safeEmail     = escapeHtml(email);
  const safeKategorie = escapeHtml(kategorie);
  const safeNachricht = escapeHtml(nachricht);
  const safeSterne    = escapeHtml(sterneAnzeige);

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Claaro <hallo@getclaaro.de>",
        to: feedbackEmail,
        subject: `Claaro Feedback: ${safeKategorie} von ${safeName} ${safeSterne}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#c84b2f;">Neues Feedback über Claaro</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td><td style="padding:8px 0;font-weight:600;">${safeName}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">E-Mail</td><td style="padding:8px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
              <tr><td style="padding:8px 0;color:#666;">Kategorie</td><td style="padding:8px 0;">${safeKategorie}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Bewertung</td><td style="padding:8px 0;font-size:18px;color:#c84b2f;">${safeSterne}${sterne ? ` <span style="font-size:13px;color:#666;">(${sterne}/5)</span>` : ""}</td></tr>
              <tr><td style="padding:8px 0;color:#666;">Zeitstempel</td><td style="padding:8px 0;">${escapeHtml(timestamp)}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <p style="color:#333;line-height:1.6;white-space:pre-wrap;">${safeNachricht}</p>
            <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
            <p style="color:#999;font-size:12px;">Gesendet über Claaro – ${escapeHtml(timestamp)}</p>
          </div>
        `,
      });
    } catch (err) {
      console.warn("[feedback] Resend-Fehler:", err);
    }
  } else {
    console.warn("[feedback] RESEND_API_KEY nicht gesetzt — E-Mail übersprungen.");
  }

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
