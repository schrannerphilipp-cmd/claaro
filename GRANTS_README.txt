SUPABASE GRANTS — Anleitung zur manuellen Ausführung
=====================================================

Datei: supabase/migrations/008_explicit_grants.sql

Hintergrund:
  Ab Oktober 2026 entfernt Supabase den automatischen GRANT auf das public-Schema.
  Neue Tabellen erhalten dann keine Grants mehr ohne explizite Zuweisung.
  Diese Migration sichert alle bestehenden Tabellen jetzt schon korrekt ab.

Anleitung:
  1. Öffne das Supabase Dashboard deines Projekts
     https://supabase.com/dashboard/project/<dein-projekt>

  2. Navigiere zu: SQL Editor (linke Seitenleiste)

  3. Öffne die Datei: supabase/migrations/008_explicit_grants.sql
     (z.B. in VS Code oder einem Texteditor)

  4. Kopiere den gesamten Inhalt der Datei

  5. Füge ihn in das SQL-Editor-Eingabefeld ein

  6. Klicke auf "Run"

  7. Prüfe, dass keine Fehler aufgetreten sind
     (GRANT-Statements geben bei Erfolg kein Ergebnis zurück — das ist normal)

Tabellen-Übersicht (16 Tabellen gesichert):
  PUBLIC  (anon + authenticated):  public_testimonials
  ANON INSERT:                     feedback
  AUTHENTICATED ONLY:              profiles, company_settings, kunden, angebote,
                                   chat_messages, chat_read_status,
                                   employees, availability, shift_plans, shifts,
                                   vacations, shift_swaps, notifications_log

Hinweis:
  GRANTs und RLS-Policies arbeiten zusammen. Selbst wenn ein GRANT vorhanden ist,
  blockiert eine fehlende oder restriktive RLS-Policy den Zugriff auf Zeilenebene.
  Die bestehenden RLS-Policies in den Migrations 001–006 bleiben unverändert.
