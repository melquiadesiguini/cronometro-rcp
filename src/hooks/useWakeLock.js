import { useEffect } from 'react';

/** Mantiene la pantalla encendida mientras `active` sea true, si el dispositivo lo permite. */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock = null;
    let cancelled = false;

    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
        if (cancelled) lock.release();
      } catch {
        // El navegador lo rechazó: la pantalla se apagará según el ajuste del teléfono.
      }
    };
    // El bloqueo se pierde al cambiar de app; se pide de nuevo al volver.
    const onVisible = () => document.visibilityState === 'visible' && request();

    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
