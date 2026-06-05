import { NextRequest, NextResponse } from "next/server";
import { trackingStore } from "@/lib/bewertung-store";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

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

// Allowed URL schemes for platformUrl to prevent open-redirect abuse via track endpoint
const ALLOWED_URL_PREFIXES = ["https://", "http://"];

function isValidPlatformUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

// E.164 phone number validation (loose — accepts +<digits>, 7–15 digits)
function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone.replace(/[\s\-()]/g, ""));
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
  // Auth required — only logged-in users can trigger review requests
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  // Rate limit: 10 per minute per user
  const rl = checkRateLimit(`bewertung:${user.id}`, 10, 60_000);
  if (!rl.allowed) return rateLimitExceeded();

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

  if (!isValidPhone(phone)) {
    return NextResponse.json(
      { success: false, error: "Ungültige Telefonnummer. Bitte im internationalen Format angeben (z.B. +49...)." },
      { status: 400 }
    );
  }

  if (!isValidPlatformUrl(platformUrl)) {
    return NextResponse.json(
      { success: false, error: "Ungültige Plattform-URL." },
      { status: 400 }
    );
  }

  // Suppress unused variable warning from original code
  void ALLOWED_URL_PREFIXES;

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
