-- Corrige recursão infinita em policies de public.profiles (erro 42P17)
-- usando funções SECURITY DEFINER para ler role/company_id do usuário.

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- Recria policy de select de profiles (remove a versão com subquery recursiva)
drop policy if exists "profiles_select_self_or_company_admin" on public.profiles;

create policy "profiles_select_self_or_company_admin"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or (
    public.current_profile_role() = 'ADMIN'
    and company_id is not null
    and company_id = public.current_profile_company_id()
  )
);
