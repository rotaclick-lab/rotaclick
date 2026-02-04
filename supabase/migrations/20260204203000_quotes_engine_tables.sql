-- =========================================================
-- RotaClick - Motor de cotação por tabela (MVP)
-- Novo modelo (não remove legado):
--   - freight_rate_tables / freight_rate_table_rows
--   - quotes / quote_results
--   - função determinística pick_best_rate_row
--   - RLS + policies mínimas
--   - trigger de consistência quotes.selected_result_id
-- =========================================================

create extension if not exists "pgcrypto";

-- -----------------------------
-- 1) Tabelas de frete (transportador)
-- -----------------------------
create table if not exists public.freight_rate_tables (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references public.carriers(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists freight_rate_tables_carrier_id_idx
  on public.freight_rate_tables(carrier_id);

create index if not exists freight_rate_tables_is_active_idx
  on public.freight_rate_tables(is_active);


create table if not exists public.freight_rate_table_rows (
  id uuid primary key default gen_random_uuid(),
  rate_table_id uuid not null references public.freight_rate_tables(id) on delete cascade,

  uf_origem char(2) not null,
  uf_destino char(2) not null,

  peso_min_kg numeric(12,3) not null,
  peso_max_kg numeric(12,3) not null,

  preco_cents bigint not null,
  prazo_dias int not null,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint freight_rate_table_rows_weight_range_check
    check (peso_min_kg >= 0 and peso_max_kg > peso_min_kg),

  constraint freight_rate_table_rows_preco_check
    check (preco_cents > 0),

  constraint freight_rate_table_rows_prazo_check
    check (prazo_dias > 0),

  constraint freight_rate_table_rows_uf_origem_check
    check (uf_origem ~ '^[A-Z]{2}$'),

  constraint freight_rate_table_rows_uf_destino_check
    check (uf_destino ~ '^[A-Z]{2}$')
);

create index if not exists freight_rate_table_rows_table_route_idx
  on public.freight_rate_table_rows(rate_table_id, uf_origem, uf_destino);

create index if not exists freight_rate_table_rows_route_active_idx
  on public.freight_rate_table_rows(uf_origem, uf_destino, is_active);

create index if not exists freight_rate_table_rows_weight_idx
  on public.freight_rate_table_rows(peso_min_kg, peso_max_kg);


-- -----------------------------
-- 2) Quotes (cotação do cliente)
-- -----------------------------
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),

  company_id uuid not null references public.companies(id) on delete restrict,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,

  status text not null default 'OPEN'
    check (status in ('OPEN', 'CLOSED', 'CANCELLED')),

  -- input (MVP)
  origin_zip text not null,
  destination_zip text not null,
  weight_kg numeric(12,3) not null check (weight_kg > 0),

  length_cm int,
  width_cm int,
  height_cm int,
  cargo_type text,

  -- resolvido via ViaCEP (obrigatório na criação)
  origin_city text not null,
  origin_state char(2) not null check (origin_state ~ '^[A-Z]{2}$'),
  destination_city text not null,
  destination_state char(2) not null check (destination_state ~ '^[A-Z]{2}$'),

  -- fechamento (snapshot mínimo)
  selected_result_id uuid,
  final_price_cents bigint,
  final_deadline_days int,
  closing_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quotes_dims_check
    check (
      (length_cm is null or length_cm > 0) and
      (width_cm  is null or width_cm  > 0) and
      (height_cm is null or height_cm > 0)
    ),

  constraint quotes_final_price_check
    check (final_price_cents is null or final_price_cents > 0),

  constraint quotes_final_deadline_check
    check (final_deadline_days is null or final_deadline_days > 0),

  constraint quotes_closing_notes_len_check
    check (closing_notes is null or char_length(closing_notes) <= 280)
);

create index if not exists quotes_company_id_idx on public.quotes(company_id);
create index if not exists quotes_status_idx on public.quotes(status);
create index if not exists quotes_created_by_user_id_idx on public.quotes(created_by_user_id);
create index if not exists quotes_created_at_idx on public.quotes(created_at desc);
create index if not exists quotes_route_state_idx on public.quotes(origin_state, destination_state);


-- -----------------------------
-- 3) quote_results (opções calculadas)
-- -----------------------------
create table if not exists public.quote_results (
  id uuid primary key default gen_random_uuid(),

  quote_id uuid not null references public.quotes(id) on delete cascade,
  carrier_id uuid not null references public.carriers(id) on delete restrict,

  origin_source text not null
    check (origin_source in ('TABELA', 'API')),

  price_cents bigint not null check (price_cents > 0),
  deadline_days int not null check (deadline_days > 0),

  status text not null default 'SENT'
    check (status in ('SENT', 'WITHDRAWN', 'WON', 'LOST')),

  meta jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quote_results_one_per_carrier_per_quote unique (quote_id, carrier_id)
);

create index if not exists quote_results_quote_id_idx on public.quote_results(quote_id);
create index if not exists quote_results_carrier_id_idx on public.quote_results(carrier_id);
create index if not exists quote_results_status_idx on public.quote_results(status);
create index if not exists quote_results_price_idx on public.quote_results(price_cents asc, deadline_days asc);


-- FK do selected_result_id (depois que quote_results existe)
alter table public.quotes
  drop constraint if exists quotes_selected_result_fk;

alter table public.quotes
  add constraint quotes_selected_result_fk
  foreign key (selected_result_id) references public.quote_results(id)
  on delete set null;


-- -----------------------------
-- 4) Função determinística: pick_best_rate_row
-- Regra (MVP): menor preço -> menor prazo -> menor peso_min -> menor id
-- -----------------------------
create or replace function public.pick_best_rate_row(
  _carrier_id uuid,
  _uf_origem char(2),
  _uf_destino char(2),
  _peso_kg numeric
)
returns table (
  rate_row_id uuid,
  preco_cents bigint,
  prazo_dias int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id as rate_row_id,
    r.preco_cents,
    r.prazo_dias
  from public.freight_rate_table_rows r
  join public.freight_rate_tables t on t.id = r.rate_table_id
  where t.carrier_id = _carrier_id
    and t.is_active = true
    and r.is_active = true
    and r.uf_origem = _uf_origem
    and r.uf_destino = _uf_destino
    and _peso_kg >= r.peso_min_kg
    and _peso_kg <= r.peso_max_kg
  order by
    r.preco_cents asc,
    r.prazo_dias asc,
    r.peso_min_kg asc,
    r.id asc
  limit 1;
$$;


-- -----------------------------
-- 5) Trigger de consistência selected_result_id
-- Garante: quotes.selected_result_id deve referenciar quote_results com quote_id = quotes.id
-- -----------------------------
create or replace function public.enforce_quotes_selected_result_consistency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.selected_result_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.quote_results qr
    where qr.id = new.selected_result_id
      and qr.quote_id = new.id
  ) then
    raise exception 'selected_result_id must reference a quote_results row of the same quote';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_quotes_selected_result_consistency on public.quotes;

create trigger trg_quotes_selected_result_consistency
before insert or update of selected_result_id
on public.quotes
for each row
execute function public.enforce_quotes_selected_result_consistency();


-- -----------------------------
-- 6) RLS + Policies
-- -----------------------------
alter table public.freight_rate_tables enable row level security;
alter table public.freight_rate_table_rows enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_results enable row level security;

-- freight_rate_tables: TRANSPORTADOR gerencia as próprias
drop policy if exists "freight_rate_tables_select_own" on public.freight_rate_tables;
create policy "freight_rate_tables_select_own"
on public.freight_rate_tables
for select
to authenticated
using (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "freight_rate_tables_insert_own" on public.freight_rate_tables;
create policy "freight_rate_tables_insert_own"
on public.freight_rate_tables
for insert
to authenticated
with check (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "freight_rate_tables_update_own" on public.freight_rate_tables;
create policy "freight_rate_tables_update_own"
on public.freight_rate_tables
for update
to authenticated
using (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
)
with check (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
);

-- freight_rate_tables: ADMIN pode ver todas (SELECT only)
drop policy if exists "freight_rate_tables_select_admin_all" on public.freight_rate_tables;
create policy "freight_rate_tables_select_admin_all"
on public.freight_rate_tables
for select
to authenticated
using (
  public.current_profile_role() = 'ADMIN'
);


-- freight_rate_table_rows: TRANSPORTADOR gerencia via ownership do cabeçalho
drop policy if exists "freight_rate_table_rows_select_own" on public.freight_rate_table_rows;
create policy "freight_rate_table_rows_select_own"
on public.freight_rate_table_rows
for select
to authenticated
using (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.freight_rate_tables t
    join public.carriers c on c.id = t.carrier_id
    where t.id = rate_table_id
      and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "freight_rate_table_rows_insert_own" on public.freight_rate_table_rows;
create policy "freight_rate_table_rows_insert_own"
on public.freight_rate_table_rows
for insert
to authenticated
with check (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.freight_rate_tables t
    join public.carriers c on c.id = t.carrier_id
    where t.id = rate_table_id
      and c.owner_user_id = auth.uid()
  )
);

drop policy if exists "freight_rate_table_rows_update_own" on public.freight_rate_table_rows;
create policy "freight_rate_table_rows_update_own"
on public.freight_rate_table_rows
for update
to authenticated
using (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.freight_rate_tables t
    join public.carriers c on c.id = t.carrier_id
    where t.id = rate_table_id
      and c.owner_user_id = auth.uid()
  )
)
with check (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.freight_rate_tables t
    join public.carriers c on c.id = t.carrier_id
    where t.id = rate_table_id
      and c.owner_user_id = auth.uid()
  )
);

-- freight_rate_table_rows: ADMIN pode ver todas (SELECT only)
drop policy if exists "freight_rate_table_rows_select_admin_all" on public.freight_rate_table_rows;
create policy "freight_rate_table_rows_select_admin_all"
on public.freight_rate_table_rows
for select
to authenticated
using (
  public.current_profile_role() = 'ADMIN'
);


-- quotes: CLIENTE/ADMIN por company_id
drop policy if exists "quotes_select_own_company" on public.quotes;
create policy "quotes_select_own_company"
on public.quotes
for select
to authenticated
using (
  public.current_profile_role() in ('ADMIN', 'CLIENTE')
  and company_id = public.current_profile_company_id()
);

drop policy if exists "quotes_insert_own_company" on public.quotes;
create policy "quotes_insert_own_company"
on public.quotes
for insert
to authenticated
with check (
  public.current_profile_role() in ('ADMIN', 'CLIENTE')
  and company_id = public.current_profile_company_id()
  and created_by_user_id = auth.uid()
);

drop policy if exists "quotes_update_own_company" on public.quotes;
create policy "quotes_update_own_company"
on public.quotes
for update
to authenticated
using (
  public.current_profile_role() in ('ADMIN', 'CLIENTE')
  and company_id = public.current_profile_company_id()
)
with check (
  public.current_profile_role() in ('ADMIN', 'CLIENTE')
  and company_id = public.current_profile_company_id()
);


-- quote_results: CLIENTE/ADMIN podem ver resultados da própria empresa (explicitamente)
drop policy if exists "quote_results_select_for_own_company" on public.quote_results;
create policy "quote_results_select_for_own_company"
on public.quote_results
for select
to authenticated
using (
  public.current_profile_role() in ('ADMIN', 'CLIENTE')
  and exists (
    select 1
    from public.quotes q
    where q.id = quote_id
      and q.company_id = public.current_profile_company_id()
  )
);

-- quote_results: TRANSPORTADOR vê apenas os resultados dele quando a quote está CLOSED
drop policy if exists "quote_results_select_closed_for_own_carrier" on public.quote_results;
create policy "quote_results_select_closed_for_own_carrier"
on public.quote_results
for select
to authenticated
using (
  public.current_profile_role() = 'TRANSPORTADOR'
  and exists (
    select 1
    from public.carriers c
    where c.id = carrier_id
      and c.owner_user_id = auth.uid()
  )
  and exists (
    select 1
    from public.quotes q
    where q.id = quote_id
      and q.status = 'CLOSED'
  )
);
