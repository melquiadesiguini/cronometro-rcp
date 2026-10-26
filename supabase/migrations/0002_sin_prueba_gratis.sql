-- Sin prueba gratis: las cuentas nuevas empiezan sin acceso y tienen que pagar para usar la app.
-- (Las cuentas que ya existían conservan la fecha de prueba que tenían.)
alter table public.profiles alter column trial_ends_at set default now();
