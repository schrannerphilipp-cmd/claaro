-- Kundenstamm pro User
create table if not exists kunden (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  firma      text not null,
  kontakt    text,
  strasse    text,
  plz        text,
  ort        text,
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, firma)
);

alter table kunden enable row level security;

create policy "own_kunden" on kunden
  for all using (user_id = auth.uid());
