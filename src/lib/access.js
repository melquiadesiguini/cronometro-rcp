// Calcula si el usuario puede usar la app: prueba gratis, pago al día o vencido.

const DAY = 86_400_000;
const CACHE_KEY = 'rcp-access';

/**
 * Estados: 'active' (pago al día), 'trial' (prueba vigente, solo cuentas viejas),
 * 'expired' (pagó alguna vez y venció) o 'inactive' (nunca pagó).
 * @returns {{ status: 'trial'|'active'|'expired'|'inactive', until: number, daysLeft: number }}
 */
export function computeAccess(profile, now = Date.now()) {
  const trial = profile?.trial_ends_at ? Date.parse(profile.trial_ends_at) : 0;
  const paid = profile?.paid_until ? Date.parse(profile.paid_until) : 0;
  const until = Math.max(trial, paid);
  const status = paid > now ? 'active' : trial > now ? 'trial' : paid ? 'expired' : 'inactive';
  const daysLeft = Math.max(0, Math.ceil((until - now) / DAY));
  return { status, until, daysLeft };
}

/** Guarda la última fecha conocida, para poder usar la app sin internet hasta esa fecha. */
export function cacheAccess(userId, profile) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ userId, trial_ends_at: profile.trial_ends_at, paid_until: profile.paid_until })
    );
  } catch {
    // Sin almacenamiento: sin internet no se podrá verificar.
  }
}

export function cachedAccess(userId) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    return c?.userId === userId ? c : null;
  } catch {
    return null;
  }
}

export function clearAccessCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Nada que borrar.
  }
}

/** ¿Hay una RCP en curso? (nunca se bloquea la app en medio de una). */
export function rcpInProgress(storageKey) {
  try {
    const s = JSON.parse(localStorage.getItem(storageKey));
    return Boolean(s?.startedAt && !s?.endedAt);
  } catch {
    return false;
  }
}
