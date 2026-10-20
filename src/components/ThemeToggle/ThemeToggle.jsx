import { useTheme } from '../../hooks/useTheme.js';
import styles from './ThemeToggle.module.css';

/** Botón para pasar de tema claro a oscuro y viceversa. */
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === 'dark' ? 'claro' : 'oscuro';

  return (
    <button className={styles.toggle} onClick={toggle} aria-label={`Cambiar a tema ${next}`}>
      <span className={styles.icon} aria-hidden="true">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
      Tema {next}
    </button>
  );
}
