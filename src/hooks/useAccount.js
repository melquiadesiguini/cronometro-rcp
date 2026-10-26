import { useCallback, useEffect, useState } from 'react';
import { appUrl, supabase } from '../lib/supabase.js';
import { cacheAccess, cachedAccess, clearAccessCache, computeAccess } from '../lib/access.js';
import { deviceLabel, getDeviceId } from '../lib/device.js';

// Al ingresar (con email o Google) este dispositivo «toma» la cuenta. La marca se guarda
// antes de ingresar porque con Google la página se recarga al volver.
const CLAIM_FLAG = 'rcp-claim-device';
const setClaimFlag = (on) => {
  try {
    if (on) sessionStorage.setItem(CLAIM_FLAG, '1');
    else sessionStorage.removeItem(CLAIM_FLAG);
  } catch {
    // Sin almacenamiento: se toma la cuenta igual al no haber dispositivo activo.
  }
};
const hasClaimFlag = () => {
  try {
    return sessionStorage.getItem(CLAIM_FLAG) === '1';
  } catch {
    return false;
  }
};

/** Cada cuánto se revisa si la cuenta se abrió en otro dispositivo. */
const DEVICE_CHECK_MS = 30_000;

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
  // Un solo dispositivo activo por cuenta: 'ok' o 'other' (la cuenta está abierta en otro lado).
  const [device, setDevice] = useState({ status: 'ok', label: null, since: null });

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

  /** Este dispositivo pasa a ser el activo de la cuenta. */
  const claimDevice = useCallback(async () => {
    const { error } = await supabase.rpc('claim_device', { p_device_id: getDeviceId(), p_label: deviceLabel() });
    if (error) throw new Error(message(error));
    setClaimFlag(false);
    setDevice({ status: 'ok', label: null, since: null });
  }, []);

  /** ¿Sigue siendo este el dispositivo activo? Sin internet no cambia nada. */
  const checkDevice = useCallback(async () => {
    if (!userId) return;
    if (hasClaimFlag()) {
      await claimDevice().catch(() => {});
      return;
    }
    const { data, error } = await supabase
      .from('active_devices')
      .select('device_id, device_label, claimed_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return; // sin conexión: se revisa más tarde
    if (!data) {
      await claimDevice().catch(() => {});
      return;
    }
    setDevice(
      data.device_id === getDeviceId()
        ? { status: 'ok', label: null, since: null }
        : { status: 'other', label: data.device_label, since: data.claimed_at }
    );
  }, [userId, claimDevice]);

  // Revisa al abrir, cada 30 segundos y cada vez que la app vuelve a la pantalla.
  useEffect(() => {
    if (!userId) return;
    checkDevice();
    const id = setInterval(() => document.visibilityState === 'visible' && checkDevice(), DEVICE_CHECK_MS);
    const onVisible = () => document.visibilityState === 'visible' && checkDevice();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [userId, checkDevice]);

  const access = profile ? computeAccess(profile) : null;

  const run = async (fn) => {
    const { error } = await fn();
    if (error) throw new Error(message(error));
  };

  const actions = {
    signIn: async (email, password) => {
      setClaimFlag(true);
      try {
        await run(() => supabase.auth.signInWithPassword({ email, password }));
      } catch (e) {
        setClaimFlag(false);
        throw e;
      }
    },
    signUp: (email, password, fullName) =>
      run(() =>
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: appUrl() },
        })
      ),
    signInWithGoogle: async () => {
      setClaimFlag(true);
      try {
        await run(() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: appUrl() } }));
      } catch (e) {
        setClaimFlag(false);
        throw e;
      }
    },
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
    /** Precio del día en pesos (USD 10 al dólar oficial). Devuelve null si no se pudo consultar. */
    quote: async () => {
      const { data, error } = await supabase.functions.invoke('create-payment', { body: { quote: true } });
      return error || !data?.priceArs ? null : data;
    },
    /** Pide el link de pago a Mercado Pago y lleva al usuario a pagar. */
    pay: async () => {
      const { data, error } = await supabase.functions.invoke('create-payment', { method: 'POST' });
      if (error || !data?.url) throw new Error(data?.error ?? 'No se pudo iniciar el pago. Probá de nuevo.');
      window.location.href = data.url;
    },
    /** «Usar en este dispositivo»: toma la cuenta y la bloquea en el otro. */
    useHere: claimDevice,
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
    device,
    actions,
  };
}
