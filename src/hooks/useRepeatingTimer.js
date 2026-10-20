import { useEffect, useRef } from 'react';
import { FLASH_MS, WARN_MS } from '../config.js';

/**
 * Cuenta regresiva que se repite sola.
 * Llama a `onLap` cuando llega a cero y devuelve el tiempo restante y su estado:
 * 'idle' (sin empezar), 'ok', 'warn' (faltan pocos segundos) o 'due' (acaba de sonar).
 */
export function useRepeatingTimer({ timer, period, now, active, onLap }) {
  const onLapRef = useRef(onLap);
  onLapRef.current = onLap;

  const running = active && timer.startAt != null;
  const laps = running ? Math.floor((now - timer.startAt) / period) : 0;

  useEffect(() => {
    if (laps > 0) onLapRef.current();
  }, [laps]);

  if (!running) return { left: null, phase: 'idle' };

  const left = period - ((now - timer.startAt) % period);
  let phase = 'ok';
  if (timer.lapAt != null && now - timer.lapAt < FLASH_MS) phase = 'due';
  else if (left <= WARN_MS) phase = 'warn';

  return { left, phase };
}
