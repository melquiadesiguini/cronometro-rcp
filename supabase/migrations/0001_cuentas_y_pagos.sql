-- Cronómetro RCP: cuentas de usuario, prueba gratis y pagos.
-- Se ejecuta una vez en el SQL Editor de Supabase (o con `supabase db push`).
--
-- Reglas:
--   • Al registrarse, cada usuario recibe 7 días de prueba.
--   • Cada pago aprobado suma 6 meses desde el último vencimiento (o desde hoy, si ya venció).
--   • El usuario puede ver sus datos y cambiar su nombre, pero NO puede tocar
--     las fechas de prueba ni de pago: eso solo lo hace el servidor al confirmar un pago.

-- ---------------------------------------------------------------------------
-- Perfil de cada usuario
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  email          text not null,
  full_name      text,
  trial_ends_at  timestamptz not null default (now() + interval '7 days'),
  paid_until     timestamptz,
  created_at     timestamptz not null default now()
);

comment on table public.profiles is 'Un registro por usuario: prueba gratis y vencimiento del pago.';

-- ---------------------------------------------------------------------------
-- Pagos (historial). Los escribe solo el servidor (webhook de Mercado Pago).
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id                   bigint generated always as identity primary key,
  user_id              uuid not null references public.profiles (id) on delete cascade,
  provider             text not null default 'mercadopago',
  provider_payment_id  text not null unique,      -- evita acreditar dos veces el mismo pago
  status               text not null,
  amount               numeric(12, 2),
  currency             text,
  period_start         timestamptz,
  period_end           timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Al crear un usuario (con email o con Google), se crea su perfil con 7 días de prueba.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Acreditar un pago aprobado: suma 6 meses. Solo la usa el servidor (service_role).
-- Devuelve la nueva fecha de vencimiento. Si el pago ya estaba acreditado, no hace nada.
-- ---------------------------------------------------------------------------
create or replace function public.credit_payment(
  p_user_id uuid,
  p_provider_payment_id text,
  p_status text,
  p_amount numeric,
  p_currency text,
  p_months int default 6
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_start   timestamptz;
  v_end     timestamptz;
begin
  if exists (select 1 from public.payments where provider_payment_id = p_provider_payment_id) then
    select paid_until into v_end from public.profiles where id = p_user_id;
    return v_end;
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'Usuario % inexistente', p_user_id;
  end if;

  -- Empieza cuando termina lo que ya tenía (prueba o pago anterior), o hoy si ya venció.
  v_start := greatest(now(), coalesce(v_profile.paid_until, now()), v_profile.trial_ends_at);
  v_end   := v_start + make_interval(months => p_months);

  update public.profiles set paid_until = v_end where id = p_user_id;

  insert into public.payments (user_id, provider_payment_id, status, amount, currency, period_start, period_end)
  values (p_user_id, p_provider_payment_id, p_status, p_amount, p_currency, v_start, v_end);

  return v_end;
end;
$$;

revoke all on function public.credit_payment(uuid, text, text, numeric, text, int) from public, anon, authenticated;
grant execute on function public.credit_payment(uuid, text, text, numeric, text, int) to service_role;

-- ---------------------------------------------------------------------------
-- El usuario puede eliminar su propia cuenta (se borran perfil y pagos en cascada).
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Seguridad (RLS): cada usuario ve solo lo suyo.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Ver mi perfil" on public.profiles;
create policy "Ver mi perfil" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "Editar mi nombre" on public.profiles;
create policy "Editar mi nombre" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Ver mis pagos" on public.payments;
create policy "Ver mis pagos" on public.payments
  for select to authenticated using ((select auth.uid()) = user_id);

-- Solo puede cambiar el nombre; las fechas quedan fuera de su alcance.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

revoke insert, update, delete on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
