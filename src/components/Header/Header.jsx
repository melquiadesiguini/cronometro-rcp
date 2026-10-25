import { formatClock, formatDate } from '../../lib/format.js';
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx';
import styles from './Header.module.css';

/**
 * Título, botón de tema, «Mi cuenta» (si hay cuentas activadas), fecha y hora.
 * `accountWarning` es un aviso corto (por ejemplo «Prueba: 3 días») que va en la
 * línea de la fecha, para no ocupar alto extra; al tocarlo abre «Mi cuenta».
 */
export default function Header({ now, onAccount, accountWarning }) {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Cronómetro RCP</h1>
        <div className={styles.actions}>
          {onAccount && (
            <button className={styles.account} onClick={onAccount}>
              Mi cuenta
            </button>
          )}
          <ThemeToggle />
        </div>
      </div>
      <div className={styles.datetime}>
        <span className={styles.date}>{formatDate(now)}</span>
        {accountWarning && (
          <button className={styles.warning} onClick={onAccount}>
            {accountWarning} ›
          </button>
        )}
        <span className={`num ${styles.time}`}>{formatClock(now)}</span>
      </div>
    </header>
  );
}
