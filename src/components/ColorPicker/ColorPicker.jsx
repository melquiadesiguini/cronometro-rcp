import { COLORS, useColor } from '../../hooks/useColor.js';
import styles from './ColorPicker.module.css';

/** Cuatro círculos para elegir la paleta de colores de la app. */
export default function ColorPicker() {
  const { color, setColor } = useColor();

  return (
    <div className={styles.picker} role="radiogroup" aria-label="Color de la app">
      {COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={color === c.id}
          className={styles.option}
          onClick={() => setColor(c.id)}
        >
          <span className={styles.swatch} style={{ background: c.swatch }} aria-hidden="true">
            {color === c.id && '✓'}
          </span>
          {c.label}
        </button>
      ))}
    </div>
  );
}
