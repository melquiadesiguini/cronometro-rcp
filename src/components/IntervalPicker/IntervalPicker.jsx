import styles from './IntervalPicker.module.css';

/** Botones para elegir un intervalo en minutos (por ejemplo 3, 4 o 5). */
export default function IntervalPicker({ options, value, onChange, label }) {
  return (
    <div className={styles.picker} role="group" aria-label={label}>
      {options.map((minutes) => (
        <button
          key={minutes}
          className={styles.option}
          aria-pressed={minutes === value}
          onClick={() => onChange(minutes)}
        >
          {minutes} min
        </button>
      ))}
    </div>
  );
}
