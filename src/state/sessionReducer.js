import { EVENTS, PERIODS } from '../config.js';

// Todo el estado de una RCP y cómo cambia con cada acción.
// Es lógica pura (sin React ni sonido), así que es fácil de leer y de probar.

export const initialSession = {
  startedAt: null,
  endedAt: null,
  // startAt: cuándo empezó la vuelta actual. lapAt: cuándo sonó la última alarma.
  timers: {
    cycle: { startAt: null, lapAt: null },
    adrenaline: { startAt: null, lapAt: null },
  },
  events: [], // { name, at }
};

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
  return addEvents(
    setTimer({ ...initialSession, startedAt: at }, 'cycle', { startAt: at, lapAt: null }),
    EVENTS.start,
    at
  );
}

export function sessionReducer(state, action) {
  const { at } = action;

  switch (action.type) {
    case 'start':
      return start(state, at);

    case 'restartCycle':
      return setTimer(start(state, at), 'cycle', { startAt: at, lapAt: null });

    case 'rhythm': {
      const next = setTimer(start(state, at), 'cycle', { startAt: at, lapAt: null });
      return addEvents(next, EVENTS.rhythm, at);
    }

    case 'adrenaline': {
      const next = setTimer(start(state, at), 'adrenaline', { startAt: at, lapAt: null });
      return addEvents(next, EVENTS.adrenaline, at);
    }

    case 'rosc':
      return addEvents({ ...start(state, at), endedAt: at }, EVENTS.rosc, at);

    // Sonó la alarma de un temporizador: arranca la vuelta siguiente.
    // Calcula las vueltas a partir de la hora, así repetir la acción no cuenta doble.
    case 'lap': {
      const timer = state.timers[action.timer];
      if (timer.startAt == null) return state;
      const laps = Math.floor((at - timer.startAt) / PERIODS[action.timer]);
      if (laps <= 0) return state;
      const next = setTimer(state, action.timer, {
        startAt: timer.startAt + laps * PERIODS[action.timer],
        lapAt: at,
      });
      // Cada CAMBIO cuenta como un control de ritmo.
      return action.timer === 'cycle' ? addEvents(next, EVENTS.rhythm, at, laps) : next;
    }

    case 'reset':
      return initialSession;

    default:
      return state;
  }
}
