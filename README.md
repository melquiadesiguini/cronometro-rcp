# Cronómetro RCP

Temporizador de apoyo para reanimación cardiopulmonar, pensado para el celular.

- **Tiempo total** del paro desde que se pulsa «Iniciar RCP».
- **CAMBIO cada 2:00**: aviso por voz, pitido y vibración; se reinicia solo y suma un cambio en el registro.
- **ADRENALINA cada 3, 4 o 5 min** (a elección): empieza a contar con la primera dosis y vuelve a empezar con cada dosis registrada.
- **Desfibrilación**: contador de descargas.
- **Registro** de eventos con minuto del paro y hora, copiable.

> Herramienta de apoyo para cronometrar. No sustituye los protocolos del servicio ni el criterio clínico.

## Uso

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5173 y recarga al guardar
npm run build    # genera la versión final en dist/
```

Cada `git push` a `main` publica la app en GitHub Pages
(Settings → Pages → Source: **GitHub Actions**).

## Estructura

```
src/
├── config.js              ← tiempos, palabras de las alarmas y textos (empezá por acá)
├── App.jsx                ← arma la pantalla con los componentes
├── components/            ← piezas visuales, cada una con su .jsx y su .module.css
│   ├── Header/            título, fecha y hora
│   ├── ThemeToggle/       botón de tema claro/oscuro
│   ├── TotalTime/         tiempo total y botón Iniciar RCP
│   ├── TimerCard/         tarjeta reutilizable (CAMBIO y ADRENALINA)
│   ├── SoundCheck/        botón Probar sonido
│   ├── EventButtons/      Cambio, Adrenalina, Desfibrilación y RCE
│   ├── IntervalPicker/    elegir 3, 4 o 5 minutos de adrenalina
│   ├── EventLog/          registro de eventos
│   ├── CopyButton/        copiar al portapapeles
│   └── ConfirmButton/     botón que pide confirmar (Reiniciar)
├── hooks/                 ← lógica de React reutilizable
│   ├── useRcpSession.js   une estado, reloj, alarmas y pantalla encendida
│   ├── useRepeatingTimer.js  cuenta regresiva que se repite sola
│   ├── useNow.js          hora actual que se actualiza sola
│   ├── useTheme.js        tema claro/oscuro (recuerda la elección)
│   └── useWakeLock.js     evita que se apague la pantalla
├── state/
│   └── sessionReducer.js  todo el estado de la RCP y cómo cambia (lógica pura)
├── lib/                   ← funciones sin React
│   ├── sound.js           pitidos, voz y vibración
│   ├── format.js          formato de tiempos
│   ├── storage.js         guarda la sesión si se recarga la página
│   └── report.js          texto del registro para copiar
└── styles/
    └── global.css         colores (claro y oscuro), tipografías y botones base
```

### Cambios típicos

- **Cambiar un tiempo o una palabra de alarma** → `src/config.js`.
- **Agregar un botón de evento** → agregá el nombre en `EVENTS` (`config.js`), un `case` en
  `sessionReducer.js`, la acción en `useRcpSession.js` y el botón en `EventButtons.jsx`.
- **Cambiar colores** → variables al principio de `src/styles/global.css`.
