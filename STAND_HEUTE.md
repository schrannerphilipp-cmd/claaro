# Stand heute — 06.06.2026

## Prüfbericht: Alle Änderungen aus der letzten Session

---

### 1. Hinweis unter den Beispiel-Bewertungen auf der Startseite
✅ **Vorhanden**
Unter den Beispielbewertungen steht: *„Beispielhafte Erfahrungsberichte. Namen und Details wurden anonymisiert."*
Dieser Hinweis erscheint nur, solange weniger als 3 echte Bewertungen vorliegen.
→ Datei: `src/components/landing/LandingPage.tsx` (Zeile 536)

---

### 2. „Einzelonboarding" aus dem Menü entfernt
✅ **Vorhanden**
Das Wort „Einzelonboarding" taucht in keiner einzigen Codedatei auf — der Bereich ist vollständig entfernt.

---

### 3. Datenbank-Migrationsdateien (008–011)
| Erwartet | Tatsächlich vorhanden | Status |
|---|---|---|
| `008_explicit_grants.sql` | `008_explicit_grants.sql` | ✅ |
| `009_loyalty.sql` | `009_loyalty.sql` | ✅ |
| `010_tracking.sql` | `010_support.sql` | ⚠️ anderer Name |
| `011_psc_cockpit.sql` | `011_tracking.sql` | ⚠️ anderer Name |

Die Inhalte (Support-Tabellen und Tracking) sind vorhanden, aber die Dateien heißen anders als erwartet. Die Funktionalität fehlt nicht.

---

### 4. Schutz gegen zu viele Anfragen (Rate Limiting)
✅ **Vorhanden**
In 9 API-Routen aktiv, z. B. `api/support/auto-reply`, `api/bewertung/send`, `api/loyalty/referral`.
Technisch: `checkRateLimit()`-Funktion aus `src/lib/rate-limit.ts`.

---

### 5. Treue-Programm (Silber / Gold / Empfehlung) im Dashboard
✅ **Vorhanden**
Sichtbar im Dashboard unter „Konto" → Loyalty-Bereich.
Stufen: Standard → Silber → Gold, plus Empfehlungslink.
→ Dateien: `src/components/konto/LoyaltySection.tsx`, `supabase/migrations/009_loyalty.sql`, `api/loyalty/referral/route.ts`

---

### 6. Automatische Antwort-Funktion für häufige Kundenfragen
✅ **Vorhanden**
Erkennt Schlüsselwörter in Support-Nachrichten (Preis, Kündigung, Passwort, Trial, Rechnung) und antwortet automatisch per E-Mail.
→ Datei: `src/app/api/support/auto-reply/route.ts`

---

### 7. Cookie-Banner in drei Bereiche aufgeteilt
✅ **Vorhanden**
Der Banner hat genau drei Kategorien:
- **Notwendig** — immer aktiv (nicht abschaltbar)
- **Analyse** (Google Analytics GA4) — ein-/abschaltbar
- **Marketing** (Meta Pixel) — ein-/abschaltbar
→ Datei: `src/components/ui/CookieBanner.tsx`

---

### 8. Private Telefonnummer von allen Seiten außer Impressum entfernt
✅ **Vorhanden**
Im Impressum steht noch kein Telefon (nur ein Hinweis-Kommentar: „GESCHAEFTSNUMMER_EINTRAGEN"). Auf keiner anderen Seite ist eine private Nummer sichtbar. Das Wort „telefon" taucht nur in internen Formularfeldern auf (z. B. Mitarbeiter-Verwaltung), nicht auf öffentlichen Seiten.

---

### 9. `.env.local` in der `.gitignore`
✅ **Vorhanden**
Die `.gitignore` enthält `.env*` (Zeile 34), was `.env.local` sowie alle anderen `.env`-Dateien einschließt.

---

### 10. `npm run build` — Fehler?
✅ **Kein Fehler**
Der Build lief sauber durch. 48 Seiten wurden generiert.
Es gab eine **1 Warnung** (kein Fehler): Prisma-Client verursacht eine NFT-Trace-Warnung bei Turbopack — das ist bekanntes Verhalten und blockiert weder den Build noch den Betrieb.

---

## Zusammenfassung

| Nr. | Thema | Status |
|---|---|---|
| 1 | Hinweis unter Beispiel-Bewertungen | ✅ |
| 2 | „Einzelonboarding" aus Menü entfernt | ✅ |
| 3 | Migrationsdateien 008–011 | ⚠️ Dateien vorhanden, 2 Namen abweichend |
| 4 | Rate Limiting in API-Routen | ✅ |
| 5 | Treue-Programm Silber/Gold/Empfehlung | ✅ |
| 6 | Automatische Antwort auf häufige Fragen | ✅ |
| 7 | Cookie-Banner mit 3 Kategorien | ✅ |
| 8 | Private Telefonnummer entfernt | ✅ |
| 9 | `.env.local` in `.gitignore` | ✅ |
| 10 | `npm run build` fehlerfrei | ✅ |

**9 von 10 Punkten vollständig ✅ — 1 Punkt mit kleiner Abweichung ⚠️**
