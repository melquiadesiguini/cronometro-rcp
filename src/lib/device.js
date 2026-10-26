// Identifica este dispositivo, para permitir un solo dispositivo activo por cuenta.

const KEY = 'rcp-device-id';

/** Identificador al azar de este dispositivo (se crea una vez y queda guardado). */
export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Sin almacenamiento (modo privado): un identificador por cada apertura.
    return (window.__rcpDeviceId ??= `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  }
}

/** Nombre legible del dispositivo, por ejemplo «Android · Chrome». */
export function deviceLabel() {
  const ua = navigator.userAgent;
  const os = /Android/i.test(ua)
    ? 'Android'
    : /iPhone|iPod/i.test(ua)
      ? 'iPhone'
      : /iPad/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
        ? 'iPad'
        : /Windows/i.test(ua)
          ? 'Windows'
          : /Macintosh/i.test(ua)
            ? 'Mac'
            : /Linux/i.test(ua)
              ? 'Linux'
              : 'Otro dispositivo';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /SamsungBrowser/.test(ua)
      ? 'Samsung Internet'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Firefox\//.test(ua)
          ? 'Firefox'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'navegador';
  return `${os} · ${browser}`;
}
