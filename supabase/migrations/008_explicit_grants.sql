-- Migration 008: Explizite GRANTs für alle Tabellen (Supabase Policy Change Mai 2026)
--
-- Hintergrund: Ab Oktober 2026 erhalten neue Tabellen im public-Schema keine
-- automatischen Grants mehr (Supabase entfernt den Standard-GRANT auf public).
-- Diese Migration sichert alle bestehenden Tabellen explizit ab, damit das
-- Verhalten nach dem Breaking Change identisch bleibt.
--
-- Anwenden: Supabase Dashboard → SQL Editor → Inhalt dieser Datei einfügen → Run
-- Idempotent: kann mehrfach ausgeführt werden, da GRANT keine Fehler bei
-- bereits vorhandenen Rechten wirft.
-- ============================================================

-- Schema-Zugriff für beide Rollen sicherstellen
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ── Öffentliche Tabellen (anon darf SELECT) ────────────────────────────────
-- Die RLS-Policy "public_read_approved" filtert zusätzlich auf
-- is_approved = true AND rating >= 4 — GRANT allein genügt nicht.
GRANT SELECT                           ON TABLE public.public_testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.public_testimonials TO authenticated;

-- feedback: Kontaktformular wird ggf. ohne Login abgesendet (Policy: insert with check(true))
GRANT INSERT                           ON TABLE public.feedback TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.feedback TO authenticated;

-- ── Private Tabellen (nur authenticated) ───────────────────────────────────

-- Nutzerprofile (RLS: SELECT = alle authenticated, write = nur Owner)
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.profiles TO authenticated;

-- Firmendaten & Abo-Infos (RLS: nur eigene Zeile via hauptaccount_id)
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.company_settings TO authenticated;

-- Kundenstamm (RLS: nur eigene Zeilen via user_id)
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.kunden TO authenticated;

-- Angebote (RLS: nur eigene Zeilen via user_id)
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.angebote TO authenticated;

-- Firmen-Chat (RLS: read = alle authenticated, write = nur Sender)
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.chat_messages TO authenticated;

-- Chat-Gelesen-Status (RLS: nur eigene Zeile via user_id)
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.chat_read_status TO authenticated;

-- Dienstplan-Modul (RLS: hauptaccount_id = auth.uid() bzw. employee auth_user_id)
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.shift_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.shifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.vacations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.shift_swaps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE   ON TABLE public.notifications_log TO authenticated;
