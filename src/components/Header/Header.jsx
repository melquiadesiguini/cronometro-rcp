import { formatClock } from '../../lib/format.js';
import styles from './Header.module.css';

export default function Header({ now }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Cronómetro RCP</h1>
      <span className="label">{formatClock(now)}</span>
    </header>
  );
}
