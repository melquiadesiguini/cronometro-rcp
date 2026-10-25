import { useState } from 'react';
import { isStrongPassword } from '../../lib/password.js';
import PasswordField from './PasswordField.jsx';
import styles from './Account.module.css';

/** Aparece al abrir el enlace de «olvidé mi contraseña» que llega por email. */
export default function NewPasswordPage({ actions }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    if (!isStrongPassword(password)) {
      setError('La contraseña no cumple todos los requisitos.');
      setBusy(false);
      return;
    }
    try {
      await actions.updatePassword(password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Nueva contraseña</h2>
        <form className={styles.form} onSubmit={submit}>
          <PasswordField
            id="new-password"
            label="Contraseña nueva"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            showRules
          />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={`btn-primary ${styles.primary}`} disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </section>
    </main>
  );
}
