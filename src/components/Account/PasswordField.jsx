import { useState } from 'react';
import { PASSWORD_RULES } from '../../lib/password.js';
import styles from './Account.module.css';

const EyeIcon = ({ open }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {!open && <path d="M3 3l18 18" />}
  </svg>
);

/**
 * Campo de contraseña con botón para mostrarla u ocultarla.
 * Con `showRules`, muestra los requisitos y marca en verde los que ya se cumplen.
 */
export default function PasswordField({ id, label, value, onChange, autoComplete, showRules, required = true }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordWrap}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          aria-describedby={showRules ? `${id}-rules` : undefined}
        />
        <button
          type="button"
          className={styles.eye}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          <EyeIcon open={visible} />
        </button>
      </div>

      {showRules && (
        <ul id={`${id}-rules`} className={styles.rules}>
          {PASSWORD_RULES.map((r) => {
            const ok = r.test(value);
            return (
              <li key={r.id} data-ok={ok}>
                <span aria-hidden="true">{ok ? '✓' : '•'}</span> {r.label}
                <span className="sr-only">{ok ? ' (cumplido)' : ' (falta)'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
