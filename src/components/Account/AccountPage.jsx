import { useEffect, useState } from 'react';
import { PLAN } from '../../config.js';
import { formatDate } from '../../lib/format.js';
import ConfirmButton from '../ConfirmButton/ConfirmButton.jsx';
import { isStrongPassword } from '../../lib/password.js';
import PasswordField from './PasswordField.jsx';
import styles from './Account.module.css';

const STATUS_TEXT = {
  trial: 'Prueba gratis',
  active: 'Suscripción activa',
  expired: 'Vencida',
};

/**
 * «Mi cuenta»: estado de la suscripción, pagar o renovar, historial de pagos,
 * nombre, contraseña, cerrar sesión, eliminar cuenta y botón de arrepentimiento.
 * Si `expired` es true, es la pantalla que ve quien tiene la cuenta vencida.
 */
export default function AccountPage({ account, onBack, expired, payResult }) {
  const { user, profile, payments, access, offline, actions } = account;
  const [name, setName] = useState(profile?.full_name ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [quote, setQuote] = useState(null); // precio del día en pesos

  useEffect(() => {
    if (offline) return;
    let alive = true;
    actions.quote().then((q) => alive && setQuote(q));
    return () => {
      alive = false;
    };
  }, [offline]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al volver de Mercado Pago, el pago tarda unos segundos en acreditarse.
  useEffect(() => {
    if (payResult !== 'ok') return;
    setInfo('¡Gracias! Estamos acreditando tu pago. En unos segundos se actualiza el vencimiento.');
    const id = setInterval(actions.refresh, 4000);
    const stop = setTimeout(() => clearInterval(id), 60000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [payResult]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (payResult === 'pendiente') setInfo('Tu pago quedó pendiente. Cuando se apruebe, se actualiza solo.');
    if (payResult === 'error') setError('El pago no se completó. Podés intentarlo de nuevo.');
  }, [payResult]);

  const doIt = (key, fn, okMsg) => async (e) => {
    e?.preventDefault();
    setBusy(key);
    setError('');
    setInfo('');
    try {
      await fn();
      if (okMsg) setInfo(okMsg);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const isGoogle = user?.app_metadata?.provider === 'google';
  const canPay = access.status === 'expired' || access.daysLeft <= 30;

  return (
    <main className={styles.page}>
      {!expired && (
        <button className={`btn-small ${styles.back}`} onClick={onBack}>
          ← Volver al cronómetro
        </button>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{expired ? 'Tu acceso venció' : 'Mi cuenta'}</h2>

        <div className={styles.status} data-status={access.status}>
          <span className={styles.statusBadge}>{STATUS_TEXT[access.status]}</span>
          {access.status !== 'expired' ? (
            <>
              <span className={styles.statusDays}>{access.daysLeft}</span>
              <span className={styles.statusUntil}>
                {access.daysLeft === 1 ? 'día restante' : 'días restantes'} · vence el{' '}
                {formatDate(access.until)}
              </span>
            </>
          ) : (
            <span className={styles.statusUntil}>
              Venció el {formatDate(access.until)}. Renová para seguir usando el cronómetro.
            </span>
          )}
        </div>

        <p className={styles.price}>
          {PLAN.priceLabel} · pago único, sin débitos automáticos.
          {quote && (
            <>
              <br />
              Hoy: <strong>${quote.priceArs.toLocaleString('es-AR')}</strong> (dólar oficial a $
              {quote.rate.toLocaleString('es-AR')}). Se paga en pesos con Mercado Pago.
            </>
          )}
        </p>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {info && <p className={styles.info} role="status">{info}</p>}
        {offline && (
          <p className={styles.note}>Sin conexión: se muestra el último estado conocido.</p>
        )}

        {canPay ? (
          <button
            className={`btn-primary ${styles.primary}`}
            onClick={doIt('pay', actions.pay)}
            disabled={busy === 'pay' || offline}
          >
            {busy === 'pay'
              ? 'Abriendo Mercado Pago…'
              : access.status === 'active'
                ? 'Renovar 6 meses más'
                : 'Pagar 6 meses'}
          </button>
        ) : (
          <p className={styles.note}>Vas a poder renovar cuando falten 30 días o menos para el vencimiento.</p>
        )}
        {access.status === 'trial' && (
          <p className={styles.note}>
            Si pagás durante la prueba, los 6 meses empiezan a contar cuando termina la prueba.
          </p>
        )}
      </section>

      {payments.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Mis pagos</h2>
          <ul className={styles.history}>
            {payments.map((p) => (
              <li key={p.id}>
                <span>{formatDate(Date.parse(p.created_at))}</span>
                <span>
                  {p.currency} {Number(p.amount).toLocaleString('es-AR')}
                </span>
                <span>hasta {formatDate(Date.parse(p.period_end))}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Mis datos</h2>
        <p className={styles.note}>
          {user.email}
          {isGoogle ? ' · ingresás con Google' : ''}
        </p>
        <form className={styles.form} onSubmit={doIt('name', () => actions.updateName(name.trim()), 'Nombre guardado.')}>
          <label className={styles.field}>
            Nombre y apellido
            <input id="account-name" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="submit" className="btn-small" disabled={busy === 'name' || offline}>
            Guardar nombre
          </button>
        </form>

        {!isGoogle && (
          <form
            className={styles.form}
            onSubmit={doIt(
              'password',
              async () => {
                if (!isStrongPassword(password)) throw new Error('La contraseña no cumple todos los requisitos.');
                await actions.updatePassword(password);
                setPassword('');
              },
              'Contraseña actualizada.'
            )}
          >
            <PasswordField
              id="account-password"
              label="Contraseña nueva"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              showRules={password.length > 0}
              required={false}
            />
            <button type="submit" className="btn-small" disabled={busy === 'password' || !password || offline}>
              Cambiar contraseña
            </button>
          </form>
        )}

        <div className={styles.row}>
          <button className="btn-small" onClick={actions.signOut}>
            Cerrar sesión
          </button>
          <ConfirmButton onConfirm={doIt('delete', actions.deleteAccount)}>Eliminar mi cuenta</ConfirmButton>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Botón de arrepentimiento</h2>
        <p className={styles.note}>
          Podés arrepentirte de tu compra dentro de los 10 días corridos desde el pago, sin costo ni
          explicación (Resolución 424/2020). Escribinos a <strong>{PLAN.supportEmail}</strong> con el
          email de tu cuenta y te devolvemos el dinero.
        </p>
      </section>
    </main>
  );
}
