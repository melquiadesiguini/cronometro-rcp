import styles from './EventButtons.module.css';

/**
 * Botones que registran eventos. Cada uno muestra cuántas veces se usó.
 * (El contador de Cambio está en la tarjeta de CAMBIO.)
 */
export default function EventButtons({ counts, onAdrenaline, onShock, onAmiodarone, onRosc }) {
  const buttons = [
    { label: 'Adrenalina', count: counts.adrenaline, onClick: onAdrenaline },
    { label: 'Desfibrilación', count: counts.shock, onClick: onShock },
    { label: 'Amiodarona', count: counts.amiodarone, onClick: onAmiodarone },
  ];

  return (
    <div className={styles.grid}>
      {buttons.map(({ label, count, onClick }) => (
        <button key={label} className={styles.event} onClick={onClick}>
          <span className={styles.label}>{label}</span>
          <span className={styles.count}>{count}</span>
        </button>
      ))}
      <button className={`${styles.event} ${styles.rosc}`} onClick={onRosc}>
        RCE · pulso recuperado
      </button>
    </div>
  );
}
