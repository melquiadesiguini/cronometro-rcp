import styles from './TimerCard.module.css';

/**
 * Tarjeta de un temporizador (CAMBIO o ADRENALINA).
 * `phase` decide el color: idle, ok, warn, due o ended.
 * `children` permite agregar controles extra (por ejemplo, el selector de minutos).
 * El botón de abajo aparece solo si se pasa `onAction` y el texto tiene `action`.
 */
export default function TimerCard({ text, value, phase, onAction, children }) {
  return (
    <div className={styles.card} data-phase={phase}>
      <div className="label">{text.label}</div>
      <div className={`num ${styles.value}`}>{value}</div>
      <div className={styles.hint}>{text[phase]}</div>
      {children}
      {onAction && text.action && (
        <button className={styles.action} onClick={onAction}>
          {text.action}
        </button>
      )}
    </div>
  );
}
