import { useState } from 'react';

/** Copia al portapapeles el texto que devuelve `getText`. */
export default function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = getText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Navegadores viejos: copia con un textarea temporal.
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button className="btn-small" onClick={copy}>
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}
