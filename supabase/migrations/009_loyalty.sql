-- ============================================================
-- Claaro – Loyalty-Programm (Migration 009)
-- Silber ab Monat 13, Gold ab Monat 30, Referral-Programm
-- ============================================================

-- Stripe-IDs in company_settings nachziehen
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- loyalty_status — eine Zeile pro registriertem User
CREATE TABLE IF NOT EXISTS loyalty_status (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status             text        NOT NULL DEFAULT 'standard'
                                   CHECK (status IN ('standard', 'silber', 'gold')),
  status_since       timestamptz NOT NULL DEFAULT now(),
  discount_applied   boolean     NOT NULL DEFAULT false,
  referral_code      text        UNIQUE NOT NULL,
  referral_count     int         NOT NULL DEFAULT 0,
  free_month_pending boolean     NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE loyalty_status ENABLE ROW LEVEL SECURITY;

-- User kann nur seinen eigenen Eintrag lesen
CREATE POLICY "own_loyalty_read" ON loyalty_status
  FOR SELECT USING (user_id = auth.uid());

-- referrals — wer hat wen geworben
CREATE TABLE IF NOT EXISTS referrals (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_email    text        NOT NULL,
  referred_user_id  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  referral_code     text        NOT NULL,
  status            text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'converted', 'rewarded')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_email)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Empfehler sieht seine eigenen Referrals
CREATE POLICY "own_referrals_read" ON referrals
  FOR SELECT USING (referrer_id = auth.uid());
