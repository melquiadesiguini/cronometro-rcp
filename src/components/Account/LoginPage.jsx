import { useState } from 'react';
import { PLAN } from '../../config.js';
import { isStrongPassword } from '../../lib/password.js';
import PasswordField from './PasswordField.jsx';
import styles from './Account.module.css';

/** Logo de Google (los colores oficiales, tal como pide Google en su botón). */
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/**
 * Ingreso con email y contraseña. Quien no tiene cuenta puede registrarse
 * con email o entrar directo con su cuenta de Google. Incluye «olvidé mi contraseña».
 */
export default function LoginPage({ actions }) {
  const [mode, setMode] = useState('login'); // login | register | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const go = (m) => {
    setMode(m);
    setError('');
    setInfo('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    if (mode === 'register' && !isStrongPassword(password)) {
      setError('La contraseña no cumple todos los requisitos.');
      setBusy(false);
      return;
    }
    try {
      if (mode === 'login') await actions.signIn(email.trim(), password);
      if (mode === 'register') {
        await actions.signUp(email.trim(), password, name.trim());
        setInfo('¡Listo! Te mandamos un email para confirmar tu cuenta. Abrí el enlace y volvé a ingresar.');
      }
      if (mode === 'reset') {
        await actions.resetPassword(email.trim());
        setInfo('Si el email tiene cuenta, te llegará un enlace para crear una contraseña nueva.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    try {
      await actions.signInWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  };

  const titles = { login: 'Ingresar', register: 'Crear cuenta', reset: 'Recuperar contraseña' };
  const buttons = { login: 'Ingresar', register: 'Crear cuenta', reset: 'Enviar enlace' };

  return (
    <main className={styles.page}>
      <header className={styles.brand}>
        <h1 className={styles.brandTitle}>Cronómetro RCP</h1>
        <p className={styles.brandSub}>
          {PLAN.priceLabel}. Creá tu cuenta y activala con Mercado Pago.
        </p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{titles[mode]}</h2>

        {mode !== 'reset' && (
          <>
            <button type="button" className={styles.google} onClick={google}>
              <GoogleIcon />
              Continuar con Google
            </button>
            <div className={styles.divider}>o con tu email</div>
          </>
        )}

        <form className={styles.form} onSubmit={submit}>
          {mode === 'register' && (
            <label className={styles.field}>
              Nombre y apellido
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
          )}
          <label className={styles.field}>
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {mode !== 'reset' && (
            <PasswordField
              id="password"
              label="Contraseña"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              showRules={mode === 'register'}
            />
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}
          {info && <p className={styles.info} role="status">{info}</p>}

          <button type="submit" className={`btn-primary ${styles.primary}`} disabled={busy}>
            {busy ? 'Un momento…' : buttons[mode]}
          </button>
        </form>

        <div className={styles.links}>
          {mode === 'login' && (
            <>
              <button type="button" className={styles.link} onClick={() => go('register')}>
                No tengo cuenta
              </button>
              <button type="button" className={styles.link} onClick={() => go('reset')}>
                Olvidé mi contraseña
              </button>
            </>
          )}
          {mode !== 'login' && (
            <button type="button" className={styles.link} onClick={() => go('login')}>
              Ya tengo cuenta: ingresar
            </button>
          )}
        </div>
      </section>

      <p className={`${styles.note} ${styles.legal}`}>
        Al crear una cuenta aceptás los <a href={PLAN.termsUrl}>términos y condiciones</a> y la{' '}
        <a href={PLAN.privacyUrl}>política de privacidad</a>. Herramienta de apoyo para cronometrar: no
        sustituye los protocolos de tu servicio ni el criterio clínico. ·{' '}
        <a href={`${PLAN.termsUrl}#arrepentimiento`}>Botón de arrepentimiento</a>
      </p>
    </main>
  );
}
