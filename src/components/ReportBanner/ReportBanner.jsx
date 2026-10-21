import { useState } from 'react';
import { formatClock, formatElapsed } from '../../lib/format.js';
import { downloadReport } from '../../lib/pdf.js';
import styles from './ReportBanner.module.css';

/** Aparece al registrar RCE: resume la RCP y ofrece descargar el PDF. */
export default function ReportBanner({ session }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await downloadReport(session);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.banner}>
      <div className={styles.text}>
        <div className={styles.title}>RCP finalizada</div>
        <div className={styles.sub}>
          {formatClock(session.startedAt)} – {formatClock(session.endedAt)} · duración{' '}
          {formatElapsed(session.endedAt - session.startedAt)}
        </div>
      </div>
      <button className={`btn-primary ${styles.button}`} onClick={download} disabled={busy}>
        {busy ? 'Generando…' : 'Descargar PDF'}
      </button>
    </section>
  );
}
