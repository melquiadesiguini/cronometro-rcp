import { ADRENALINE_OPTIONS, CYCLE_MS, TIMER_TEXT } from './config.js';
import { formatCountdown } from './lib/format.js';
import { useRcpSession } from './hooks/useRcpSession.js';
import Background from './components/Background/Background.jsx';
import Header from './components/Header/Header.jsx';
import TotalTime from './components/TotalTime/TotalTime.jsx';
import TimerCard from './components/TimerCard/TimerCard.jsx';
import IntervalPicker from './components/IntervalPicker/IntervalPicker.jsx';
import EventButtons from './components/EventButtons/EventButtons.jsx';
import EventLog from './components/EventLog/EventLog.jsx';
import ReportBanner from './components/ReportBanner/ReportBanner.jsx';
import styles from './App.module.css';

export default function App({ onAccount, accountWarning }) {
  const rcp = useRcpSession();
  const { session, actions } = rcp;

  // Antes de empezar, el ciclo muestra 2:00 y la adrenalina --:-- (cuenta desde la primera dosis).
  const placeholder = {
    cycle: formatCountdown(CYCLE_MS),
    adrenaline: '--:--',
  };
  const card = (key, { left, phase }) => ({
    text: TIMER_TEXT[key],
    phase: rcp.ended ? 'ended' : phase,
    value: left == null ? placeholder[key] : formatCountdown(left),
  });

  return (
    <main className={styles.app}>
      <Background />

      {/* Pantalla principal: ocupa todo el alto visible; el registro queda debajo. */}
      <div className={styles.screen}>
        <Header now={rcp.now} onAccount={onAccount} accountWarning={accountWarning} />

        <TotalTime elapsed={rcp.elapsed} startedAt={session.startedAt} onStart={actions.start} />

        {rcp.ended && <ReportBanner session={session} />}

        <div className={styles.timers}>
          {/* Tarjeta de Cambio: cronómetro + contador. Tocarla suma uno y reinicia el ciclo. */}
          <TimerCard
            {...card('cycle', rcp.cycle)}
            onPress={actions.change}
            count={rcp.counts.change}
            big
          />
          <TimerCard {...card('adrenaline', rcp.adrenaline)} onAction={actions.adrenaline}>
            <IntervalPicker
              label="Cada cuántos minutos avisa la adrenalina"
              options={ADRENALINE_OPTIONS}
              value={session.adrenalineMinutes}
              onChange={actions.setAdrenalineMinutes}
            />
          </TimerCard>
        </div>

        <EventButtons
          counts={rcp.counts}
          onAdrenaline={actions.adrenaline}
          onAmiodarone={actions.amiodarone}
          onRhythm={actions.rhythm}
          onRosc={actions.rosc}
        />
      </div>

      <EventLog session={session} onReset={actions.reset} />

      <p className={styles.disclaimer}>
        Herramienta de apoyo para cronometrar. No sustituye los protocolos de tu servicio ni el
        criterio clínico. La pantalla se mantiene encendida mientras esté abierta, si el
        dispositivo lo permite.
      </p>
    </main>
  );
}
