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

// ---- Elección de voz (automática, sin selector) ----
// Cada teléfono trae sus propias voces y no informan si son de mujer o de hombre,
// así que se reconoce por el nombre. Se elige, en este orden:
//   1. voz de mujer con acento argentino (o lo más parecido: uruguayo, latinoamericano…)
//   2. cualquier voz de mujer en español
//   3. cualquier voz en español

const LANG_PREFERENCE = ['es-AR', 'es-UY', 'es-PY', 'es-CL', 'es-419', 'es-US', 'es-MX', 'es-CO'];

// Nombres de las voces de mujer más comunes en Windows, Edge, Android, iPhone y Mac.
const FEMALE =
  /female|mujer|elena|helena|laura|sabina|paulina|m[oó]nica|luc[ií]a|isabela|dalia|paloma|camila|valentina|sof[ií]a|marisol|elvira|esperanza|francisca|catalina|ximena|larissa|salom[eé]|andrea|pen[eé]lope|conchita|lupe|marta|beatriz|carmen|renata|abril|nuria|teresa|vera|irene|google espa[nñ]ol/i;
const MALE =
  /\bmale\b|hombre|pablo|jorge|diego|tom[aá]s|ra[uú]l|[aá]lvaro|juan|carlos|jaime|enrique|gonzalo|alonso|lorenzo|mateo|gerardo|federico|andr[eé]s|emilio|alberto|sergio|miguel|javier|mario|alex|reed|eddy|rocko|grandpa/i;

const langRank = (lang = '') => {
  const i = LANG_PREFERENCE.findIndex((l) => lang.toLowerCase().replace('_', '-') === l.toLowerCase());
  return i === -1 ? LANG_PREFERENCE.length : i;
};

// Menor puntaje = mejor. Ser de mujer pesa más que el acento.
const score = (v) => {
  const female = FEMALE.test(v.name) && !MALE.test(v.name.replace(/female/i, '')) ? 0 : 1;
  return female * 100 + langRank(v.lang);
};

function pickVoice() {
  try {
    const voices = speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang));
    voice = voices.sort((a, b) => score(a) - score(b))[0] || null;
  } catch {
    voice = null;
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
