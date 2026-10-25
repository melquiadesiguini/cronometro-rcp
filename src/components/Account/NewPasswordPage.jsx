import { useState } from 'react';
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
          <label className={styles.field}>
            Contraseña nueva (mínimo 8 caracteres)
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" className={`btn-primary ${styles.primary}`} disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </section>
    </main>
  );
}
