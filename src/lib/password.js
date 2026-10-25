// Requisitos de la contraseña. Se muestran mientras se escribe y se validan antes de enviar.

export const PASSWORD_RULES = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'Una mayúscula', test: (p) => /[A-ZÁÉÍÓÚÑ]/.test(p) },
  { id: 'lower', label: 'Una minúscula', test: (p) => /[a-záéíóúñ]/.test(p) },
  { id: 'number', label: 'Un número', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Un carácter especial (!@#$%…)', test: (p) => /[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ]/.test(p) },
];

export const isStrongPassword = (p) => PASSWORD_RULES.every((r) => r.test(p));
