# Claaro – Privatsphäre & Datenschutz: Offene Aufgaben

Stand: 2026-06-05

Diese Datei dokumentiert was noch manuell einzurichten ist,
um persönliche Daten vollständig von der öffentlichen Website zu trennen.

---

## Dringend (öffentlich sichtbar)

### [ ] Geschäftsnummer einrichten (ersetzt private Telefonnummer)

**Anbieter:** Sipgate.de
- URL: https://www.sipgate.de/basic (Basic-Tarif ist kostenlos)
- Einrichten: Registrierung → Rufnummer wählen → App oder Weiterleitung einrichten
- Danach in `src/app/impressum/page.tsx` den Kommentar `{/* GESCHAEFTSNUMMER_EINTRAGEN */}` durch echte Nummer ersetzen

Alternativen:
- **Vonage** (vonage.com) — ab 0 €/Monat
- **easybell.de** — deutsche Anbieter, ab ~3 €/Monat

---

### [ ] Geschäftliche E-Mail `hallo@getclaaro.de` einrichten

**Option A — Google Workspace** (empfohlen)
- URL: workspace.google.com
- Kosten: ab 6 €/Nutzer/Monat
- Anleitung: Domain `getclaaro.de` verifizieren → MX-Records beim Domain-Anbieter setzen

**Option B — Proton Mail Business**
- URL: proton.me/business
- Kosten: ab 6,99 €/Nutzer/Monat
- Besonders datenschutzfreundlich (Ende-zu-Ende-Verschlüsselung)

**Option C — Resend Inboxing** (falls Resend für Transaktionsmails verwendet wird)
- Resend unterstützt aktuell nur Outbound — separate Inbox-Lösung nötig

Nach Einrichtung:
- `FEEDBACK_EMAIL` in `.env.local` und Vercel auf `hallo@getclaaro.de` setzen
- Resend-Domain-Verifizierung für `getclaaro.de` abschließen

---

### [ ] Virtuelle Geschäftsadresse (ersetzt Privatadresse im Impressum)

Aktuell steht im Impressum/Datenschutz/AGB die Privatadresse.
§5 TMG verlangt eine ladungsfähige Postadresse — das kann auch ein Postfach oder Büroservice sein.

**Anbieter (Deutschland):**

| Anbieter | Kosten | Besonderheit |
|---|---|---|
| **Clevver.io** | ab 9,90 €/Monat | Adresse in München, Berlin etc. |
| **Regus** | ab 20–30 €/Monat | Prestige-Adressen deutschlandweit |
| **Anwalt-Impressum** | ca. 10–20 €/Monat | Rechtsanwalt nimmt Zustellungen entgegen |
| **IHK-Postfach** | kostenlos (Mitglied) | Nur für IHK-Mitglieder |

Nach Einrichtung — in diesen drei Dateien die Adresse aktualisieren:
1. `src/app/impressum/page.tsx` — Suche: `GESCHAEFTSADRESSE_EINTRAGEN`
2. `src/app/datenschutz/page.tsx` — Suche: `GESCHAEFTSADRESSE_EINTRAGEN`
3. `src/app/agb/page.tsx` — kein direkter Eintrag (verweist auf Impressum)

---

## Bereits erledigt (Codebase)

- [x] Persönliche Gmail (`schranner.philipp@gmail.com`) aus Server-Code entfernt → `hallo@getclaaro.de`
- [x] AGB-Byline: Privatadresse entfernt, nur noch `claaro · hallo@getclaaro.de · getclaaro.de`
- [x] AGB §11: Ortsangabe durch Verweis auf Impressum ersetzt
- [x] `FEEDBACK_EMAIL` env var als zentraler Konfigurationspunkt etabliert
- [x] Telefonnummer-Platzhalter `{/* GESCHAEFTSNUMMER_EINTRAGEN */}` im Impressum eingefügt
- [x] `NEXT_PUBLIC_GA4_ID` und `NEXT_PUBLIC_META_PIXEL_ID` als leere Platzhalter in `.env.local`

---

## Was NICHT geändert werden darf (DSGVO/TMG-Pflicht)

| Element | Gesetzliche Grundlage | Wo |
|---|---|---|
| Name "Philipp Schranner" | §5 TMG (Impressumspflicht) | impressum, datenschutz |
| Ladungsfähige Postadresse | §5 TMG | impressum, datenschutz |
| Name als Verantwortlicher | Art. 4 Nr. 7 DSGVO | datenschutz |
| Kontakt-E-Mail | §5 TMG | impressum |

---

## Rechtliche Einschätzung

Das deutsche Impressumsrecht (§5 TMG) erfordert zwingend:
- ✅ Vollständiger Name (natürliche oder juristische Person)
- ✅ Ladungsfähige Anschrift (kein Postfach allein — aber Büroservice ist erlaubt)
- ✅ E-Mail-Adresse
- ❌ Telefonnummer (optional, nicht Pflicht)

Ein Einzelunternehmen kann im Impressum unter dem Produktnamen ("claaro")
auftreten, muss aber den bürgerlichen Namen des Inhabers angeben.
