-- Un solo dispositivo activo por cuenta. «El último en abrirla, gana»:
-- el dispositivo que toma la cuenta pasa a ser el activo y los demás ven un aviso.

create table if not exists public.active_devices (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  device_id   text not null,        -- identificador al azar guardado en el dispositivo
  device_label text,                -- por ejemplo «Android · Chrome», para mostrar en el aviso
  claimed_at  timestamptz not null default now()
);

comment on table public.active_devices is 'Dispositivo activo de cada cuenta (uno por usuario).';

-- Tomar la cuenta en este dispositivo (lo llama la app al ingresar o al tocar «Usar acá»).
create or replace function public.claim_device(p_device_id text, p_label text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sin sesión';
  end if;
  insert into public.active_devices (user_id, device_id, device_label, claimed_at)
  values (auth.uid(), p_device_id, p_label, now())
  on conflict (user_id) do update
    set device_id = excluded.device_id,
        device_label = excluded.device_label,
        claimed_at = now();
end;
$$;

revoke all on function public.claim_device(text, text) from public, anon;
grant execute on function public.claim_device(text, text) to authenticated;

-- Cada usuario solo ve su propio registro y no lo puede escribir directo.
alter table public.active_devices enable row level security;

drop policy if exists "Ver mi dispositivo activo" on public.active_devices;
create policy "Ver mi dispositivo activo" on public.active_devices
  for select to authenticated using ((select auth.uid()) = user_id);

revoke insert, update, delete on public.active_devices from anon, authenticated;
grant select on public.active_devices to authenticated;
