-- ============================================================
-- Claaro – 30-Tage Testzeitraum (vollständig)
-- ============================================================

-- 1) trial_ends_at Spalte auf profiles ----------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz
  DEFAULT (now() + interval '30 days');

-- Bestehende Profile rückwirkend befüllen
UPDATE public.profiles
  SET trial_ends_at = created_at + interval '30 days'
  WHERE trial_ends_at IS NULL;

-- 2) Trigger: trial_ends_at beim INSERT erzwingen -----------
--    (Guard falls jemand NULL explizit übergibt)
CREATE OR REPLACE FUNCTION public.ensure_trial_ends_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_ensure_trial ON public.profiles;
CREATE TRIGGER profiles_ensure_trial
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_trial_ends_at();

-- 3) Trigger: Profile-Zeile automatisch anlegen wenn sich ---
--    ein neuer User registriert (auth.users INSERT)
--    SECURITY DEFINER damit der Trigger auf public.profiles
--    schreiben darf, obwohl er im auth-Schema läuft.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, trial_ends_at)
  VALUES (NEW.id, now() + interval '30 days')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
