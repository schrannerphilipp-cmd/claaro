# Supabase Auth E-Mails: Absender + Templates

## Aktueller Stand

| E-Mail-Typ | Absender | Wo konfiguriert |
|---|---|---|
| Willkommen, Zahlung, Mahnungen, Bewertung… | `Claaro <hallo@getclaaro.de>` ✅ | `src/lib/email.ts` via Resend |
| Mitarbeiter-Einladung (inviteUserByEmail) | `noreply@mail.supabase.io` ⚠️ | Supabase Dashboard |
| Passwort-Reset | `noreply@mail.supabase.io` ⚠️ | Supabase Dashboard |
| E-Mail-Bestätigung bei Registrierung | `noreply@mail.supabase.io` ⚠️ | Supabase Dashboard |

---

## Schritt 1 — Eigenen SMTP einrichten (Resend)

Damit alle Auth-Mails von `hallo@getclaaro.de` kommen:

1. **Supabase Dashboard** → Projekt `eywrvofirwoembguqjmt`
2. **Project Settings → Authentication → SMTP Settings**
3. Toggle **Enable Custom SMTP** aktivieren
4. Eintragen:

| Feld | Wert |
|---|---|
| Sender name | `Claaro` |
| Sender email | `hallo@getclaaro.de` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | deinen Resend API-Key (`re_PRJhwu...`) |

5. **Save** klicken → Supabase verschickt eine Test-Mail zur Bestätigung

> Voraussetzung: Domain `getclaaro.de` muss in Resend unter **Domains** verifiziert sein (DKIM + SPF).

---

## Schritt 2 — E-Mail-Templates anpassen

**Supabase Dashboard → Authentication → Email Templates**

Für jeden Typ: Betreff und HTML-Body eintragen.

---

### Template: Mitarbeiter-Einladung (Invite User)

**Betreff:**
```
Du wurdest zu Claaro eingeladen
```

**HTML-Body:**
```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Claaro Einladung</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">

        <!-- Header -->
        <tr><td style="background:#241c14;padding:24px 40px;">
          <span style="font-size:20px;font-weight:700;color:#c84b2f;letter-spacing:-0.5px;">claaro</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#241c14;">Du wurdest eingeladen 👋</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            Dein Arbeitgeber hat dich zu Claaro eingeladen — der Software für
            Dienstplanung, Compliance und Betriebsorganisation.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.6;">
            Klicke auf den Button, um dein Konto einzurichten und dein Passwort
            festzulegen. Der Link ist <strong>24 Stunden gültig</strong>.
          </p>

          <!-- Button -->
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#c84b2f;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                Einladung annehmen →
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#999;">
            Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#c84b2f;word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f8f6;padding:18px 40px;border-top:1px solid #e8e4dc;">
          <p style="margin:0;font-size:12px;color:#aaa;">
            Diese Einladung wurde über Claaro versendet · <a href="https://getclaaro.de" style="color:#aaa;">getclaaro.de</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

### Template: Passwort-Reset (Reset Password)

**Betreff:**
```
Dein Claaro-Passwort zurücksetzen
```

**HTML-Body:**
```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Passwort zurücksetzen</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">

        <!-- Header -->
        <tr><td style="background:#241c14;padding:24px 40px;">
          <span style="font-size:20px;font-weight:700;color:#c84b2f;letter-spacing:-0.5px;">claaro</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#241c14;">Passwort zurücksetzen</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.
            Klicke auf den Button, um ein neues Passwort festzulegen.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.6;">
            Der Link ist <strong>1 Stunde gültig</strong>. Falls du keine
            Anfrage gestellt hast, ignoriere diese E-Mail.
          </p>

          <!-- Button -->
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#c84b2f;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                Neues Passwort festlegen →
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#999;">
            Falls der Button nicht funktioniert, kopiere diesen Link:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#c84b2f;word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f8f6;padding:18px 40px;border-top:1px solid #e8e4dc;">
          <p style="margin:0;font-size:12px;color:#aaa;">
            Claaro · <a href="https://getclaaro.de" style="color:#aaa;">getclaaro.de</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

### Template: E-Mail-Bestätigung (Confirm Signup)

**Betreff:**
```
Bitte bestätige deine E-Mail-Adresse
```

**HTML-Body:**
```html
<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>E-Mail bestätigen</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">

        <!-- Header -->
        <tr><td style="background:#241c14;padding:24px 40px;">
          <span style="font-size:20px;font-weight:700;color:#c84b2f;letter-spacing:-0.5px;">claaro</span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 16px;font-size:22px;color:#241c14;">Fast geschafft! ✉️</h2>
          <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
            Bitte bestätige deine E-Mail-Adresse, um deinen kostenlosen
            30-Tage-Test zu starten.
          </p>

          <!-- Button -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#c84b2f;border-radius:8px;">
              <a href="{{ .ConfirmationURL }}"
                 style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">
                E-Mail bestätigen →
              </a>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;color:#555;line-height:1.6;">
            Nach der Bestätigung kannst du dich direkt einloggen und loslegen.
          </p>
          <p style="margin:0;font-size:13px;color:#999;">
            Falls der Button nicht funktioniert:<br>
            <a href="{{ .ConfirmationURL }}" style="color:#c84b2f;word-break:break-all;">{{ .ConfirmationURL }}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9f8f6;padding:18px 40px;border-top:1px solid #e8e4dc;">
          <p style="margin:0;font-size:12px;color:#aaa;">
            Claaro · <a href="https://getclaaro.de" style="color:#aaa;">getclaaro.de</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## Schritt 3 — Passwort für Test-Mitarbeiter setzen

Falls ein Testmitarbeiter keine Einladungsmail bekommen hat oder der Link
abgelaufen ist, gibt es zwei Wege:

### Option A — Supabase Dashboard (einfachste Methode)

1. **Supabase Dashboard** → Authentication → Users
2. Testmitarbeiter suchen (nach E-Mail filtern)
3. Auf den Nutzer klicken → **Send Password Reset** → Zurücksetzen-Mail wird zugestellt

### Option B — Passwort direkt setzen (über die Supabase Admin API)

```bash
curl -X PUT \
  "https://eywrvofirwoembguqjmt.supabase.co/auth/v1/admin/users/<USER_UUID>" \
  -H "apikey: <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"password": "NeuesPasswort123!"}'
```

Die `USER_UUID` findest du im Supabase Dashboard → Authentication → Users → Spalte „UUID".  
Den `SUPABASE_SERVICE_ROLE_KEY` findest du in deiner `.env.local`.

### Option C — Im Terminal direkt (Node-Skript)

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://eywrvofirwoembguqjmt.supabase.co',
  '<SUPABASE_SERVICE_ROLE_KEY>',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
s.auth.admin.updateUserById('<USER_UUID>', { password: 'NeuesPasswort123!' })
  .then(r => console.log(r));
"
```

---

## Checkliste

- [ ] Domain `getclaaro.de` in Resend verifiziert (DKIM + SPF)
- [ ] Custom SMTP in Supabase eingetragen (smtp.resend.com)
- [ ] Template „Invite" eingefügt + gespeichert
- [ ] Template „Reset Password" eingefügt + gespeichert
- [ ] Template „Confirm Signup" eingefügt + gespeichert
- [ ] Test-Einladung verschickt und geprüft ob Absender korrekt ist
