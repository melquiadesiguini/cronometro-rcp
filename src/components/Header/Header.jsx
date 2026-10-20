import { formatClock, formatDate } from '../../lib/format.js';
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx';
import styles from './Header.module.css';

export default function Header({ now }) {
  return (
    <header className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Cronómetro RCP</h1>
        <ThemeToggle />
      </div>
      <div className={styles.datetime}>
        <span className={styles.date}>{formatDate(now)}</span>
        <span className={`num ${styles.time}`}>{formatClock(now)}</span>
      </div>
    </header>
  );
}
