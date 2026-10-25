import { createClient } from '@supabase/supabase-js';

// Conexión con Supabase. Los datos salen de .env.local (en tu PC) o de las
// variables del deploy. La clave "anon/publishable" es pública por diseño:
// la seguridad la dan las reglas (RLS) de la base de datos.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** false mientras no haya proyecto configurado: la app funciona sin cuentas. */
export const authEnabled = Boolean(url && key);

export const supabase = authEnabled
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

/** Dirección de la app, para volver después de Google, del email o del pago. */
export const appUrl = () => window.location.origin + window.location.pathname;
