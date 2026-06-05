-- ============================================================
-- Claaro – Support-Anfragen (Migration 010)
-- Nicht-gematchte Kundenanfragen für Admin-Dashboard
-- ============================================================

CREATE TABLE IF NOT EXISTS support_anfragen (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email      text        NOT NULL,
  user_name       text        NOT NULL DEFAULT '',
  betreff         text        NOT NULL,
  nachricht       text        NOT NULL,
  kategorie       text,
  erstellt_am     timestamptz NOT NULL DEFAULT now(),
  bearbeitet      boolean     NOT NULL DEFAULT false,
  beantwortet_am  timestamptz
);

ALTER TABLE support_anfragen ENABLE ROW LEVEL SECURITY;

-- Kein öffentliches Lesen — nur über Service Role (Admin-API-Routen)
-- (kein SELECT-Policy für anon/authenticated)
