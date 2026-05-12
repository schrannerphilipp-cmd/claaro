-- ============================================================
-- Claaro – Profil, Abo-Spalten, Firmen-Chat
-- ============================================================

-- profiles ---------------------------------------------------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  avatar_url    text,
  avatar_path   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table profiles enable row level security;

-- Anyone authenticated can read (for username availability check)
create policy "profiles_read" on profiles
  for select using (true);

-- Only the owner can write
create policy "profiles_write" on profiles
  for all using (id = auth.uid());

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  create trigger profiles_updated_at
    before update on profiles
    for each row execute function set_updated_at();
exception when duplicate_object then null;
end $$;

-- Abo-Spalten für company_settings ---------------------------
alter table company_settings
  add column if not exists abo_plan              text default 'starter',
  add column if not exists abo_zahlungsintervall text default 'monatlich',
  add column if not exists abo_seit              date;

-- chat_messages ----------------------------------------------
create table if not exists chat_messages (
  id                uuid primary key default gen_random_uuid(),
  hauptaccount_id   uuid not null,
  sender_id         uuid not null references auth.users(id),
  sender_name       text not null,
  sender_avatar_url text,
  nachricht         text not null check (char_length(nachricht) <= 2000),
  created_at        timestamptz not null default now(),
  geaendert_at      timestamptz,
  geloescht         boolean not null default false
);

alter table chat_messages enable row level security;

-- Demo-friendly: authenticated users can read all
-- Tighten in production by checking hauptaccount membership
create policy "chat_read" on chat_messages
  for select using (auth.uid() is not null);

create policy "chat_insert" on chat_messages
  for insert with check (sender_id = auth.uid());

create policy "chat_update_own" on chat_messages
  for update using (sender_id = auth.uid());

create index if not exists chat_messages_haupaccount_idx
  on chat_messages (hauptaccount_id, created_at);

-- chat_read_status -------------------------------------------
create table if not exists chat_read_status (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id),
  hauptaccount_id     uuid not null,
  letzte_gelesen_at   timestamptz not null default now(),
  unique (user_id, hauptaccount_id)
);

alter table chat_read_status enable row level security;

create policy "read_status_own" on chat_read_status
  for all using (user_id = auth.uid());

-- Bucket "avatars": Public, PNG/JPEG/WebP, max 3 MB
-- Anlegen manuell im Supabase Dashboard:
--   Storage → New bucket → Name: "avatars" → Public: true
--   Allowed MIME types: image/png, image/jpeg, image/webp
--   Max file size: 3145728 (3 MB)
