import { useEffect, useMemo, useReducer } from 'react';
import { ALARMS, EVENTS, RHYTHMS } from '../config.js';
import { getPeriod, initialSession, sessionReducer } from '../state/sessionReducer.js';
import { loadSession, saveSession } from '../lib/storage.js';
import { playAlarm, stopVoice, unlockAudio } from '../lib/sound.js';
import { useNow } from './useNow.js';
import { useCountdown } from './useCountdown.js';
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
    onExpire: () => {
      dispatch({ type: 'expire', timer: key, at: Date.now() });
      playAlarm(ALARMS[key]);
    },
  });
  const cycle = useCountdown(timerFor('cycle'));
  const adrenaline = useCountdown(timerFor('adrenaline'));

  const counts = useMemo(() => {
    const c = {};
    session.events.forEach((e) => (c[e.name] = (c[e.name] || 0) + 1));
    return c;
  }, [session.events]);

  // Cada acción de la persona habilita el audio antes de cambiar el estado.
  const act = (type, extra) => () => {
    unlockAudio();
    dispatch({ type, at: Date.now(), ...extra });
  };

  // Contador por ritmo y total de desfibrilaciones (FV + TVSP).
  const rhythms = Object.fromEntries(RHYTHMS.map((r) => [r.key, counts[r.event] || 0]));
  const shocks = RHYTHMS.filter((r) => r.shockable).reduce((n, r) => n + rhythms[r.key], 0);

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
      amiodarone: counts[EVENTS.amiodarone] || 0,
      lidocaine: counts[EVENTS.lidocaine] || 0,
      rhythms,
      shocks,
    },
    actions: {
      start: act('start'),
      change: act('change'),
      adrenaline: act('adrenaline'),
      amiodarone: act('amiodarone'),
      lidocaine: act('lidocaine'),
      rhythm: (key) => act('rhythm', { rhythm: key })(),
      rosc: act('rosc'),
      setAdrenalineMinutes: (minutes) => dispatch({ type: 'setAdrenalineMinutes', minutes }),
      reset: () => {
        stopVoice();
        dispatch({ type: 'reset' });
      },
    },
  };
}
