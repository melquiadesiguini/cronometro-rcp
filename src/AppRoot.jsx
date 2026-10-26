import { useEffect, useState } from 'react';
import { PLAN, STORAGE_KEY } from './config.js';
import { authEnabled } from './lib/supabase.js';
import { rcpInProgress } from './lib/access.js';
import { useAccount } from './hooks/useAccount.js';
import App from './App.jsx';
import LoginPage from './components/Account/LoginPage.jsx';
import NewPasswordPage from './components/Account/NewPasswordPage.jsx';
import AccountPage from './components/Account/AccountPage.jsx';
import DeviceBlockedPage from './components/Account/DeviceBlockedPage.jsx';
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

  // Nunca se corta una RCP en curso: ni por vencimiento ni por abrirse en otro dispositivo.
  const inRcp = rcpInProgress(STORAGE_KEY);

  // Un solo dispositivo a la vez: si la cuenta se abrió en otro, se ofrece usarla acá.
  const otherDevice = account.device.status === 'other';
  if (otherDevice && !inRcp) return <DeviceBlockedPage account={account} />;

  // Sin pago al día (vencida o nunca pagó) no se puede usar el cronómetro.
  const expired = ['expired', 'inactive'].includes(account.access.status);
  if (expired && !inRcp) {
    return <AccountPage account={account} expired payResult={payResult} />;
  }
  if (view === 'account') {
    return <AccountPage account={account} onBack={() => setView('app')} payResult={payResult} />;
  }

  // Aviso corto que va en la línea de la fecha (no ocupa alto extra).
  const { status, daysLeft } = account.access;
  const days = `${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`;
  const warn = otherDevice
    ? 'Abierta en otro dispositivo'
    : status === 'expired'
      ? 'Vencida · renovar'
      : daysLeft <= PLAN.warnDays
        ? status === 'trial'
          ? `Prueba: ${days}`
          : `Vence en ${days}`
        : null;

  return <App onAccount={() => setView('account')} accountWarning={warn} />;
}
