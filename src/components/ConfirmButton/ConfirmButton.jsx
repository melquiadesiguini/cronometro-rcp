import { useEffect, useState } from 'react';

/** Botón que pide un segundo toque antes de ejecutar `onConfirm` (para acciones que borran). */
export default function ConfirmButton({ onConfirm, children, timeout = 3000 }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), timeout);
    return () => clearTimeout(id);
  }, [armed, timeout]);

  const handleClick = () => {
    if (!armed) return setArmed(true);
    setArmed(false);
    onConfirm();
  };

  return (
    <button className="btn-small btn-danger" onClick={handleClick}>
      {armed ? '¿Seguro? Toca otra vez' : children}
    </button>
  );
}
