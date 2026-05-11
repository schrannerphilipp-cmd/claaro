import { Resend } from "resend";

// Lazy-init so missing key doesn't crash at import time
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return (_resend ??= new Resend(process.env.RESEND_API_KEY));
}

export type DunningEmailParams = {
  to: string;
  kundenname: string;
  rechnungsnummer: string;
  betrag: number;
  faelligkeitsdatum: Date;
  zahlungslink: string;
  stufe: 1 | 2 | 3;
  sepaEnabled?: boolean;
};

const SUBJECTS: Record<1 | 2 | 3, (nr: string) => string> = {
  1: (nr) => `Zahlungserinnerung: Rechnung ${nr}`,
  2: (nr) => `2. Mahnung: Rechnung ${nr} – Zahlung ausstehend`,
  3: (nr) => `LETZTE MAHNUNG: Rechnung ${nr} – Inkasso droht`,
};

const INTROS: Record<1 | 2 | 3, string> = {
  1: "Wir möchten Sie freundlich daran erinnern, dass folgende Rechnung noch aussteht. Möglicherweise ist die Zahlung bereits auf dem Weg – dann bitten wir Sie, dieses Schreiben als gegenstandslos zu betrachten.",
  2: "Trotz unserer Zahlungserinnerung haben wir leider noch keinen Zahlungseingang verzeichnen können. Wir bitten Sie dringend, den offenen Betrag umgehend zu begleichen.",
  3: "Dies ist unsere letzte Mahnung. Sollte der ausstehende Betrag nicht innerhalb von 7 Tagen eingehen, sind wir gezwungen, die Forderung an ein Inkassobüro zu übergeben. Damit verbundene Kosten gehen zu Ihren Lasten.",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildHtml(p: DunningEmailParams): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr><td style="background:#1a1814;padding:28px 40px;">
          <span style="font-size:22px;font-weight:700;color:#c84b2f;letter-spacing:-0.5px;">claaro</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">
            Stufe ${p.stufe} – ${p.stufe === 1 ? "Freundliche Erinnerung" : p.stufe === 2 ? "Zweite Mahnung" : "Letzte Mahnung"}
          </p>
          <h1 style="margin:0 0 24px;font-size:24px;color:#1a1814;">
            ${p.stufe === 1 ? "Zahlungserinnerung" : p.stufe === 2 ? "Zweite Mahnung" : "Letzte Mahnung vor Inkasso"}
          </h1>
          <p style="margin:0 0 16px;font-size:15px;color:#333;">Sehr geehrte/r ${p.kundenname},</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">${INTROS[p.stufe]}</p>
          <!-- Invoice details -->
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:28px;">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e8e4dc;">
                <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Rechnungsnummer</span>
                <span style="font-size:15px;color:#1a1814;font-weight:600;">${p.rechnungsnummer}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e8e4dc;">
                <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Offener Betrag</span>
                <span style="font-size:20px;color:#c84b2f;font-weight:700;">${formatCurrency(p.betrag)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Fällig seit</span>
                <span style="font-size:15px;color:#1a1814;">${formatDate(p.faelligkeitsdatum)}</span>
              </td>
            </tr>
          </table>
          <!-- SEPA option (conditional) -->
          ${p.sepaEnabled ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#f0f9f7;border:1px solid #c8e6e1;border-radius:6px;padding:16px 20px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1e7a6b;">
                Alternativ: SEPA-Lastschrift
              </p>
              <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
                Wir bieten Ihnen die Möglichkeit, den Betrag bequem per SEPA-Lastschrift zu begleichen.
                Antworten Sie einfach auf diese E-Mail, um ein Mandat zu erteilen — wir kümmern uns um den Rest.
              </p>
            </td></tr>
          </table>` : ""}
          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td>
              <a href="${p.zahlungslink}"
                 style="display:inline-block;background:#c84b2f;color:#ffffff;font-size:15px;font-weight:600;
                        padding:14px 28px;border-radius:8px;text-decoration:none;">
                Jetzt online bezahlen →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#999;line-height:1.5;">
            Falls Sie den Betrag bereits überwiesen haben, bitten wir Sie, dieses Schreiben zu ignorieren.<br>
            Bei Rückfragen antworten Sie einfach auf diese E-Mail.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f8f6;padding:20px 40px;border-top:1px solid #e8e4dc;">
          <p style="margin:0;font-size:12px;color:#aaa;">
            Diese Nachricht wurde automatisch über claaro versendet.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendDunningEmail(params: DunningEmailParams): Promise<void> {
  const resend = getResend();

  if (!resend) {
    console.warn(
      "[claaro/email] RESEND_API_KEY not set — skipping email send.\n" +
      "  Setup: sign up at resend.com, verify a domain, add RESEND_API_KEY + EMAIL_FROM to .env"
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Mahnungen <mahnungen@example.com>",
    to: params.to,
    subject: SUBJECTS[params.stufe](params.rechnungsnummer),
    html: buildHtml(params),
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}
