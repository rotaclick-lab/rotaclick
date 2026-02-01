-- =========================================================
-- Seed mínimo para RotaClick (MVP)
--
-- Objetivo:
-- 1) Criar 1 empresa (companies)
-- 2) Criar/atualizar profiles para 2 usuários (CLIENTE e TRANSPORTADOR)
-- 3) Criar 1 carrier vinculado ao usuário TRANSPORTADOR
--
-- IMPORTANTE:
-- - Este script precisa ser executado como "service role" (bypass RLS),
--   por isso vamos rodar via Supabase CLI.
-- - Ajuste os e-mails abaixo antes de executar.
-- =========================================================

begin;

-- 1) Empresa
insert into public.companies (name)
values ('Empresa Demo RotaClick')
returning id;

-- Guarda o id da empresa criada
with c as (
  select id as company_id
  from public.companies
  where name = 'Empresa Demo RotaClick'
  order by created_at desc
  limit 1
)
-- 2) Perfil do CLIENTE
insert into public.profiles (id, company_id, role, full_name)
select u.id, c.company_id, 'CLIENTE', 'Cliente Demo'
from auth.users u
cross join c
where u.email = 'rotaclick2026@gmail.com'
on conflict (id) do update
set company_id = excluded.company_id,
    role = excluded.role,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

with c as (
  select id as company_id
  from public.companies
  where name = 'Empresa Demo RotaClick'
  order by created_at desc
  limit 1
)
-- 3) Perfil do TRANSPORTADOR (company_id nulo)
insert into public.profiles (id, company_id, role, full_name)
select u.id, null, 'TRANSPORTADOR', 'Transportador Demo'
from auth.users u
cross join c
where u.email = 'magnaum@gmail.com'
on conflict (id) do update
set company_id = null,
    role = excluded.role,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

-- 4) Carrier vinculado ao usuário transportador
insert into public.carriers (owner_user_id, name)
select p.id, 'Transportadora Demo'
from public.profiles p
join auth.users u on u.id = p.id
where u.email = 'magnaum@gmail.com'
  and p.role = 'TRANSPORTADOR'
on conflict (owner_user_id) do update
set name = excluded.name;

commit;
