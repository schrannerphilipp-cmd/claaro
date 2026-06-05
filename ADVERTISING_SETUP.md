# Claaro – Advertising & E-Mail-Marketing Setup

## Überblick

Claaro nutzt Resend für transaktionale E-Mails und unterstützt optionale Werbetracking-Tools
(Meta Pixel, Google Analytics 4) — immer nur nach expliziter Cookie-Einwilligung (DSGVO-konform).

---

## ENV-Variablen die noch gesetzt werden müssen

| Variable | Wo holen | Beispielwert |
|---|---|---|
| `NEXT_PUBLIC_GA4_ID` | Google Analytics → Admin → Datenstrom → Mess-ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Business Manager → Events Manager → Pixel-ID | `1234567890123456` |
| `FEEDBACK_EMAIL` | Admin-E-Mail für Support-Benachrichtigungen | `hallo@getclaaro.de` |

**Vercel:** Einstellungen → Environment Variables → Produktion.

---

## Was ist erlaubt (DSGVO-konform)

### E-Mail-Marketing
- ✅ **Transaktionale E-Mails** (Willkommen, Trial-Reminder, Mahnung): Immer erlaubt — notwendig für die Vertragserfüllung
- ✅ **Marketing-E-Mails** (Newsletter, Angebote): Nur an User mit `email_marketing_consent = true` (Opt-in beim Registrieren, nicht vorausgewählt)
- ✅ **Re-Aktivierungsmail** (Trial abgelaufen): Erlaubt — Bestandskundenbeziehung, Art. 6 Abs. 1 lit. b DSGVO

### Werbeanzeigen
- ✅ **Retargeting** — nur nach explizitem Marketing-Cookie-Consent (Kategorie "Marketing" im Cookie-Banner)
- ✅ **Lookalike Audiences** — aus bestehenden Kunden-E-Mails erstellt (Opt-in vorausgesetzt)
- ✅ **Custom Audiences** in Meta — aus eigenem CRM/Supabase exportiert

### Analytics
- ✅ **Google Analytics 4** — nur nach Analytics-Cookie-Consent, mit IP-Anonymisierung

---

## Was ist verboten

- ❌ Retargeting ohne Cookie-Consent → DSGVO-Verstoß (Bußgeld bis 20 Mio. € / 4% Jahresumsatz)
- ❌ E-Mail-Listen kaufen → Spam-Regulierung (CAN-SPAM, DSGVO)
- ❌ Meta Pixel ohne Consent → Schrems II Urteil (US-Datentransfer)
- ❌ User-Daten ohne Rechtsgrundlage an Meta/Google weitergeben
- ❌ Pre-checked Marketing-Consent Checkboxen → DSGVO-Verstoß

---

## Meta Business Manager: Custom Audience erstellen

1. **Meta Business Manager** → events.facebook.com/manager
2. **Audiences** → Neue Audience erstellen → Custom Audience
3. Quelle: **Kundenliste**
4. CSV mit E-Mail-Adressen hochladen (nur User mit `email_marketing_consent = true`)

```sql
-- Supabase: E-Mails für Lookalike-Export (nur Opt-in)
SELECT au.email
FROM auth.users au
JOIN profiles p ON p.id = au.id
WHERE p.email_marketing_consent = true;
```

5. **Lookalike Audience** erstellen → Zielland wählen → Ähnliche Nutzer finden

---

## Consent-System (technische Implementierung)

```typescript
// Consent abrufen
import { getConsent } from "@/lib/consent";
const consent = getConsent();
// { necessary: true, analytics: boolean, marketing: boolean }

// Meta Pixel nur senden wenn Marketing-Consent
if (consent?.marketing && typeof window.fbq === "function") {
  window.fbq("track", "Lead", { value: 59, currency: "EUR" });
}

// GA4 Event nur senden wenn Analytics-Consent
if (consent?.analytics && typeof window.gtag === "function") {
  window.gtag("event", "sign_up", { method: "email" });
}
```

---

## Trial-Activity-Score (Segmentierung)

Die `trial_activity_score`-Spalte (0–100) in `profiles` ermöglicht zielgenaue Segmente:

| Score | Bedeutung | Empfohlene Aktion |
|---|---|---|
| 0–20 | Inaktiver Trial | Re-Engagement E-Mail nach Tag 5 |
| 21–60 | Gelegentlicher Nutzer | Feature-Tipps per E-Mail |
| 61–100 | Aktiver Nutzer | Upgrade-Hinweis nach Woche 3 |

Scoring-Logik (Beispiel):
```sql
-- Beispiel: Score aus features_used Länge berechnen
UPDATE profiles
SET trial_activity_score = LEAST(100, COALESCE(array_length(features_used, 1), 0) * 15)
WHERE trial_ends_at > now();
```

---

## Resend-Domain-Verifizierung

1. resend.com → Domains → Add Domain → `getclaaro.de`
2. DNS-Records bei deinem Hoster eintragen (SPF, DKIM, DMARC)
3. `EMAIL_FROM="Claaro <hallo@getclaaro.de>"` in Vercel setzen
4. Test-E-Mail senden und Zustellung prüfen

---

*Zuletzt aktualisiert: 2026-06-05*
