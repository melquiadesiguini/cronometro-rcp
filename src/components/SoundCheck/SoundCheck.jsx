import { ALARMS } from '../../config.js';
import { playAlarm, unlockAudio } from '../../lib/sound.js';
import styles from './SoundCheck.module.css';

export default function SoundCheck() {
  const test = () => {
    unlockAudio();
    playAlarm(ALARMS.cycle);
    setTimeout(() => playAlarm(ALARMS.adrenaline), 3500);
  };

  return (
    <div className={styles.box}>
      <p className={styles.note}>
        Las alarmas hablan en voz alta. Comprueba el volumen antes de salir.
      </p>
      <button className="btn-small" onClick={test}>
        Probar sonido
      </button>
    </div>
  );
}
