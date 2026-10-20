import { ADRENALINE_DEFAULT, CYCLE_MS, EVENTS, minutesToMs } from '../config.js';

// Todo el estado de una RCP y cómo cambia con cada acción.
// Es lógica pura (sin React ni sonido), así que es fácil de leer y de probar.

export const initialSession = {
  startedAt: null,
  endedAt: null,
  adrenalineMinutes: ADRENALINE_DEFAULT,
  // startAt: cuándo empezó la vuelta actual. lapAt: cuándo sonó la última alarma.
  timers: {
    cycle: { startAt: null, lapAt: null },
    adrenaline: { startAt: null, lapAt: null },
  },
  events: [], // { name, at }
};

/** Duración de cada temporizador según el estado actual. */
export function getPeriod(state, key) {
  return key === 'cycle' ? CYCLE_MS : minutesToMs(state.adrenalineMinutes);
}

const addEvents = (state, name, at, count = 1) => ({
  ...state,
  events: [...state.events, ...Array.from({ length: count }, () => ({ name, at }))],
});

const setTimer = (state, key, timer) => ({
  ...state,
  timers: { ...state.timers, [key]: timer },
});

function start(state, at) {
  if (state.startedAt) return state;
  const fresh = { ...initialSession, adrenalineMinutes: state.adrenalineMinutes, startedAt: at };
  return addEvents(setTimer(fresh, 'cycle', { startAt: at, lapAt: null }), EVENTS.start, at);
}

export function sessionReducer(state, action) {
  const { at } = action;

  switch (action.type) {
    case 'start':
      return start(state, at);

    case 'restartCycle':
      return setTimer(start(state, at), 'cycle', { startAt: at, lapAt: null });

    case 'change': {
      const next = setTimer(start(state, at), 'cycle', { startAt: at, lapAt: null });
      return addEvents(next, EVENTS.change, at);
    }

    case 'adrenaline': {
      const next = setTimer(start(state, at), 'adrenaline', { startAt: at, lapAt: null });
      return addEvents(next, EVENTS.adrenaline, at);
    }

    case 'shock':
      return addEvents(start(state, at), EVENTS.shock, at);

    case 'rosc':
      return addEvents({ ...start(state, at), endedAt: at }, EVENTS.rosc, at);

    // Cambia cada cuántos minutos avisa la adrenalina (se mantiene al reiniciar).
    case 'setAdrenalineMinutes':
      return { ...state, adrenalineMinutes: action.minutes };

    // Sonó la alarma de un temporizador: arranca la vuelta siguiente.
    // Calcula las vueltas a partir de la hora, así repetir la acción no cuenta doble.
    case 'lap': {
      const timer = state.timers[action.timer];
      if (timer.startAt == null) return state;
      const period = getPeriod(state, action.timer);
      const laps = Math.floor((at - timer.startAt) / period);
      if (laps <= 0) return state;
      const next = setTimer(state, action.timer, {
        startAt: timer.startAt + laps * period,
        lapAt: at,
      });
      // Cada CAMBIO automático se anota en el registro.
      return action.timer === 'cycle' ? addEvents(next, EVENTS.change, at, laps) : next;
    }

    case 'reset':
      return { ...initialSession, adrenalineMinutes: state.adrenalineMinutes };

    default:
      return state;
  }
}
