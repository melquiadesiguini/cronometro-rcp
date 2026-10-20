// Todos los valores ajustables del cronómetro están acá.

const MINUTE = 60_000;

/** Duración de cada temporizador que se repite solo. */
export const PERIODS = {
  cycle: 2 * MINUTE,
  adrenaline: 4 * MINUTE,
};

/** Cuánto antes del aviso se pone naranja la tarjeta. */
export const WARN_MS = 15_000;

/** Cuánto tiempo queda roja la tarjeta después de sonar. */
export const FLASH_MS = 8_000;

/** Lo que dice la voz y el tono del pitido de cada alarma. */
export const ALARMS = {
  cycle: { word: 'CAMBIO', freq: 880 },
  adrenaline: { word: 'ADRENALINA', freq: 660 },
};

/** Nombres de los eventos tal como aparecen en el registro. */
export const EVENTS = {
  start: 'Inicio RCP',
  rhythm: 'Ritmo revisado',
  adrenaline: 'Adrenalina',
  rosc: 'RCE',
};

/** Textos de cada tarjeta según su estado. */
export const TIMER_TEXT = {
  cycle: {
    label: 'Cambio',
    action: 'Reiniciar ciclo',
    idle: 'Avisa «CAMBIO» cada 2 min',
    ok: 'Compresiones',
    warn: 'Prepara el cambio',
    due: '¡CAMBIO! Ritmo y relevo',
    ended: 'RCE registrado',
  },
  adrenaline: {
    label: 'Adrenalina',
    action: 'Dosis dada',
    idle: 'Empieza a contar con la primera dosis',
    ok: 'Próxima dosis',
    warn: 'Prepara la dosis',
    due: '¡ADRENALINA!',
    ended: 'RCE registrado',
  },
};

export const STORAGE_KEY = 'rcp-session-v3';
