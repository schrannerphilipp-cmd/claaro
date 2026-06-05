# Claaro – Security Report
Stand: 2026-06-05 | Tester: Claude Sonnet 4.6

---

## Executive Summary

Claaro hat nach 12 Entwicklungs-Prompts einen soliden Sicherheitsstand erreicht.
Alle kritischen Schwachstellen wurden behoben. Es gibt keine kritischen oder hohen
Sicherheitslücken im Anwendungscode. Zwei moderate npm-Schwachstellen betreffen
ausschließlich Next.js-interne Abhängigkeiten ohne verfügbaren Fix.

**Gesamturteil: 🟡 LAUNCH-READY mit Vorbehalten** (Details: TESTBERICHT.md)

---

## 1. npm audit

```
critical: 0
high:     0
moderate: 2
low:      0
```

### Moderate: PostCSS XSS (GHSA-qx2v-qp2m-jg93)
- **Paket**: `postcss < 8.5.10` (in `next/node_modules/postcss`)
- **Betroffen**: Next.js 9.3.4-canary – 16.3.0-canary.5
- **Auswirkung**: XSS über `</style>` in CSS-Stringify-Output — nur bei untrusted CSS-Input relevant
- **Fix**: `npm audit fix --force` würde Next.js auf 9.3.3 downgraden (breaking change) → **nicht empfohlen**
- **Risiko für Claaro**: **Niedrig** — claaro verarbeitet keinen user-supplied CSS-Input
- **Status**: Akzeptiert bis Next.js 16.3.0-stable veröffentlicht

---

## 2. Hardcodierte Secrets

| Bereich | Befund | Status |
|---|---|---|
| `src/` Quellcode | Kein Stripe-Key, kein Resend-Key, kein SUPABASE_SERVICE_ROLE_KEY | ✅ Clean |
| `.env.local` | Alle Secrets, in `.gitignore` (Pattern: `.env*`) | ✅ Geschützt |
| `NEXT_PUBLIC_` Variablen | Nur anon-sichere Werte (Anon-Key, Publishable Key, Domain) | ✅ OK |
| `NEXT_PUBLIC_DEV_TOGGLE=true` | In `.env.local` (gitignored) — muss in Vercel Production NICHT gesetzt sein | ⚠️ Prüfen |
| `NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID` | UUID, öffentlich sichtbar — kein Secret, aber exponiert | ⚠️ Akzeptiert |

---

## 3. API-Routen Sicherheitsmatrix

### Öffentliche Routen (kein Auth, by design)

| Route | Schutz | Begründung |
|---|---|---|
| `GET /api/bewertung/track/[token]` | UUID-Validierung + URL-Prüfung | Token-Link für Kunden-Redirect |
| `GET /api/payment/[token]` | Prisma-Lookup (Token muss existieren) | Zahlungslink für Endkunden |
| `POST /api/feedback` | Rate Limit 10/min, Honeypot | Öffentliches Kontaktformular |
| `POST /api/loyalty/referral` | Rate Limit 5/min, E-Mail-Validierung | Registrierung ohne Session |
| `POST /api/support/auto-reply` | Rate Limit 5/min, Honeypot | Support-Formular |
| `POST /api/stripe/webhook` | Stripe-Signatur-Verifikation | Stripe Server-to-Server |

### Auth-geschützte Routen

| Route | Auth-Typ | Status |
|---|---|---|
| `POST /api/stripe/checkout` | Supabase Session + 401 | ✅ |
| `POST /api/bewertung/send` | `getRequestUser()` + 401 | ✅ |
| `GET/POST /api/dienstplan/*` | `getRequestUser()` + IDOR-Check | ✅ |
| `POST /api/email/*` | `getRequestUser()` + 401 | ✅ |
| `POST /api/loyalty/check` | `getRequestUser()` + 401 | ✅ |
| `GET/PATCH /api/support/anfragen` | `getRequestUser()` + Admin-Check | ✅ |

### Deaktivierte Routen
| Route | Status |
|---|---|
| `POST /api/dienstplan/ki-erstellen` | Gibt 503 zurück (Claude API deaktiviert) |

---

## 4. NEXT_PUBLIC_ Variablen — Audit

| Variable | Enthält | Risiko |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Domain (`getclaaro.de`) | Kein Risiko ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Anon-sicher (RLS schützt) ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | JWT Anon Token | Anon-sicher (RLS schützt) ✅ |
| `NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID` | UUID des Inhabers | Niedrig — UUID kein Secret ⚠️ |
| `NEXT_PUBLIC_DEV_TOGGLE` | `"true"` (nur lokal) | Nicht in Prod setzen ⚠️ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | Designiert öffentlich ✅ |
| `NEXT_PUBLIC_GA4_ID` | Leer (`""`) | Kein Risiko ✅ |
| `NEXT_PUBLIC_META_PIXEL_ID` | Leer (`""`) | Kein Risiko ✅ |

---

## 5. Datenschutz

| Bereich | Befund | Status |
|---|---|---|
| Persönliche Gmail in Quellcode | Entfernt (→ `hallo@getclaaro.de`) | ✅ Behoben |
| Privatadresse öffentlich | Nur in Pflichtseiten (Impressum/Datenschutz) | ✅ DSGVO-konform |
| Name in AGB-Byline | Entfernt — nur noch "claaro" | ✅ Behoben |
| Cookie-Consent vor Tracking | Cookie-Banner mit 3 Kategorien implementiert | ✅ |
| Marketing-Consent Checkbox | Opt-in bei Registrierung (nicht vorausgewählt) | ✅ DSGVO-konform |

---

## 6. Offene Sicherheitsempfehlungen

### Hoch (vor Launch)
- [ ] `NEXT_PUBLIC_DEV_TOGGLE` aus Vercel Production-Env entfernen/sicherstellen
- [ ] `DATABASE_URL` in Vercel auf PostgreSQL (nicht SQLite) setzen
- [ ] Migration `008_explicit_grants.sql` im Supabase Dashboard ausführen
- [ ] Migration `009_loyalty.sql`, `010_support.sql`, `011_tracking.sql` ausführen

### Mittel (nach Launch)
- [ ] `NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID` durch server-only Env-Var ersetzen
- [ ] Rate Limiter für Multi-Region auf Upstash Redis upgraden
- [ ] Stripe webhook idempotency keys implementieren
- [ ] Content Security Policy (CSP) Header in next.config.ts

### Niedrig
- [ ] PostCSS-Vulnerability: Warten auf Next.js 16.3.0-stable
- [ ] `console.log` im Stripe-Webhook in Production-Logging-Service (Axiom/Sentry) integrieren
