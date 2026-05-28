-- ============================================================
-- Claaro – Öffentliche Testimonials für die Landingpage
-- ============================================================

create table if not exists public_testimonials (
  id            uuid        primary key default gen_random_uuid(),
  customer_name text        not null,
  role          text,
  quote         text        not null,
  rating        integer     not null check (rating between 1 and 5),
  result        text,
  initials      text,
  color         text        default '#2a7a6a',
  is_approved   boolean     not null default false,
  created_at    timestamptz not null default now()
);

alter table public_testimonials enable row level security;

-- Öffentlich lesbar: nur genehmigte Einträge mit 4+ Sternen
create policy "public_read_approved" on public_testimonials
  for select using (is_approved = true and rating >= 4);
