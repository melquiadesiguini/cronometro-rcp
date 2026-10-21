import { ADRENALINE_DEFAULT, CYCLE_MS, EVENTS, minutesToMs } from '../config.js';

// Todo el estado de una RCP y cómo cambia con cada acción.
// Es lógica pura (sin React ni sonido), así que es fácil de leer y de probar.

const stopped = { startAt: null, expiredAt: null };

export const initialSession = {
  startedAt: null,
  endedAt: null,
  adrenalineMinutes: ADRENALINE_DEFAULT,
  // startAt: cuándo arrancó la cuenta regresiva.
  // expiredAt: cuándo llegó a cero (queda en 0:00 hasta que la persona toque el botón).
  timers: {
    cycle: stopped,
    adrenaline: stopped,
  },
  events: [], // { name, at }
};

/** Duración de cada temporizador según el estado actual. */
export function getPeriod(state, key) {
  return key === 'cycle' ? CYCLE_MS : minutesToMs(state.adrenalineMinutes);
}

const addEvent = (state, name, at) => ({
  ...state,
  events: [...state.events, { name, at }],
});

const setTimer = (state, key, timer) => ({
  ...state,
  timers: { ...state.timers, [key]: timer },
});

/** Arranca de nuevo la cuenta regresiva de un temporizador. */
const restart = (state, key, at) => setTimer(state, key, { startAt: at, expiredAt: null });

function start(state, at) {
  if (state.startedAt) return state;
  const fresh = { ...initialSession, adrenalineMinutes: state.adrenalineMinutes, startedAt: at };
  return addEvent(restart(fresh, 'cycle', at), EVENTS.start, at);
}

export function sessionReducer(state, action) {
  const { at } = action;

  switch (action.type) {
    case 'start':
      return start(state, at);

    // Botón Cambio: suma uno y el ciclo vuelve a 2:00.
    case 'change':
      return addEvent(restart(start(state, at), 'cycle', at), EVENTS.change, at);

    // Dosis de adrenalina: suma uno y la cuenta vuelve a empezar.
    case 'adrenaline':
      return addEvent(restart(start(state, at), 'adrenaline', at), EVENTS.adrenaline, at);

    case 'shock':
      return addEvent(start(state, at), EVENTS.shock, at);

    case 'amiodarone':
      return addEvent(start(state, at), EVENTS.amiodarone, at);

    case 'rosc':
      return addEvent({ ...start(state, at), endedAt: at }, EVENTS.rosc, at);

    // Cambia cada cuántos minutos avisa la adrenalina (se mantiene al reiniciar).
    case 'setAdrenalineMinutes':
      return { ...state, adrenalineMinutes: action.minutes };

    // Un temporizador llegó a cero: queda detenido en 0:00 y en alarma.
    // No arranca otra cuenta ni suma nada: eso pasa solo cuando la persona toca el botón.
    case 'expire': {
      const timer = state.timers[action.timer];
      if (timer.startAt == null || timer.expiredAt != null) return state;
      if (at - timer.startAt < getPeriod(state, action.timer)) return state;
      return setTimer(state, action.timer, { ...timer, expiredAt: at });
    }

    case 'reset':
      return { ...initialSession, adrenalineMinutes: state.adrenalineMinutes };

    default:
      return state;
  }
}
