import styles from './Background.module.css';

/**
 * Fondo decorativo: un patrón casi invisible con estrella de la vida, ambulancia,
 * electrocardiograma y cruz. Entre los dibujos aparecen, todavía más tenues, el 7 y el 12.
 * Usa los colores del tema, así que se adapta solo al modo claro y oscuro.
 */
export default function Background() {
  return (
    <svg className={styles.background} aria-hidden="true" focusable="false">
      <defs>
        <pattern
          id="health-pattern"
          width="180"
          height="180"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-8)"
        >
          {/* Estrella de la vida: tres barras cruzadas y la vara en el centro */}
          <g transform="translate(38 40)">
            <rect x="-5" y="-18" width="10" height="36" rx="2" />
            <rect x="-5" y="-18" width="10" height="36" rx="2" transform="rotate(60)" />
            <rect x="-5" y="-18" width="10" height="36" rx="2" transform="rotate(120)" />
            <rect x="-1" y="-12" width="2" height="24" className={styles.cutout} />
          </g>

          {/* Ambulancia */}
          <g transform="translate(104 18)">
            <rect x="0" y="6" width="34" height="22" rx="3" />
            <path d="M34 12h9l7 8v8H34z" />
            <circle cx="10" cy="30" r="4.5" className={styles.wheel} />
            <circle cx="40" cy="30" r="4.5" className={styles.wheel} />
            <path d="M15 11h4v4h4v4h-4v4h-4v-4h-4v-4h4z" className={styles.cutout} />
          </g>

          {/* Electrocardiograma: cruza todo el ancho para que la línea sea continua */}
          <polyline
            className={styles.line}
            points="0,108 46,108 54,108 60,92 67,126 73,100 79,108 120,108 128,108 133,100 138,108 180,108"
          />

          {/* Cruz */}
          <path d="M146 140h8v-8h8v8h8v8h-8v8h-8v-8h-8z" />

          {/* Los números, un poco más grandes que los dibujos */}
          <text x="110" y="176" className={styles.number}>
            7
          </text>
          <text x="10" y="172" className={styles.number}>
            12
          </text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#health-pattern)" />
    </svg>
  );
}
