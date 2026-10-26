import { useEffect, useState } from 'react';

const KEY = 'rcp-theme';
const THEME_COLOR = { light: '#fff6f9', dark: '#0c0809' };

function initialTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Sin almacenamiento: se usa el ajuste del teléfono.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Tema claro/oscuro: arranca según el teléfono y recuerda lo que elija la persona. */
export function useTheme() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    // La barra del navegador toma el fondo de la paleta elegida.
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || THEME_COLOR[theme]);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // Sin almacenamiento: el tema vale solo hasta recargar.
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, toggle };
}
