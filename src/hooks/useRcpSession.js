import { useEffect, useMemo, useReducer } from 'react';
import { ALARMS, EVENTS } from '../config.js';
import { getPeriod, initialSession, sessionReducer } from '../state/sessionReducer.js';
import { loadSession, saveSession } from '../lib/storage.js';
import { playAlarm, stopVoice, unlockAudio } from '../lib/sound.js';
import { useNow } from './useNow.js';
import { useRepeatingTimer } from './useRepeatingTimer.js';
import { useWakeLock } from './useWakeLock.js';

/**
 * Une el estado de la RCP con el reloj, las alarmas y la pantalla encendida.
 * Los componentes solo usan lo que devuelve este hook.
 */
export function useRcpSession() {
  const [session, dispatch] = useReducer(sessionReducer, initialSession, loadSession);
  const now = useNow();

  useEffect(() => saveSession(session), [session]);

  const running = session.startedAt != null && session.endedAt == null;
  useWakeLock(running);

  const timerFor = (key) => ({
    timer: session.timers[key],
    period: getPeriod(session, key),
    now,
    active: running,
    onLap: () => {
      dispatch({ type: 'lap', timer: key, at: Date.now() });
      playAlarm(ALARMS[key]);
    },
  });
  const cycle = useRepeatingTimer(timerFor('cycle'));
  const adrenaline = useRepeatingTimer(timerFor('adrenaline'));

  const counts = useMemo(() => {
    const c = {};
    session.events.forEach((e) => (c[e.name] = (c[e.name] || 0) + 1));
    return c;
  }, [session.events]);

  // Cada acción de la persona habilita el audio antes de cambiar el estado.
  const act = (type) => () => {
    unlockAudio();
    dispatch({ type, at: Date.now() });
  };

  return {
    session,
    now,
    running,
    ended: session.endedAt != null,
    elapsed: session.startedAt ? (session.endedAt ?? now) - session.startedAt : 0,
    cycle,
    adrenaline,
    counts: {
      change: counts[EVENTS.change] || 0,
      adrenaline: counts[EVENTS.adrenaline] || 0,
      shock: counts[EVENTS.shock] || 0,
    },
    actions: {
      start: act('start'),
      restartCycle: act('restartCycle'),
      change: act('change'),
      adrenaline: act('adrenaline'),
      shock: act('shock'),
      rosc: act('rosc'),
      setAdrenalineMinutes: (minutes) => dispatch({ type: 'setAdrenalineMinutes', minutes }),
      reset: () => {
        stopVoice();
        dispatch({ type: 'reset' });
      },
    },
  };
}
