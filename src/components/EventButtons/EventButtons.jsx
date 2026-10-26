import { RHYTHMS } from '../../config.js';
import styles from './EventButtons.module.css';

/**
 * Botones que registran eventos. Cada uno muestra cuántas veces se usó.
 * Arriba: Adrenalina, Amiodarona y Lidocaína. Abajo: Ritmos, en dos grupos
 * (desfibrilables y no desfibrilables) con el total de desfibrilaciones.
 * (El contador de Cambio está en la tarjeta de CAMBIO.)
 */
export default function EventButtons({
  counts,
  onAdrenaline,
  onAmiodarone,
  onLidocaine,
  onRhythm,
  onRosc,
}) {
  const drugs = [
    { label: 'Adrenalina', count: counts.adrenaline, onClick: onAdrenaline },
    { label: 'Amiodarona', count: counts.amiodarone, onClick: onAmiodarone },
    { label: 'Lidocaína', count: counts.lidocaine, onClick: onLidocaine },
  ];
  const groups = [
    { title: 'Desfibrilables', shockable: true },
    { title: 'No desfibrilables', shockable: false },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.drugs}>
        {drugs.map(({ label, count, onClick }) => (
          <button key={label} className={styles.event} onClick={onClick}>
            <span className={styles.inner}>
              <span className={styles.label}>{label}</span>
              <span className={styles.count}>{count}</span>
            </span>
          </button>
        ))}
      </div>

      <section className={styles.rhythms}>
        <div className={styles.rhythmsHeader}>
          <h2 className={styles.rhythmsTitle}>Ritmos</h2>
          <div className={styles.shocks}>
            <span className={`num ${styles.shocksNum}`}>{counts.shocks}</span>
            <span className={styles.shocksLabel}>
              {counts.shocks === 1 ? 'desfibrilación' : 'desfibrilaciones'}
            </span>
          </div>
        </div>

        <div className={styles.groups}>
          {groups.map((g) => (
            <div key={g.title} className={styles.group} data-shockable={g.shockable}>
              <div className={styles.groupTitle}>{g.title}</div>
              <div className={styles.groupButtons}>
                {RHYTHMS.filter((r) => r.shockable === g.shockable).map((r) => (
                  <button
                    key={r.key}
                    className={`${styles.event} ${styles.rhythm}`}
                    onClick={() => onRhythm(r.key)}
                    aria-label={`${r.name}${r.shockable ? ', suma una desfibrilación' : ''}`}
                  >
                    <span className={styles.inner}>
                      <span className={styles.label}>{r.label}</span>
                      <span className={styles.count}>{counts.rhythms[r.key]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <button className={`${styles.event} ${styles.rosc}`} onClick={onRosc}>
        RCE · pulso recuperado
      </button>
    </div>
  );
}
