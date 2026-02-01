-- Adiciona campos do formulário de solicitação (MVP) e melhora o fluxo de escolha de proposta.

-- -----------------------------
-- freight_requests: novos campos
-- -----------------------------
alter table public.freight_requests
  add column if not exists origin_zip text,
  add column if not exists destination_zip text,
  add column if not exists cargo_type text,
  add column if not exists length_cm int,
  add column if not exists width_cm int,
  add column if not exists height_cm int,
  add column if not exists invoice_value_cents bigint,
  add column if not exists pickup_date date;

-- -----------------------------
-- freight_quotes: status WON/LOST
-- -----------------------------
alter table public.freight_quotes
  drop constraint if exists freight_quotes_status_check;

alter table public.freight_quotes
  add constraint freight_quotes_status_check
  check (status in ('SENT', 'WITHDRAWN', 'WON', 'LOST'));

-- -----------------------------
-- RLS: bloquear novas propostas quando request não está OPEN
-- ou quando já existe quote vencedora selecionada.
-- -----------------------------
drop policy if exists "freight_quotes_insert_by_owner_on_open_request" on public.freight_quotes;

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
      and fr.selected_quote_id is null
  )
);
