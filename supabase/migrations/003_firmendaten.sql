-- ============================================================
-- Claaro – Firmendaten: zusätzliche Spalten für company_settings
-- ============================================================

alter table company_settings
  add column if not exists strasse      text,
  add column if not exists plz          text,
  add column if not exists ort          text,
  add column if not exists telefon      text,
  add column if not exists email        text,
  add column if not exists website      text,
  add column if not exists ust_id_nr    text;
