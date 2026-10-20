import { useEffect, useRef } from 'react';
import { WARN_MS } from '../config.js';

/**
 * Cuenta regresiva que se detiene en 0:00.
 * Llama a `onExpire` una vez al llegar a cero y devuelve el tiempo restante y su estado:
 * 'idle' (sin empezar), 'ok', 'warn' (faltan pocos segundos) o 'due' (llegó a cero y
 * espera que la persona toque el botón; recién ahí arranca otra cuenta).
 */
export function useCountdown({ timer, period, now, active, onExpire }) {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const running = active && timer.startAt != null;
  const reachedZero = running && now - timer.startAt >= period;
  const mustExpire = reachedZero && timer.expiredAt == null;

  useEffect(() => {
    if (mustExpire) onExpireRef.current();
  }, [mustExpire]);

  if (!running) return { left: null, phase: 'idle' };
  if (reachedZero || timer.expiredAt != null) return { left: 0, phase: 'due' };

  const left = period - (now - timer.startAt);
  return { left, phase: left <= WARN_MS ? 'warn' : 'ok' };
}
