-- ============================================================
-- Claaro Dienstplan – Datenbankschema
-- Ausführen: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- employees --------------------------------------------------
create table if not exists employees (
  id               uuid primary key default gen_random_uuid(),
  hauptaccount_id  uuid not null references auth.users(id) on delete cascade,
  auth_user_id     uuid references auth.users(id) on delete set null,
  name             text not null,
  email            text not null,
  telefon          text not null,
  rolle            text not null check (rolle in ('admin','mitarbeiter')),
  land             text not null check (land in ('DE','AT','CH')),
  stunden_pro_woche numeric(4,1) not null default 40,
  vertrag_typ      text not null check (vertrag_typ in ('vollzeit','teilzeit','minijob')),
  aktiv            boolean not null default true,
  urlaub_tage_jahr int not null default 25,
  created_at       timestamptz not null default now()
);

-- availability ----------------------------------------------
create table if not exists availability (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete cascade,
  woche        text not null,   -- ISO-Kalenderwoche, z.B. "2026-W21"
  tag          smallint not null check (tag between 0 and 6),  -- 0=Mo … 6=So
  von          time,
  bis          time,
  verfuegbar   boolean not null default true,
  notiz        text,
  created_at   timestamptz not null default now(),
  unique (employee_id, woche, tag)
);

-- shift_plans -----------------------------------------------
create table if not exists shift_plans (
  id                uuid primary key default gen_random_uuid(),
  hauptaccount_id   uuid not null references auth.users(id) on delete cascade,
  woche             text not null,
  status            text not null default 'entwurf' check (status in ('entwurf','veroeffentlicht')),
  ki_begruendung    text,
  erstellt_at       timestamptz not null default now(),
  veroeffentlicht_at timestamptz
);

-- shifts ----------------------------------------------------
create table if not exists shifts (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references employees(id) on delete cascade,
  shift_plan_id     uuid references shift_plans(id) on delete set null,
  hauptaccount_id   uuid not null references auth.users(id) on delete cascade,
  datum             date not null,
  von               time not null,
  bis               time not null,
  pause_minuten     int not null default 30,
  rolle_im_dienst   text not null default '',
  status            text not null default 'entwurf' check (status in ('entwurf','bestaetigt','getauscht')),
  erstellt_von_ki   boolean not null default false,
  created_at        timestamptz not null default now()
);

-- vacations -------------------------------------------------
create table if not exists vacations (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete cascade,
  von          date not null,
  bis          date not null,
  status       text not null default 'beantragt' check (status in ('beantragt','genehmigt','abgelehnt')),
  notiz        text,
  ablehngrund  text,
  created_at   timestamptz not null default now()
);

-- shift_swaps -----------------------------------------------
create table if not exists shift_swaps (
  id                   uuid primary key default gen_random_uuid(),
  shift_id_original    uuid not null references shifts(id) on delete cascade,
  shift_id_angebot     uuid references shifts(id) on delete set null,
  employee_id_anfrage  uuid not null references employees(id) on delete cascade,
  employee_id_angebot  uuid references employees(id) on delete set null,
  status               text not null default 'offen' check (status in ('offen','angenommen','abgelehnt')),
  admin_genehmigt      boolean,
  created_at           timestamptz not null default now()
);

-- notifications_log -----------------------------------------
create table if not exists notifications_log (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references employees(id) on delete cascade,
  typ             text not null check (typ in ('schicht','urlaub','tausch','erinnerung')),
  whatsapp_status text not null check (whatsapp_status in ('gesendet','fehler')),
  nachricht       text not null,
  fehler_detail   text,
  sent_at         timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table employees         enable row level security;
alter table availability      enable row level security;
alter table shift_plans       enable row level security;
alter table shifts            enable row level security;
alter table vacations         enable row level security;
alter table shift_swaps       enable row level security;
alter table notifications_log enable row level security;

-- Hauptaccount sieht alle Daten seines Unternehmens
create policy "hauptaccount_employees" on employees
  for all using (hauptaccount_id = auth.uid());

create policy "hauptaccount_shift_plans" on shift_plans
  for all using (hauptaccount_id = auth.uid());

create policy "hauptaccount_shifts" on shifts
  for all using (hauptaccount_id = auth.uid());

create policy "hauptaccount_notifications" on notifications_log
  for all using (
    employee_id in (select id from employees where hauptaccount_id = auth.uid())
  );

-- Mitarbeiter sehen nur eigene Daten
create policy "employee_own_availability" on availability
  for all using (
    employee_id in (
      select id from employees where auth_user_id = auth.uid()
    )
  );

create policy "employee_own_vacations" on vacations
  for all using (
    employee_id in (
      select id from employees where auth_user_id = auth.uid()
    )
  );

create policy "employee_own_shifts" on shifts
  for select using (
    employee_id in (
      select id from employees where auth_user_id = auth.uid()
    )
    or hauptaccount_id = auth.uid()
  );

create policy "employee_own_swaps" on shift_swaps
  for all using (
    employee_id_anfrage in (
      select id from employees where auth_user_id = auth.uid()
    )
    or employee_id_angebot in (
      select id from employees where auth_user_id = auth.uid()
    )
    or exists (
      select 1 from shifts s
      join employees e on e.id = s.employee_id
      where s.id = shift_swaps.shift_id_original
        and e.hauptaccount_id = auth.uid()
    )
  );
