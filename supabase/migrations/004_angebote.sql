create table if not exists angebote (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  angebotsnummer text not null,
  angebotsdatum  date not null default current_date,
  gueltig_bis    date not null default (current_date + 30),
  kunde_firma    text not null,
  kunde_kontakt  text,
  kunde_email    text,
  netto          numeric(12,2) not null default 0,
  brutto         numeric(12,2) not null default 0,
  rabatt         numeric(5,2)  not null default 0,
  status         text not null default 'offen'
                   check (status in ('offen', 'angenommen', 'abgelehnt')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique(user_id, angebotsnummer)
);

alter table angebote enable row level security;

create policy "own_angebote" on angebote
  for all using (user_id = auth.uid());
