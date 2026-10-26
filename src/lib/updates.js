import { registerSW } from 'virtual:pwa-register';
import { STORAGE_KEY } from '../config.js';
import { rcpInProgress } from './access.js';

// Actualizaciones de la app instalada (PWA).
// Busca versiones nuevas al abrir, cada 15 minutos y al volver a la pantalla. Si hay una,
// la aplica recargando la página, salvo durante una RCP: ahí espera a que termine,
// porque recargar en medio de un paro dejaría las alarmas sin sonido hasta tocar algo.

const CHECK_EVERY_MS = 15 * 60_000;
const RETRY_DURING_RCP_MS = 30_000;

export function setupUpdates() {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      const apply = () => {
        if (rcpInProgress(STORAGE_KEY)) setTimeout(apply, RETRY_DURING_RCP_MS);
        else updateSW(true);
      };
      apply();
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update();
      });
    },
  });
}
