/*
 * WhatsApp sending via Twilio WhatsApp Business API.
 *
 * Setup steps:
 *  1. Create a Twilio account at twilio.com
 *  2. Enable the WhatsApp sandbox (console.twilio.com → Messaging → Try it out → Send a WhatsApp message)
 *     OR apply for a WhatsApp Business sender for production use
 *  3. Add to .env:
 *       TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *       TWILIO_AUTH_TOKEN=your_auth_token
 *       TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   (sandbox) or your approved number
 *
 * The function is a no-op (with a console warning) when credentials are missing,
 * so the rest of the sending flow works uninterrupted during development.
 */

export type DunningWhatsAppParams = {
  to: string;
  kundenname: string;
  rechnungsnummer: string;
  betrag: number;
  faelligkeitsdatum: Date;
  zahlungslink: string;
  stufe: 1 | 2 | 3;
  sepaEnabled?: boolean;
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function buildMessage(p: DunningWhatsAppParams): string {
  const betrag = formatCurrency(p.betrag);
  const nr = p.rechnungsnummer;

  const openers: Record<1 | 2 | 3, string> = {
    1: `Guten Tag ${p.kundenname},\n\nwir möchten Sie freundlich daran erinnern, dass Rechnung *${nr}* über *${betrag}* noch offen ist.`,
    2: `Sehr geehrte/r ${p.kundenname},\n\ntrotz unserer Erinnerung ist Rechnung *${nr}* über *${betrag}* weiterhin unbeglichen.`,
    3: `Sehr geehrte/r ${p.kundenname},\n\ndies ist unsere *letzte Mahnung*. Rechnung *${nr}* über *${betrag}* muss innerhalb von 7 Tagen beglichen werden, sonst folgt die Übergabe an ein Inkassobüro.`,
  };

  const sepaLine = p.sepaEnabled
    ? "\n\n💳 *SEPA-Option:* Alternativ können wir den Betrag per Lastschrift einziehen. Antworten Sie einfach auf diese Nachricht."
    : "";

  return (
    openers[p.stufe] +
    `\n\nJetzt bequem online bezahlen:\n${p.zahlungslink}` +
    sepaLine +
    `\n\nBei Fragen antworten Sie einfach auf diese Nachricht.\n\n– Ihr claaro-Team`
  );
}

export async function sendWhatsAppMessage(params: DunningWhatsAppParams): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    console.warn(
      "[claaro/whatsapp] Twilio credentials not set — skipping WhatsApp send.\n" +
      "  Setup: add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env\n" +
      "  Message that would be sent to " + params.to + ":\n" +
      buildMessage(params)
    );
    return;
  }

  // Normalise number to E.164 whatsapp: format
  const to = params.to.startsWith("whatsapp:") ? params.to : `whatsapp:${params.to}`;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        Body: buildMessage(params),
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Twilio error ${res.status}: ${JSON.stringify(body)}`);
  }
}
