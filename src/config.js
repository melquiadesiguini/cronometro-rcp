// Todos los valores ajustables del cronómetro están acá.

const MINUTE = 60_000;

/** Duración del ciclo de CAMBIO. */
export const CYCLE_MS = 2 * MINUTE;

/** Intervalos de adrenalina que se pueden elegir (en minutos) y el que viene marcado. */
export const ADRENALINE_OPTIONS = [3, 4, 5];
export const ADRENALINE_DEFAULT = 4;

export const minutesToMs = (minutes) => minutes * MINUTE;

/** Cuánto antes del aviso se pone naranja la tarjeta. */
export const WARN_MS = 15_000;

/** Lo que dice la voz y el tono del pitido de cada alarma. */
export const ALARMS = {
  cycle: { word: 'CAMBIO', freq: 880 },
  adrenaline: { word: 'ADRENALINA', freq: 660 },
};

/** Nombres de los eventos tal como aparecen en el registro. */
export const EVENTS = {
  start: 'Inicio RCP',
  change: 'Cambio',
  adrenaline: 'Adrenalina',
  shock: 'Desfibrilación',
  rosc: 'RCE',
};

/** Textos de cada tarjeta según su estado. */
export const TIMER_TEXT = {
  cycle: {
    label: 'Cambio',
    idle: 'Avisa «CAMBIO» cada 2 min',
    ok: 'Compresiones',
    warn: 'Prepara el cambio',
    due: '¡CAMBIO! Tocá para seguir',
    ended: 'RCE registrado',
  },
  adrenaline: {
    label: 'Adrenalina',
    action: 'Dosis dada',
    idle: 'Empieza a contar con la primera dosis',
    ok: 'Próxima dosis',
    warn: 'Prepara la dosis',
    due: '¡ADRENALINA! Tocá «Dosis dada»',
    ended: 'RCE registrado',
  },
};

export const STORAGE_KEY = 'rcp-session-v5';
