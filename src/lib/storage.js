import { STORAGE_KEY } from '../config.js';

// Guarda la sesión en el navegador para no perderla si se recarga la página.

export function loadSession(fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.startedAt ? { ...fallback, ...saved } : fallback;
  } catch {
    return fallback;
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Almacenamiento bloqueado (modo privado): la sesión solo vive en memoria.
  }
}
