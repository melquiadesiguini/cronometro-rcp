import { useState } from 'react';
import { formatClock, formatDate } from '../../lib/format.js';
import styles from './Account.module.css';

/**
 * La cuenta se abrió en otro dispositivo. Desde acá se puede volver a usarla en este
 * (el otro queda bloqueado) o cerrar la sesión.
 */
export default function DeviceBlockedPage({ account }) {
  const { device, user, actions } = account;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const useHere = async () => {
    setBusy(true);
    setError('');
    try {
      await actions.useHere();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const since = device.since ? Date.parse(device.since) : null;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Cuenta abierta en otro dispositivo</h2>
        <p className={styles.note}>
          Tu cuenta ({user.email}) se está usando
          {device.label ? <> en <strong>{device.label}</strong></> : ' en otro dispositivo'}
          {since ? ` desde el ${formatDate(since)} a las ${formatClock(since)}` : ''}. Cada cuenta se
          puede usar en un solo dispositivo a la vez.
        </p>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button className={`btn-primary ${styles.primary}`} onClick={useHere} disabled={busy}>
          {busy ? 'Un momento…' : 'Usar en este dispositivo'}
        </button>
        <p className={styles.note}>Si la usás acá, el otro dispositivo va a quedar bloqueado.</p>

        <button className="btn-small" onClick={actions.signOut}>
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
