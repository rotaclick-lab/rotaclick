-- Snapshot mínimo ao contratar (MVP)

alter table public.freight_requests
  add column if not exists final_price_cents bigint,
  add column if not exists final_deadline_days int,
  add column if not exists closing_notes text;

-- Garantias mínimas (somente quando preenchidos)
alter table public.freight_requests
  drop constraint if exists freight_requests_final_price_cents_check;

alter table public.freight_requests
  add constraint freight_requests_final_price_cents_check
  check (final_price_cents is null or final_price_cents > 0);

alter table public.freight_requests
  drop constraint if exists freight_requests_final_deadline_days_check;

alter table public.freight_requests
  add constraint freight_requests_final_deadline_days_check
  check (final_deadline_days is null or final_deadline_days > 0);

alter table public.freight_requests
  drop constraint if exists freight_requests_closing_notes_len_check;

alter table public.freight_requests
  add constraint freight_requests_closing_notes_len_check
  check (closing_notes is null or char_length(closing_notes) <= 280);
