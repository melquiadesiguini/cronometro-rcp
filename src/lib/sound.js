// Pitidos con Web Audio y voz con la síntesis de voz del navegador.
// Los navegadores solo dejan sonar audio después de que la persona toca algo,
// por eso cada botón llama a unlockAudio().

let ctx = null;
let voice = null;

function getContext() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ---- Elección de voz ----
// Cada teléfono trae sus propias voces. Se prefiere una de Argentina; si no hay,
// la más parecida (rioplatense y latinoamericanas) y, por último, la de España.
// La persona puede elegir otra desde «Probar sonido»; se guarda en el navegador.

const VOICE_KEY = 'rcp-voice';
const LANG_PREFERENCE = ['es-AR', 'es-UY', 'es-PY', 'es-CL', 'es-419', 'es-US', 'es-MX', 'es-CO'];

const langRank = (lang = '') => {
  const i = LANG_PREFERENCE.findIndex((l) => lang.toLowerCase().replace('_', '-') === l.toLowerCase());
  return i === -1 ? LANG_PREFERENCE.length : i;
};

/** Voces en español del dispositivo, de la más argentina a la menos. */
export function getSpanishVoices() {
  try {
    return speechSynthesis
      .getVoices()
      .filter((v) => /^es/i.test(v.lang))
      .sort((a, b) => langRank(a.lang) - langRank(b.lang));
  } catch {
    return [];
  }
}

function savedVoiceName() {
  try {
    return localStorage.getItem(VOICE_KEY);
  } catch {
    return null;
  }
}

function pickVoice() {
  const voices = getSpanishVoices();
  voice = voices.find((v) => v.name === savedVoiceName()) || voices[0] || null;
}

/** Nombre de la voz que se está usando. */
export const currentVoiceName = () => voice?.name ?? '';

/** Elige una voz por su nombre y la recuerda. */
export function setVoice(name) {
  try {
    localStorage.setItem(VOICE_KEY, name);
  } catch {
    // Sin almacenamiento: vale hasta recargar.
  }
  pickVoice();
}

/** Avisa cuando el navegador termina de cargar las voces (llegan con demora). */
export function onVoicesChanged(callback) {
  try {
    speechSynthesis.addEventListener('voiceschanged', callback);
    return () => speechSynthesis.removeEventListener('voiceschanged', callback);
  } catch {
    return () => {};
  }
}

try {
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
} catch {
  // El navegador no tiene síntesis de voz: solo sonarán los pitidos.
}

function beep(freq, duration, delay = 0, volume = 0.35) {
  const c = getContext();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

function say(word) {
  try {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = voice ? voice.lang : 'es-ES';
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.volume = 1;
    speechSynthesis.speak(u);
  } catch {
    // Sin voz disponible.
  }
}

/** Habilita el audio y la voz. Llamar desde un toque de la persona. */
export function unlockAudio() {
  getContext();
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch {
    // Sin voz disponible.
  }
}

/** Tres pitidos, la palabra dicha dos veces y vibración. */
export function playAlarm({ word, freq }) {
  [0, 0.25, 0.5].forEach((d) => beep(freq, 0.18, d));
  setTimeout(() => {
    say(word);
    say(word);
  }, 800);
  try {
    navigator.vibrate?.([300, 120, 300, 120, 300]);
  } catch {
    // Sin vibración.
  }
}

export function stopVoice() {
  try {
    speechSynthesis.cancel();
  } catch {
    // Sin voz disponible.
  }
}
