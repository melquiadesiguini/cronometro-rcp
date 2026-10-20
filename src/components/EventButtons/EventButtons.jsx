import styles from './EventButtons.module.css';

export default function EventButtons({ counts, onRhythm, onAdrenaline, onRosc }) {
  return (
    <div className={styles.grid}>
      <button className={styles.event} onClick={onRhythm}>
        <span>Ritmo</span>
        <span className={styles.count}>{counts.rhythm}</span>
      </button>
      <button className={styles.event} onClick={onAdrenaline}>
        <span>Adrenalina</span>
        <span className={styles.count}>{counts.adrenaline}</span>
      </button>
      <button className={`${styles.event} ${styles.rosc}`} onClick={onRosc}>
        RCE · pulso recuperado
      </button>
    </div>
  );
}
