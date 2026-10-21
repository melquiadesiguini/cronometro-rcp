import { formatClock, formatElapsed } from '../../lib/format.js';
import { buildReport } from '../../lib/report.js';
import { downloadReport } from '../../lib/pdf.js';
import CopyButton from '../CopyButton/CopyButton.jsx';
import ConfirmButton from '../ConfirmButton/ConfirmButton.jsx';
import styles from './EventLog.module.css';

export default function EventLog({ session, onReset }) {
  const { startedAt, events } = session;

  return (
    <section className={styles.log}>
      <div className={styles.toolbar}>
        <div className="label">Registro</div>
        <div className={styles.actions}>
          <CopyButton getText={() => buildReport(session)} />
          {/* PDF también sin RCE (por ejemplo, si la RCP se suspende). */}
          {startedAt && (
            <button className="btn-small" onClick={() => downloadReport(session)}>
              PDF
            </button>
          )}
          <ConfirmButton onConfirm={onReset}>Reiniciar</ConfirmButton>
        </div>
      </div>

      {events.length === 0 ? (
        <p className={styles.empty}>
          Los eventos aparecerán aquí con el minuto del paro y la hora.
        </p>
      ) : (
        <ol className={styles.list}>
          {events
            .map((e, i) => (
              <li key={i} className={styles.item}>
                <span className={styles.elapsed}>{formatElapsed(e.at - startedAt)}</span>
                <span className={styles.clock}>{formatClock(e.at)}</span>
                <span>{e.name}</span>
              </li>
            ))
            .reverse()}
        </ol>
      )}
    </section>
  );
}
