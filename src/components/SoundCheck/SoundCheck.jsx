import { useEffect, useState } from 'react';
import { ALARMS } from '../../config.js';
import {
  currentVoiceName,
  getSpanishVoices,
  onVoicesChanged,
  playAlarm,
  setVoice,
  unlockAudio,
} from '../../lib/sound.js';
import styles from './SoundCheck.module.css';

/** Nombre corto para mostrar: «Elena (Argentina)» en vez del nombre técnico completo. */
function voiceLabel(v) {
  const country = new Intl.DisplayNames(['es'], { type: 'region' });
  const region = v.lang.split(/[-_]/)[1];
  let place = region;
  try {
    place = country.of(region.toUpperCase());
  } catch {
    // Código de región desconocido: se muestra tal cual.
  }
  const name = v.name.replace(/^(Microsoft|Google)\s+/i, '').split(/\s+[-–(]/)[0];
  return `${name} (${place})`;
}

export default function SoundCheck() {
  const [voices, setVoices] = useState(getSpanishVoices);
  const [selected, setSelected] = useState(currentVoiceName);

  // Las voces llegan con demora en algunos navegadores.
  useEffect(
    () =>
      onVoicesChanged(() => {
        setVoices(getSpanishVoices());
        setSelected(currentVoiceName());
      }),
    []
  );

  const test = () => {
    unlockAudio();
    playAlarm(ALARMS.cycle);
    setTimeout(() => playAlarm(ALARMS.adrenaline), 3500);
  };

  const choose = (e) => {
    setVoice(e.target.value);
    setSelected(currentVoiceName());
    unlockAudio();
    playAlarm(ALARMS.cycle);
  };

  return (
    <div className={styles.box}>
      <div className={styles.row}>
        <p className={styles.note}>
          Las alarmas hablan en voz alta. Comprueba el volumen antes de salir.
        </p>
        <button className="btn-small" onClick={test}>
          Probar sonido
        </button>
      </div>

      {voices.length > 1 && (
        <label className={styles.voice}>
          <span>Voz</span>
          <select id="voice-select" value={selected} onChange={choose}>
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {voiceLabel(v)}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
