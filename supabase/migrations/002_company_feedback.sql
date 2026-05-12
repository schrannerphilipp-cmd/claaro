-- ============================================================
-- Claaro – Erweiterungen: Firmeneinstellungen + Feedback
-- ============================================================

-- company_settings ------------------------------------------
create table if not exists company_settings (
  id               uuid primary key default gen_random_uuid(),
  hauptaccount_id  uuid not null references auth.users(id) on delete cascade,
  firmenname       text,
  logo_url         text,
  logo_path        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (hauptaccount_id)
);

alter table company_settings enable row level security;

create policy "own_company_settings" on company_settings
  for all using (hauptaccount_id = auth.uid());

-- Supabase Storage Bucket: company-logos
-- Manuell im Supabase Dashboard anlegen:
--   Storage → New bucket → Name: "company-logos" → Public: true
--   Allowed MIME types: image/png, image/jpeg, image/svg+xml
--   Max file size: 5242880 (5 MB)

-- feedback ---------------------------------------------------
create table if not exists feedback (
  id               uuid primary key default gen_random_uuid(),
  hauptaccount_id  text,
  name             text not null,
  email            text not null,
  kategorie        text not null,
  nachricht        text not null,
  created_at       timestamptz not null default now()
);

alter table feedback enable row level security;

create policy "insert_feedback" on feedback
  for insert with check (true);

create policy "own_feedback" on feedback
  for select using (hauptaccount_id = auth.uid()::text);
