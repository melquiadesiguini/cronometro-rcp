import { formatClock, formatElapsed } from '../../lib/format.js';
import styles from './TotalTime.module.css';

export default function TotalTime({ elapsed, startedAt, onStart }) {
  return (
    <>
      <section className={styles.total}>
        <div className="label">Tiempo total de paro</div>
        <div className={`num ${styles.value}`}>{formatElapsed(elapsed)}</div>
        <div className={styles.sub}>
          {startedAt
            ? `Inicio a las ${formatClock(startedAt)}`
            : 'Pulsa iniciar al comenzar las compresiones'}
        </div>
      </section>

      {!startedAt && (
        <button className={`btn-primary ${styles.start}`} onClick={onStart}>
          Iniciar RCP
        </button>
      )}
    </>
  );
}
