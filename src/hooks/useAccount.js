import { useCallback, useEffect, useState } from 'react';
import { appUrl, supabase } from '../lib/supabase.js';
import { cacheAccess, cachedAccess, clearAccessCache, computeAccess } from '../lib/access.js';

// Traduce los errores de Supabase a mensajes claros en español.
function message(error) {
  const m = error?.message ?? '';
  if (/Invalid login credentials/i.test(m)) return 'Email o contraseña incorrectos.';
  if (/Email not confirmed/i.test(m)) return 'Confirmá tu email: te mandamos un enlace al registrarte.';
  if (/already registered/i.test(m)) return 'Ese email ya tiene cuenta. Iniciá sesión o recuperá la contraseña.';
  if (/Password should be at least/i.test(m)) return 'La contraseña tiene que tener al menos 8 caracteres.';
  if (/rate limit/i.test(m)) return 'Demasiados intentos. Esperá unos minutos y probá de nuevo.';
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Sin conexión. Revisá tu internet y probá de nuevo.';
  return m || 'Algo salió mal. Probá de nuevo.';
}

/**
 * Sesión, perfil, acceso (prueba / pago / vencido), pagos y todas las acciones de la cuenta.
 * Sin internet usa la última fecha de vencimiento conocida.
 */
export function useAccount() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [recovery, setRecovery] = useState(false); // llegó desde «olvidé mi contraseña»
  const [offline, setOffline] = useState(false);
  const [loadError, setLoadError] = useState(false); // sin internet y sin datos guardados

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [p, pay] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);
    if (p.error) {
      // Sin internet: se usa la fecha guardada.
      const cached = cachedAccess(userId);
      if (cached) {
        setProfile((prev) => prev ?? { ...cached, email: session.user.email });
        setOffline(true);
      } else {
        setLoadError(true);
      }
      return;
    }
    setOffline(false);
    setLoadError(false);
    setProfile(p.data);
    setPayments(pay.data ?? []);
    cacheAccess(userId, p.data);
  }, [userId, session]);

  useEffect(() => {
    if (userId) refresh();
    else setProfile(null);
  }, [userId, refresh]);

  const access = profile ? computeAccess(profile) : null;

  const run = async (fn) => {
    const { error } = await fn();
    if (error) throw new Error(message(error));
  };

  const actions = {
    signIn: (email, password) => run(() => supabase.auth.signInWithPassword({ email, password })),
    signUp: (email, password, fullName) =>
      run(() =>
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: appUrl() },
        })
      ),
    signInWithGoogle: () =>
      run(() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } })),
    resetPassword: (email) =>
      run(() => supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() })),
    updatePassword: async (password) => {
      await run(() => supabase.auth.updateUser({ password }));
      setRecovery(false);
    },
    updateName: async (fullName) => {
      await run(() => supabase.from('profiles').update({ full_name: fullName }).eq('id', userId));
      await refresh();
    },
    signOut: async () => {
      clearAccessCache();
      await supabase.auth.signOut();
    },
    deleteAccount: async () => {
      await run(() => supabase.rpc('delete_my_account'));
      clearAccessCache();
      await supabase.auth.signOut();
    },
    /** Pide el link de pago a Mercado Pago y lleva al usuario a pagar. */
    pay: async () => {
      const { data, error } = await supabase.functions.invoke('create-payment', { method: 'POST' });
      if (error || !data?.url) throw new Error(data?.error ?? 'No se pudo iniciar el pago. Probá de nuevo.');
      window.location.href = data.url;
    },
    refresh,
  };

  return {
    loading: session === undefined || Boolean(session && !profile && !loadError),
    loadError,
    session,
    user: session?.user ?? null,
    profile,
    payments,
    access,
    recovery,
    offline,
    actions,
  };
}
