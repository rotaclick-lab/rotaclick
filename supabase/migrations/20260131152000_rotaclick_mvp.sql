-- =========================================================
-- RotaClick MVP schema (Supabase Postgres)
-- Tabelas: companies, profiles, carriers, freight_requests, freight_quotes
-- RLS: mínimo e seguro
-- =========================================================

create extension if not exists "pgcrypto";

-- -----------------------------
-- 1) Tabelas
-- -----------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  -- 1:1 com auth.users
  id uuid primary key references auth.users(id) on delete cascade,

  -- Usuário CLIENTE/ADMIN pertence a uma empresa.
  -- TRANSPORTADOR pode ficar null (transportador é externo à empresa cliente).
  company_id uuid references public.companies(id) on delete restrict,

  role text not null check (role in ('ADMIN', 'CLIENTE', 'TRANSPORTADOR')),

  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_company_id_idx on public.profiles(company_id);
create index if not exists profiles_role_idx on public.profiles(role);

create table if not exists public.carriers (
  id uuid primary key default gen_random_uuid(),

  -- vincula um usuário transportador ao registro da transportadora
  owner_user_id uuid unique references public.profiles(id) on delete set null,

  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists carriers_owner_user_id_idx on public.carriers(owner_user_id);

create table if not exists public.freight_requests (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null references public.companies(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,

  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'CANCELLED')),

  origin_city text not null,
  origin_state text not null,
  destination_city text not null,
  destination_state text not null,

  cargo_description text,
  weight_kg numeric(12,2),
  volume_m3 numeric(12,3),

  -- quote vencedora (opcional)
  selected_quote_id uuid,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists freight_requests_company_id_idx on public.freight_requests(company_id);
create index if not exists freight_requests_status_idx on public.freight_requests(status);
create index if not exists freight_requests_created_by_idx on public.freight_requests(created_by);

create table if not exists public.freight_quotes (
  id uuid primary key default gen_random_uuid(),

  freight_request_id uuid not null references public.freight_requests(id) on delete cascade,
  carrier_id uuid not null references public.carriers(id) on delete restrict,

  price_cents bigint not null check (price_cents > 0),
  deadline_days int not null check (deadline_days > 0),
  notes text,

  status text not null default 'SENT' check (status in ('SENT', 'WITHDRAWN')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Um transportador envia no máximo 1 proposta por solicitação
  constraint freight_quotes_one_per_carrier_per_request unique (freight_request_id, carrier_id)
);

create index if not exists freight_quotes_request_id_idx on public.freight_quotes(freight_request_id);
create index if not exists freight_quotes_carrier_id_idx on public.freight_quotes(carrier_id);

alter table public.freight_requests
  add constraint freight_requests_selected_quote_fk
  foreign key (selected_quote_id) references public.freight_quotes(id)
  on delete set null;

-- -----------------------------
-- 2) RLS + Policies
-- -----------------------------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.carriers enable row level security;
alter table public.freight_requests enable row level security;
alter table public.freight_quotes enable row level security;

-- ---------- companies ----------
create policy "companies_select_own"
on public.companies
for select
to authenticated
using (
  id = (select p.company_id from public.profiles p where p.id = auth.uid())
);

-- ---------- profiles ----------
create policy "profiles_select_self_or_company_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or (
    (select p.role from public.profiles p where p.id = auth.uid()) = 'ADMIN'
    and company_id is not null
    and company_id = (select p2.company_id from public.profiles p2 where p2.id = auth.uid())
  )
);

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ---------- carriers ----------
create policy "carriers_select_own"
on public.carriers
for select
to authenticated
using (
  owner_user_id = auth.uid()
);

-- ---------- freight_requests ----------
create policy "freight_requests_select_own_company"
on public.freight_requests
for select
to authenticated
using (
  company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
);

create policy "freight_requests_select_open_for_carriers"
on public.freight_requests
for select
to authenticated
using (
  (select p.role from public.profiles p where p.id = auth.uid()) = 'TRANSPORTADOR'
  and status = 'OPEN'
);

create policy "freight_requests_insert_own_company"
on public.freight_requests
for insert
to authenticated
with check (
  company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  and created_by = auth.uid()
  and (select p.role from public.profiles p where p.id = auth.uid()) in ('ADMIN', 'CLIENTE')
);

create policy "freight_requests_update_own_company"
on public.freight_requests
for update
to authenticated
using (
  company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  and (select p.role from public.profiles p where p.id = auth.uid()) in ('ADMIN', 'CLIENTE')
)
with check (
  company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  and (select p.role from public.profiles p where p.id = auth.uid()) in ('ADMIN', 'CLIENTE')
);

-- ---------- freight_quotes ----------
create policy "freight_quotes_select_for_own_company_requests"
on public.freight_quotes
for select
to authenticated
using (
  exists (
    select 1
    from public.freight_requests fr
    where fr.id = freight_request_id
      and fr.company_id = (select p.company_id from public.profiles p where p.id = auth.uid())
  )
);

create policy "freight_quotes_select_own"
on public.freight_quotes
for select
to authenticated
using (
  exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
);

create policy "freight_quotes_insert_by_owner_on_open_request"
on public.freight_quotes
for insert
to authenticated
with check (
  (select p.role from public.profiles p where p.id = auth.uid()) = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.freight_requests fr
    where fr.id = freight_request_id
      and fr.status = 'OPEN'
  )
);

create policy "freight_quotes_update_own"
on public.freight_quotes
for update
to authenticated
using (
  exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
);
