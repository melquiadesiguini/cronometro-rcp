import { useEffect, useState } from 'react';
import { PLAN, STORAGE_KEY } from './config.js';
import { authEnabled } from './lib/supabase.js';
import { rcpInProgress } from './lib/access.js';
import { useAccount } from './hooks/useAccount.js';
import App from './App.jsx';
import LoginPage from './components/Account/LoginPage.jsx';
import NewPasswordPage from './components/Account/NewPasswordPage.jsx';
import AccountPage from './components/Account/AccountPage.jsx';
import styles from './components/Account/Account.module.css';

/** Lee el resultado del pago cuando Mercado Pago devuelve al usuario (#pago-ok, etc.). */
function readPayResult() {
  const m = window.location.hash.match(/^#pago-(ok|pendiente|error)$/);
  if (m) history.replaceState(null, '', window.location.pathname);
  return m?.[1] ?? null;
}

/**
 * Decide qué pantalla mostrar: ingreso, nueva contraseña, cuenta vencida, mi cuenta o el cronómetro.
 * Sin proyecto de Supabase configurado, muestra el cronómetro directamente (como antes).
 */
export default function AppRoot() {
  if (!authEnabled) return <App />;
  return <WithAccount />;
}

function WithAccount() {
  const account = useAccount();
  const [view, setView] = useState('app'); // app | account
  const [payResult] = useState(readPayResult);

  useEffect(() => {
    if (payResult) setView('account');
  }, [payResult]);

  if (account.loading) return <p className={styles.note} style={{ textAlign: 'center', padding: 40 }}>Cargando…</p>;
  if (account.recovery) return <NewPasswordPage actions={account.actions} />;
  if (!account.session) return <LoginPage actions={account.actions} />;
  if (account.loadError) {
    return (
      <main className={styles.page}>
        <p className={styles.error}>
          Necesitás internet la primera vez que ingresás en este dispositivo. Conectate y volvé a abrir la app.
        </p>
      </main>
    );
  }

  const expired = account.access.status === 'expired';
  // Nunca se corta una RCP en curso, aunque la cuenta venza en el medio.
  if (expired && !rcpInProgress(STORAGE_KEY)) {
    return <AccountPage account={account} expired payResult={payResult} />;
  }
  if (view === 'account') {
    return <AccountPage account={account} onBack={() => setView('app')} payResult={payResult} />;
  }

  const warn =
    account.access.status === 'expired'
      ? 'Tu acceso venció. Terminá esta RCP y renová desde «Mi cuenta».'
      : account.access.daysLeft <= PLAN.warnDays
        ? `${account.access.status === 'trial' ? 'Tu prueba' : 'Tu suscripción'} vence en ${account.access.daysLeft} ${account.access.daysLeft === 1 ? 'día' : 'días'}.`
        : null;

  return <App onAccount={() => setView('account')} accountWarning={warn} />;
}
