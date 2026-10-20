import { formatClock, formatElapsed } from './format.js';

/** Texto del registro para copiar y pegar (por ejemplo, en el informe). */
export function buildReport(session) {
  if (!session.startedAt) return '';
  const header = `RCP ${new Date(session.startedAt).toLocaleString('es-ES')}`;
  const lines = session.events.map(
    (e) => `${formatElapsed(e.at - session.startedAt)}  ${formatClock(e.at)}  ${e.name}`
  );
  return [header, ...lines].join('\n');
}
