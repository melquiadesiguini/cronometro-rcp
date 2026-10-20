import { useEffect, useState } from 'react';

/** Devuelve la hora actual y vuelve a renderizar cada `interval` ms. */
export function useNow(interval = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
