import { PERIODS, TIMER_TEXT } from './config.js';
import { formatCountdown } from './lib/format.js';
import { useRcpSession } from './hooks/useRcpSession.js';
import Header from './components/Header/Header.jsx';
import TotalTime from './components/TotalTime/TotalTime.jsx';
import TimerCard from './components/TimerCard/TimerCard.jsx';
import SoundCheck from './components/SoundCheck/SoundCheck.jsx';
import EventButtons from './components/EventButtons/EventButtons.jsx';
import EventLog from './components/EventLog/EventLog.jsx';
import styles from './App.module.css';

export default function App() {
  const rcp = useRcpSession();
  const { session, actions } = rcp;

  // Antes de empezar, el ciclo muestra 2:00 y la adrenalina --:-- (cuenta desde la primera dosis).
  const placeholder = {
    cycle: formatCountdown(PERIODS.cycle),
    adrenaline: '--:--',
  };
  const card = (key, { left, phase }) => ({
    text: TIMER_TEXT[key],
    phase: rcp.ended ? 'ended' : phase,
    value: left == null ? placeholder[key] : formatCountdown(left),
  });

  return (
    <main className={styles.app}>
      <Header now={rcp.now} />

      <TotalTime elapsed={rcp.elapsed} startedAt={session.startedAt} onStart={actions.start} />

      <div className={styles.timers}>
        <TimerCard {...card('cycle', rcp.cycle)} onAction={actions.restartCycle} />
        <TimerCard {...card('adrenaline', rcp.adrenaline)} onAction={actions.adrenaline} />
      </div>

      <SoundCheck />

      <EventButtons
        counts={rcp.counts}
        onRhythm={actions.rhythm}
        onAdrenaline={actions.adrenaline}
        onRosc={actions.rosc}
      />

      <EventLog session={session} onReset={actions.reset} />

      <p className={styles.disclaimer}>
        Herramienta de apoyo para cronometrar. No sustituye los protocolos de tu servicio ni el
        criterio clínico. La pantalla se mantiene encendida mientras esté abierta, si el
        dispositivo lo permite.
      </p>
    </main>
  );
}
