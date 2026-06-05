# Claaro – Supabase RLS Status
Stand: 2026-06-05

## Übersicht: alle 19 Tabellen haben RLS aktiviert ✅

| Tabelle | RLS | Policies | Zugriff |
|---|---|---|---|
| `angebote` | ✅ ON | `own_angebote` | SELECT/INSERT/UPDATE/DELETE → nur `user_id = auth.uid()` |
| `availability` | ✅ ON | `employee_own_availability` | Nur über `employees.auth_user_id = auth.uid()` |
| `chat_messages` | ✅ ON | `chat_read`, `chat_insert`, `chat_update_own` | Read: alle auth; Write: nur eigener `sender_id` |
| `chat_read_status` | ✅ ON | `read_status_own` | Nur `user_id = auth.uid()` |
| `company_settings` | ✅ ON | `own_company_settings` | Nur `hauptaccount_id = auth.uid()` |
| `employees` | ✅ ON | `hauptaccount_employees` | Nur `hauptaccount_id = auth.uid()` |
| `feedback` | ✅ ON | `insert_feedback`, `own_feedback` | INSERT: public (Kontaktformular); SELECT: eigene via hauptaccount_id |
| `kunden` | ✅ ON | `own_kunden` | Nur `user_id = auth.uid()` |
| `loyalty_status` | ✅ ON | `own_loyalty_read` | SELECT: nur eigene Zeile; INSERT/UPDATE: via Service Role (API) |
| `notifications_log` | ✅ ON | `hauptaccount_notifications` | Nur über Employees des Hauptaccounts |
| `profiles` | ✅ ON | `profiles_read`, `profiles_write` | Read: alle authenticated; Write: nur eigene Zeile |
| `public_testimonials` | ✅ ON | `public_read_approved` | SELECT: `is_approved=true AND rating>=4` (öffentlich); Write: verboten |
| `referrals` | ✅ ON | `own_referrals_read` | SELECT: nur als Referrer; INSERT: via Service Role (API) |
| `shift_plans` | ✅ ON | `hauptaccount_shift_plans` | Nur `hauptaccount_id = auth.uid()` |
| `shift_swaps` | ✅ ON | `employee_own_swaps` | Nur beteiligte Mitarbeiter und Hauptaccount |
| `shifts` | ✅ ON | `hauptaccount_shifts`, `employee_own_shifts` | Admin: alle Schichten; Mitarbeiter: nur eigene |
| `support_anfragen` | ✅ ON | (keine public policy) | Nur über Service Role — kein direkter Client-Zugriff |
| `vacations` | ✅ ON | `employee_own_vacations` | Nur über `employees.auth_user_id = auth.uid()` |

## Hinweise

### Service Role Bypass
Die Server-API-Routen (`src/lib/supabase.ts → createServerClient()`) verwenden den **Service Role Key**,
der alle RLS-Policies umgeht. Deshalb müssen die API-Routen selbst Auth-Checks implementieren.
→ Alle kritischen API-Routen haben Auth-Guards (`getRequestUser()` + 401/403) seit PROMPT 4.

### Fehlende Policies (akzeptabel)
- `loyalty_status`: INSERT/UPDATE nur via Service Role — korrekt, da der Client nie direkt schreibt
- `referrals`: INSERT nur via Service Role — korrekt
- `support_anfragen`: Keine Client-Policy — nur Admin-API liest/schreibt

### Explizite GRANTs
Migration `008_explicit_grants.sql` setzt explizite `GRANT SELECT/INSERT/...`
für alle Tabellen auf `anon` und `authenticated` Rollen (Supabase Policy Change ab Oktober 2026).
→ Muss noch im Supabase Dashboard ausgeführt werden (siehe `GRANTS_README.txt`).
