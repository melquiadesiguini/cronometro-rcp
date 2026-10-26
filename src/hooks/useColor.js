import { useEffect, useState } from 'react';

const KEY = 'rcp-color';

/** Paletas disponibles. `swatch` es el color del círculo para elegirla. */
export const COLORS = [
  { id: 'rosa', label: 'Rosa', swatch: '#e0407f' },
  { id: 'azul', label: 'Azul', swatch: '#1f6fd1' },
  { id: 'verde', label: 'Verde', swatch: '#0f9d76' },
  { id: 'violeta', label: 'Violeta', swatch: '#7048e8' },
];

function initialColor() {
  try {
    const saved = localStorage.getItem(KEY);
    if (COLORS.some((c) => c.id === saved)) return saved;
  } catch {
    // Sin almacenamiento: paleta por defecto.
  }
  return 'rosa';
}

/** Paleta de colores elegida. Se guarda en el dispositivo. */
export function useColor() {
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    document.documentElement.dataset.color = color;
    // La barra del navegador en el celular toma el color de fondo de la paleta.
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
    try {
      localStorage.setItem(KEY, color);
    } catch {
      // Sin almacenamiento: vale hasta recargar.
    }
  }, [color]);

  return { color, setColor };
}
