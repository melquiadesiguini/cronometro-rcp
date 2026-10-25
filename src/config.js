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
  amiodarone: 'Amiodarona',
  rosc: 'RCE',
};

/**
 * Ritmos. Los desfibrilables (FV y TVSP) suman además al contador de desfibrilaciones.
 * `event` es como aparece en el registro y en el PDF.
 */
export const RHYTHMS = [
  { key: 'vf', label: 'FV', name: 'Fibrilación ventricular', shockable: true, event: 'FV · desfibrilación' },
  { key: 'pvt', label: 'TVSP', name: 'Taquicardia ventricular sin pulso', shockable: true, event: 'TVSP · desfibrilación' },
  { key: 'pea', label: 'AESP', name: 'Actividad eléctrica sin pulso', shockable: false, event: 'AESP' },
  { key: 'asystole', label: 'Asistolia', name: 'Asistolia', shockable: false, event: 'Asistolia' },
];

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

export const STORAGE_KEY = 'rcp-session-v6';

/** Cuentas y suscripción. El precio real en pesos se configura en Supabase (PRICE_ARS). */
export const PLAN = {
  trialDays: 7,
  months: 6,
  priceLabel: 'USD 10 cada 6 meses',
  /** Avisar que vence cuando falten estos días. */
  warnDays: 7,
  /** Email de contacto para soporte y botón de arrepentimiento. ⚠ Cambiar antes de publicar. */
  supportEmail: 'soporte@cronometrorcp.com.ar',
};
