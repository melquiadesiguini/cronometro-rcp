const pad = (n) => String(n).padStart(2, '0');

/** Tiempo transcurrido como 00:00 (minutos:segundos). */
export function formatElapsed(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** Cuenta regresiva como 1:59 (redondea hacia arriba para que nunca muestre 0:00 antes de tiempo). */
export function formatCountdown(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** Hora del reloj como 14:05. */
export function formatClock(timestamp) {
  return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
