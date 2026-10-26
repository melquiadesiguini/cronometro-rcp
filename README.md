# Cronómetro RCP

Temporizador de apoyo para reanimación cardiopulmonar, pensado para el celular.

- **Tiempo total** del paro desde que se pulsa «Iniciar RCP».
- **CAMBIO a los 2:00**: aviso por voz, pitido y vibración. El cronómetro queda en 0:00 en alarma hasta tocar Cambio, que suma uno y arranca otra cuenta.
- **Acceso pago**: USD 10 cada 6 meses (en pesos al dólar oficial, con Mercado Pago). Sin prueba gratis.
- **ADRENALINA a los 3, 4 o 5 min** (a elección): empieza con la primera dosis; al llegar a cero queda en alarma hasta tocar «Dosis dada».
- **Adrenalina** y **Amiodarona**: contadores (suman al tocarlos).
- **Ritmos**: FV y TVSP (desfibrilables, suman también al total de desfibrilaciones), AESP y Asistolia (no desfibrilables). El PDF muestra el total de desfibrilaciones y cuántos de cada ritmo.
- **Registro** de eventos con minuto del paro y hora, copiable.
- **PDF**: al registrar RCE aparece «Descargar PDF» con el informe completo (también desde el botón PDF del registro).
- **Funciona sin internet**: es una app instalable (PWA). Después de abrirla una vez con conexión, anda sin señal y se puede agregar a la pantalla de inicio.

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
│   ├── Background/        fondo de dibujos de salud y ambulancia (con el 7 y el 12)
│   ├── Header/            título, fecha y hora
│   ├── ThemeToggle/       botón de tema claro/oscuro
│   ├── ColorPicker/       elegir la paleta: rosa, azul, verde o violeta
│   ├── TotalTime/         tiempo total y botón Iniciar RCP
│   ├── TimerCard/         tarjeta reutilizable (CAMBIO con su contador, y ADRENALINA)
│   ├── EventButtons/      Adrenalina, Amiodarona, Ritmos (FV, TVSP, AESP, Asistolia) y RCE
│   ├── IntervalPicker/    elegir 3, 4 o 5 minutos de adrenalina
│   ├── EventLog/          registro de eventos
│   ├── ReportBanner/      aviso «RCP finalizada» con Descargar PDF
│   ├── CopyButton/        copiar al portapapeles
│   └── ConfirmButton/     botón que pide confirmar (Reiniciar)
├── hooks/                 ← lógica de React reutilizable
│   ├── useRcpSession.js   une estado, reloj, alarmas y pantalla encendida
│   ├── useCountdown.js    cuenta regresiva que se detiene en 0:00
│   ├── useNow.js          hora actual que se actualiza sola
│   ├── useTheme.js        tema claro/oscuro (recuerda la elección)
│   ├── useColor.js        paleta de colores (recuerda la elección)
│   └── useWakeLock.js     evita que se apague la pantalla
├── state/
│   └── sessionReducer.js  todo el estado de la RCP y cómo cambia (lógica pura)
├── lib/                   ← funciones sin React
│   ├── sound.js           pitidos, voz y vibración
│   ├── format.js          formato de tiempos
│   ├── storage.js         guarda la sesión si se recarga la página
│   ├── report.js          texto del registro para copiar
│   └── pdf.js             informe en PDF (se genera en el teléfono)
└── styles/
    ├── global.css         colores de la paleta rosa (claro y oscuro), tipografías y botones base
    └── palettes.css       paletas azul, verde y violeta
```

### Cambios típicos

- **Cambiar un tiempo o una palabra de alarma** → `src/config.js`.
- **Agregar un botón de evento** → agregá el nombre en `EVENTS` (`config.js`), un `case` en
  `sessionReducer.js`, la acción en `useRcpSession.js` y el botón en `EventButtons.jsx`.
- **Cambiar colores** → variables al principio de `src/styles/global.css`.
