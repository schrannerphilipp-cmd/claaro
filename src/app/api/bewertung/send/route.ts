import { NextRequest, NextResponse } from "next/server";
import { trackingStore } from "@/lib/bewertung-store";

interface SendBody {
  phone: string;
  channel: "whatsapp" | "sms";
  templateBody: string;
  platformId: string;
  platformUrl: string;
  customerId: string;
  customerName: string;
  templateId: string;
  triggerType: "appointment" | "transaction" | "manual";
  triggerId?: string;
}

function buildMessageBody(
  templateBody: string,
  variables: Record<string, string>
): string {
  return Object.entries(variables).reduce(
    (msg, [key, val]) => msg.replaceAll(key, val),
    templateBody
  );
}

export async function POST(req: NextRequest) {
  let body: SendBody;
  try {
    body = (await req.json()) as SendBody;
  } catch {
    return NextResponse.json({ success: false, error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { phone, channel, templateBody, platformUrl, customerId, customerName } = body;

  if (!phone || !templateBody || !platformUrl) {
    return NextResponse.json(
      { success: false, error: "Fehlende Pflichtfelder." },
      { status: 400 }
    );
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER ?? "whatsapp:+14155238886";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const token = crypto.randomUUID();
  const trackingUrl = `${baseUrl}/api/bewertung/track/${token}`;

  const businessName = process.env.CLAARO_BUSINESS_NAME ?? "Ihr Betrieb";
  const messageText = buildMessageBody(templateBody, {
    "{kunde}": customerName,
    "{betrieb}": businessName,
    "{link}": trackingUrl,
  });

  const requestId = crypto.randomUUID();

  trackingStore.set(token, {
    requestId,
    platformUrl,
    customerId,
    sentAt: new Date().toISOString(),
  });

  if (!accountSid || !authToken) {
    console.warn(
      "[claaro/bewertung/send] Twilio-Zugangsdaten fehlen — Versand übersprungen.\n" +
        "  Konfiguriere TWILIO_ACCOUNT_SID und TWILIO_AUTH_TOKEN in .env\n" +
        "  Nachricht an " + phone + ":\n" + messageText
    );
    return NextResponse.json({ success: true, requestId, token, dev: true });
  }

  const from =
    channel === "whatsapp"
      ? twilioWhatsApp
      : twilioPhone ?? "";

  const to =
    channel === "whatsapp"
      ? phone.startsWith("whatsapp:")
        ? phone
        : `whatsapp:${phone}`
      : phone;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: to, Body: messageText }),
      }
    );

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      return NextResponse.json(
        { success: false, error: err.message ?? `Twilio Fehler ${res.status}` },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Verbindungsfehler." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, requestId, token });
}
