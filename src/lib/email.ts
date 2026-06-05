import { Resend } from "resend";

// ─── Shared singleton ─────────────────────────────────────────────────────────

let _resend: Resend | null = null;
export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return (_resend ??= new Resend(process.env.RESEND_API_KEY));
}

const FROM = process.env.EMAIL_FROM ?? "Claaro <hallo@getclaaro.de>";

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(d: Date) {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Claaro</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
        <tr><td style="background:#241c14;padding:24px 40px;">
          <span style="font-size:20px;font-weight:700;color:#c84b2f;letter-spacing:-0.5px;">claaro</span>
        </td></tr>
        <tr><td style="padding:36px 40px;">${content}</td></tr>
        <tr><td style="background:#f9f8f6;padding:18px 40px;border-top:1px solid #e8e4dc;">
          <p style="margin:0;font-size:12px;color:#aaa;">Diese Nachricht wurde automatisch über claaro versendet.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function btn(href: string, label: string, color = "#c84b2f"): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
    <tr><td>
      <a href="${href}" style="display:inline-block;background:${color};color:#fff;font-size:15px;
         font-weight:600;padding:14px 28px;border-radius:8px;text-decoration:none;">${label} →</a>
    </td></tr>
  </table>`;
}

// ─── 1. Welcome email ─────────────────────────────────────────────────────────

export type WelcomeEmailParams = {
  to: string;
  username?: string;
  trialEndsAt: Date;
};

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[claaro/email] RESEND_API_KEY not set — welcome email skipped.");
    return;
  }

  const name = params.username ?? "dort";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de";
  const trialEnd = formatDate(params.trialEndsAt);

  const html = wrap(`
    <h1 style="margin:0 0 8px;font-size:26px;color:#241c14;">Willkommen bei Claaro! 🎉</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6;">
      Hallo ${name},<br><br>
      dein kostenloses 30-Tage-Testkonto ist jetzt aktiv — du kannst sofort loslegen.
      Dein Testzeitraum endet am <strong>${trialEnd}</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:28px;">
      ${[
        ["📄 Angebote", "Professionelle Angebote in 3 Minuten"],
        ["⏰ Mahnungen", "Rechtssichere Zahlungserinnerungen automatisch versenden"],
        ["🤝 Onboarding", "Neue Mitarbeiter strukturiert einarbeiten"],
        ["🔒 Compliance", "Gesetzliche Fristen nie mehr verpassen"],
      ].map(([icon, text]) => `
      <tr>
        <td style="padding:12px 20px;border-bottom:1px solid #e8e4dc;font-size:14px;color:#333;">
          ${icon}&nbsp;&nbsp;${text}
        </td>
      </tr>`).join("")}
    </table>

    ${btn(`${baseUrl}/dashboard`, "Zum Dashboard")}

    <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.5;">
      Fragen? Antworte einfach auf diese E-Mail — wir helfen dir gerne.
    </p>
  `);

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: "Willkommen bei Claaro — dein Test-Monat beginnt jetzt",
    html,
  });
  if (error) console.error("[claaro/email] Welcome email error:", error);
}

// ─── 2. Trial-expiry reminder ──────────────────────────────────────────────────

export type TrialReminderParams = {
  to: string;
  username?: string;
  daysLeft: number;
  trialEndsAt: Date;
};

export async function sendTrialReminderEmail(params: TrialReminderParams): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[claaro/email] RESEND_API_KEY not set — trial reminder skipped.");
    return;
  }

  const name = params.username ?? "dort";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de";
  const trialEnd = formatDate(params.trialEndsAt);
  const urgencyColor = params.daysLeft <= 2 ? "#c84b2f" : "#d4850a";
  const dayLabel = params.daysLeft === 1 ? "Tag" : "Tage";

  const html = wrap(`
    <p style="margin:0 0 4px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">
      Test-Monat endet bald
    </p>
    <h1 style="margin:0 0 20px;font-size:24px;color:#241c14;">
      Noch <span style="color:${urgencyColor};">${params.daysLeft} ${dayLabel}</span> — jetzt Abo sichern
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Hallo ${name},<br><br>
      dein Claaro-Testzeitraum endet am <strong>${trialEnd}</strong>.
      Danach verlierst du den Zugriff auf alle deine Daten — Angebote, Mahnungen, Einstellungen.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff8f7;border:1px solid #f5d5d0;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#c84b2f;">Das geht verloren ohne Abo:</p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#555;line-height:1.8;">
          <li>Alle erstellten Angebote &amp; Vorlagen</li>
          <li>Offene und gesendete Mahnungen</li>
          <li>Firmendaten &amp; Einstellungen</li>
          <li>Onboarding-Templates &amp; Einarbeitungen</li>
        </ul>
      </td></tr>
    </table>

    ${btn(`${baseUrl}/dashboard/konto#abo`, "Jetzt Abo sichern")}

    <p style="margin:20px 0 0;font-size:13px;color:#999;">
      Ab 23 € / Monat · 14 Tage Geld-zurück-Garantie · Keine versteckten Kosten
    </p>
  `);

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `⏰ Noch ${params.daysLeft} ${dayLabel} — Claaro-Test endet bald`,
    html,
  });
  if (error) console.error("[claaro/email] Trial reminder error:", error);
}

// ─── 3. Dunning (Mahnungen) ───────────────────────────────────────────────────

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

const DUNNING_SUBJECTS: Record<1 | 2 | 3, (nr: string) => string> = {
  1: (nr) => `Zahlungserinnerung: Rechnung ${nr}`,
  2: (nr) => `2. Mahnung: Rechnung ${nr} – Zahlung ausstehend`,
  3: (nr) => `LETZTE MAHNUNG: Rechnung ${nr} – Inkasso droht`,
};

const DUNNING_INTROS: Record<1 | 2 | 3, string> = {
  1: "Wir möchten Sie freundlich daran erinnern, dass folgende Rechnung noch aussteht. Möglicherweise ist die Zahlung bereits auf dem Weg – dann bitten wir Sie, dieses Schreiben als gegenstandslos zu betrachten.",
  2: "Trotz unserer Zahlungserinnerung haben wir leider noch keinen Zahlungseingang verzeichnen können. Wir bitten Sie dringend, den offenen Betrag umgehend zu begleichen.",
  3: "Dies ist unsere letzte Mahnung. Sollte der ausstehende Betrag nicht innerhalb von 7 Tagen eingehen, sind wir gezwungen, die Forderung an ein Inkassobüro zu übergeben. Damit verbundene Kosten gehen zu Ihren Lasten.",
};

function buildDunningHtml(p: DunningEmailParams): string {
  return wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">
      Stufe ${p.stufe} – ${p.stufe === 1 ? "Freundliche Erinnerung" : p.stufe === 2 ? "Zweite Mahnung" : "Letzte Mahnung"}
    </p>
    <h1 style="margin:0 0 24px;font-size:24px;color:#241c14;">
      ${p.stufe === 1 ? "Zahlungserinnerung" : p.stufe === 2 ? "Zweite Mahnung" : "Letzte Mahnung vor Inkasso"}
    </h1>
    <p style="margin:0 0 16px;font-size:15px;color:#333;">Sehr geehrte/r ${p.kundenname},</p>
    <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">${DUNNING_INTROS[p.stufe]}</p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:28px;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e8e4dc;">
        <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Rechnungsnummer</span>
        <span style="font-size:15px;color:#241c14;font-weight:600;">${p.rechnungsnummer}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e8e4dc;">
        <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Offener Betrag</span>
        <span style="font-size:20px;color:#c84b2f;font-weight:700;">${formatCurrency(p.betrag)}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Fällig seit</span>
        <span style="font-size:15px;color:#241c14;">${formatDate(p.faelligkeitsdatum)}</span>
      </td></tr>
    </table>

    ${p.sepaEnabled ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr><td style="background:#f0f9f7;border:1px solid #c8e6e1;border-radius:6px;padding:16px 20px;">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#1e7a6b;">Alternativ: SEPA-Lastschrift</p>
        <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">
          Wir bieten Ihnen die Möglichkeit, den Betrag bequem per SEPA-Lastschrift zu begleichen.
          Antworten Sie einfach auf diese E-Mail, um ein Mandat zu erteilen.
        </p>
      </td></tr>
    </table>` : ""}

    ${btn(p.zahlungslink, "Jetzt online bezahlen")}

    <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.5;">
      Falls Sie den Betrag bereits überwiesen haben, bitten wir Sie, dieses Schreiben zu ignorieren.<br>
      Bei Rückfragen antworten Sie einfach auf diese E-Mail.
    </p>
  `);
}

export async function sendDunningEmail(params: DunningEmailParams): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn(
      "[claaro/email] RESEND_API_KEY not set — dunning email skipped.\n" +
      "  Setup: resend.com → verify domain → add RESEND_API_KEY + EMAIL_FROM to .env.local"
    );
    return;
  }

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: DUNNING_SUBJECTS[params.stufe](params.rechnungsnummer),
    html:    buildDunningHtml(params),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

// ─── 4. Loyalty upgrade ───────────────────────────────────────────────────────

export type LoyaltyUpgradeParams = {
  to: string;
  username?: string;
  status:  "silber" | "gold";
  months:  number;
};

export async function sendLoyaltyUpgradeEmail(params: LoyaltyUpgradeParams): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const cfg = params.status === "silber"
    ? { label: "Silber 🥈", color: "#C0C0C0", percent: 10 }
    : { label: "Gold 🥇",   color: "#FFD700", percent: 15 };
  const name = params.username ?? "dort";

  const html = wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">
      Treue-Programm
    </p>
    <h1 style="margin:0 0 20px;font-size:26px;color:#241c14;">
      ${cfg.label}-Status erreicht!
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Hallo ${name},<br><br>
      herzlichen Glückwunsch! Du nutzt Claaro bereits seit
      <strong>${params.months} Monaten</strong> — vielen Dank für deine Treue!<br><br>
      Als Dankeschön erhältst du ab sofort dauerhaft
      <strong style="color:${cfg.color};">${cfg.percent}% Rabatt</strong>
      auf dein Abonnement. Der Rabatt wurde automatisch angewendet und
      erscheint auf deiner nächsten Rechnung.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Dein Rabatt</span>
        <span style="font-size:22px;font-weight:700;color:${cfg.color};">${cfg.percent}% dauerhaft</span>
      </td></tr>
    </table>

    ${btn(
      (process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de") + "/dashboard/konto#treue",
      "Zu meinem Status", cfg.color.startsWith("#C0") ? "#555" : cfg.color
    )}
  `);

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `🎉 ${cfg.label}-Status erreicht — ${cfg.percent}% Treue-Rabatt aktiv`,
    html,
  });
  if (error) console.error("[claaro/email] Loyalty email error:", error);
}

// ─── 5. Review request (email fallback) ───────────────────────────────────────

export type ReviewRequestEmailParams = {
  to: string;
  customerName: string;
  businessName: string;
  platformName: string;
  reviewUrl: string;
};

export async function sendReviewRequestEmail(params: ReviewRequestEmailParams): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[claaro/email] RESEND_API_KEY not set — review request email skipped.");
    return;
  }

  const html = wrap(`
    <h1 style="margin:0 0 20px;font-size:22px;color:#241c14;">
      Wie war Ihre Erfahrung mit uns?
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Sehr geehrte/r ${params.customerName},<br><br>
      wir hoffen, dass Sie mit unserem Service zufrieden waren!
      Ihre Meinung ist uns sehr wichtig — würden Sie uns eine kurze Bewertung auf
      <strong>${params.platformName}</strong> hinterlassen?
      Das dauert nur wenige Sekunden und hilft uns sehr.
    </p>

    ${btn(params.reviewUrl, "Jetzt bewerten ⭐", "#1e7a6b")}

    <p style="margin:24px 0 0;font-size:13px;color:#999;">
      Vielen Dank für Ihr Vertrauen — Ihr Team von ${params.businessName}
    </p>
  `);

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `${params.businessName} – Wie war Ihre Erfahrung? ⭐`,
    html,
  });
  if (error) console.error("[claaro/email] Review request email error:", error);
}

// ─── 6. Trial expired ────────────────────────────────────────────────────────

export type TrialExpiredParams = {
  to: string;
  username?: string;
};

export async function sendTrialExpiredEmail(params: TrialExpiredParams): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[claaro/email] RESEND_API_KEY not set — trial expired email skipped.");
    return;
  }

  const name = params.username ?? "dort";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de";

  const html = wrap(`
    <h1 style="margin:0 0 20px;font-size:24px;color:#241c14;">
      Dein Testzeitraum ist abgelaufen 😔
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Hallo ${name},<br><br>
      dein 30-tägiger Claaro-Testzeitraum ist beendet. Deine Daten sind noch
      <strong>90 Tage</strong> gespeichert — aber du kannst nur mit einem
      aktiven Abo wieder darauf zugreifen.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fff8f7;border:1px solid #f5d5d0;border-radius:6px;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#c84b2f;">
          Du hast mit Claaro eingerichtet:
        </p>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:#555;line-height:1.8;">
          <li>Angebote, Vorlagen &amp; Kundenstamm</li>
          <li>Mahnungsvorlagen &amp; offene Rechnungen</li>
          <li>Firmendaten &amp; Einstellungen</li>
        </ul>
        <p style="margin:10px 0 0;font-size:13px;color:#c84b2f;font-weight:600;">
          → Jetzt Abo sichern und alles wieder freischalten.
        </p>
      </td></tr>
    </table>

    ${btn(`${baseUrl}/dashboard/konto#abo`, "Abo jetzt aktivieren")}

    <p style="margin:20px 0 0;font-size:13px;color:#999;">
      Ab 23 € / Monat · 14 Tage Geld-zurück-Garantie · Sofort kündbar<br>
      Fragen? Antworte einfach auf diese E-Mail.
    </p>
  `);

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: "Dein Claaro-Test ist abgelaufen — jetzt Abo sichern",
    html,
  });
  if (error) console.error("[claaro/email] Trial expired email error:", error);
}

// ─── 7. Support auto-reply ────────────────────────────────────────────────────

export type SupportAutoReplyParams = {
  to: string;
  customerName: string;
  category: "pricing" | "cancellation" | "password" | "trial" | "invoice";
};

const AUTO_REPLY_CONTENT: Record<SupportAutoReplyParams["category"], { subject: string; body: string }> = {
  pricing: {
    subject: "Claaro Preise & Pläne",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#333;">Hier eine Übersicht unserer Pläne:</p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:20px;">
        ${[
          ["Starter", "23 €/Monat (jährlich)", "3 Module, bis 3 Mitarbeiter"],
          ["Profi",   "47 €/Monat (jährlich)", "Alle 6 Module, bis 15 Mitarbeiter"],
          ["Team",    "79 €/Monat (jährlich)", "Alles aus Profi + unbegrenzte Mitarbeiter"],
        ].map(([plan, price, desc]) => `
        <tr><td style="padding:12px 20px;border-bottom:1px solid #e8e4dc;">
          <strong style="color:#241c14;">${plan}</strong> — ${price}<br>
          <span style="font-size:13px;color:#888;">${desc}</span>
        </td></tr>`).join("")}
      </table>
      <p style="margin:0;font-size:14px;color:#555;">
        Alle Pläne beinhalten 30 Tage kostenlos testen · 14 Tage Geld-zurück-Garantie.
      </p>`,
  },
  cancellation: {
    subject: "Kündigung Ihres Claaro-Abos",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#333;">
        Du kannst dein Abo jederzeit direkt im Dashboard kündigen — keine E-Mail, kein Telefon nötig:
      </p>
      <ol style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#555;line-height:2;">
        <li>Melde dich an: <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de"}/dashboard" style="color:#c84b2f;">getclaaro.de/dashboard</a></li>
        <li>Gehe zu <strong>Mein Konto → Abo &amp; Abrechnung</strong></li>
        <li>Klicke auf <strong>"Abo verwalten"</strong> — du wirst zu deinem Stripe-Kundenportal weitergeleitet</li>
        <li>Dort kannst du das Abo sofort kündigen</li>
      </ol>
      <p style="margin:0;font-size:13px;color:#888;">
        Nach der Kündigung bleibt dein Zugang bis zum Ende der bezahlten Periode aktiv.
        Deine Daten werden 90 Tage aufbewahrt und können nach einer erneuten Aktivierung wieder genutzt werden.
      </p>`,
  },
  password: {
    subject: "Passwort zurücksetzen — Claaro",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#333;">
        Kein Problem! So setzt du dein Passwort zurück:
      </p>
      <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#555;line-height:2;">
        <li>Öffne die Login-Seite: <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de"}/login" style="color:#c84b2f;">getclaaro.de/login</a></li>
        <li>Klicke auf <strong>"Passwort vergessen?"</strong></li>
        <li>Gib deine E-Mail-Adresse ein und klicke auf "Link senden"</li>
        <li>Du erhältst innerhalb von 5 Minuten eine E-Mail mit dem Reset-Link</li>
      </ol>
      <p style="margin:0;font-size:13px;color:#888;">
        Bitte prüfe auch deinen Spam-Ordner, falls die E-Mail nicht ankommt.
      </p>`,
  },
  trial: {
    subject: "Dein Claaro-Testzeitraum — alle Infos",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#333;">Hier alle Infos zu deinem Test-Monat:</p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:20px;">
        ${[
          ["⏱ Laufzeit",       "30 Tage kostenlos, kein Vertrag, keine Kreditkarte"],
          ["🔓 Umfang",        "Vollständiger Zugriff auf alle 6 Module"],
          ["💾 Deine Daten",   "Bleiben 90 Tage nach Ablauf gespeichert"],
          ["💳 Danach",        "Endet automatisch — kein automatischer Abbuchung"],
          ["🔄 Verlängern",    "Einfach ein Abo wählen — Daten bleiben vollständig erhalten"],
        ].map(([key, val]) => `
        <tr><td style="padding:10px 20px;border-bottom:1px solid #e8e4dc;">
          <strong style="color:#241c14;">${key}</strong><br>
          <span style="font-size:13px;color:#555;">${val}</span>
        </td></tr>`).join("")}
      </table>`,
  },
  invoice: {
    subject: "Rechnungen & Zahlungen — Claaro",
    body: `
      <p style="margin:0 0 16px;font-size:15px;color:#333;">
        Alle deine Rechnungen und Zahlungsdetails findest du direkt im Stripe-Kundenportal:
      </p>
      <ol style="margin:0 0 20px;padding-left:20px;font-size:14px;color:#555;line-height:2;">
        <li>Gehe zu <a href="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de"}/dashboard/konto#abo" style="color:#c84b2f;">Mein Konto → Abo &amp; Abrechnung</a></li>
        <li>Klicke auf <strong>"Abo verwalten"</strong></li>
        <li>Im Stripe-Portal findest du alle Rechnungen als PDF zum Download</li>
      </ol>
      <p style="margin:0;font-size:13px;color:#888;">
        Rechnungen werden automatisch nach jeder Zahlung an deine Registrierungs-E-Mail gesendet.
      </p>`,
  },
};

export async function sendSupportAutoReplyEmail(params: SupportAutoReplyParams): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const content = AUTO_REPLY_CONTENT[params.category];
  const name = params.customerName;

  const html = wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">
      Automatische Antwort
    </p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#241c14;">${content.subject}</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#333;">Hallo ${name},</p>
    ${content.body}
    <p style="margin:24px 0 0;font-size:13px;color:#999;line-height:1.5;">
      Falls deine Frage damit nicht beantwortet ist, antworte einfach auf diese E-Mail —
      wir melden uns innerhalb von 24 Stunden.
    </p>
  `);

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `Re: ${content.subject}`,
    html,
  });
  if (error) console.error("[claaro/email] Auto-reply error:", error);
}

// ─── 8. Admin notification (new unmatched support request) ───────────────────

export async function sendAdminNotificationEmail(params: {
  customerEmail: string;
  customerName: string;
  betreff: string;
  nachricht: string;
}): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const adminEmail = process.env.FEEDBACK_EMAIL ?? process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ?? "hallo@getclaaro.de";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de";

  const html = wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">
      Neue Support-Anfrage
    </p>
    <h1 style="margin:0 0 20px;font-size:22px;color:#241c14;">Unbearbeitete Kundenanfrage</h1>
    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:20px;">
      <tr><td style="padding:12px 20px;border-bottom:1px solid #e8e4dc;">
        <span style="font-size:12px;color:#888;">Von</span><br>
        <strong>${params.customerName}</strong> &lt;${params.customerEmail}&gt;
      </td></tr>
      <tr><td style="padding:12px 20px;border-bottom:1px solid #e8e4dc;">
        <span style="font-size:12px;color:#888;">Betreff</span><br>
        <strong>${params.betreff}</strong>
      </td></tr>
      <tr><td style="padding:12px 20px;">
        <span style="font-size:12px;color:#888;">Nachricht</span><br>
        <p style="margin:6px 0 0;font-size:14px;color:#333;white-space:pre-wrap;line-height:1.6;">${params.nachricht}</p>
      </td></tr>
    </table>
    ${btn(`${baseUrl}/dashboard/admin/support`, "Im Admin-Dashboard anzeigen", "#1e7a6b")}
  `);

  await resend.emails.send({
    from:    FROM,
    to:      adminEmail,
    subject: `[Support] Neue Anfrage von ${params.customerName}: ${params.betreff.slice(0, 60)}`,
    html,
  }).catch(() => {});
}

// ─── 9. Payment confirmation ──────────────────────────────────────────────────

export type PaymentConfirmationParams = {
  to: string;
  username?: string;
  planName: string;
  interval: "monatlich" | "jaehrlich";
  betrag: number;
};

export async function sendPaymentConfirmationEmail(params: PaymentConfirmationParams): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const name = params.username ?? "dort";
  const intervalLabel = params.interval === "jaehrlich" ? "jährlich" : "monatlich";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de";

  const html = wrap(`
    <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:1px;">
      Zahlungsbestätigung
    </p>
    <h1 style="margin:0 0 20px;font-size:26px;color:#241c14;">
      Abo aktiviert — willkommen, ${name}! 🎉
    </h1>
    <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.6;">
      Dein Claaro-Abo wurde erfolgreich aktiviert. Du hast vollen Zugriff auf alle Funktionen deines Plans.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f9f8f6;border-radius:6px;border:1px solid #e8e4dc;margin-bottom:28px;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e8e4dc;">
        <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Plan</span>
        <span style="font-size:15px;color:#241c14;font-weight:600;">${params.planName}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e8e4dc;">
        <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Abrechnung</span>
        <span style="font-size:15px;color:#241c14;">${intervalLabel}</span>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <span style="font-size:12px;color:#888;display:block;margin-bottom:2px;">Betrag</span>
        <span style="font-size:18px;color:#241c14;font-weight:700;">${formatCurrency(params.betrag)} / Monat zzgl. MwSt.</span>
      </td></tr>
    </table>

    ${btn(`${baseUrl}/dashboard`, "Zum Dashboard")}

    <p style="margin:20px 0 0;font-size:13px;color:#999;">
      Deine Rechnung erhältst du direkt von Stripe per E-Mail.
      Bei Fragen antworte einfach auf diese Nachricht.
    </p>
  `);

  const { error } = await resend.emails.send({
    from:    FROM,
    to:      params.to,
    subject: `✅ Claaro ${params.planName}-Abo aktiviert`,
    html,
  });
  if (error) console.error("[claaro/email] Payment confirmation error:", error);
}
