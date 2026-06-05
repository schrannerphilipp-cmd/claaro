-- ============================================================
-- Claaro – Tracking & Marketing-Einwilligung (Migration 011)
-- DSGVO-konform: nur mit explizitem Opt-in
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login              timestamptz,
  ADD COLUMN IF NOT EXISTS features_used           text[]       DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trial_activity_score    int          DEFAULT 0
                             CHECK (trial_activity_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS email_marketing_consent boolean      DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consent_at    timestamptz;

-- Trigger: last_login bei Update aktualisieren (z.B. aus API-Route)
-- (kein Trigger nötig — wird direkt via API geschrieben)
