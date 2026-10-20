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

function pickSpanishVoice() {
  try {
    voice = speechSynthesis.getVoices().find((v) => /^es/i.test(v.lang)) || null;
  } catch {
    voice = null;
  }
}

try {
  pickSpanishVoice();
  speechSynthesis.onvoiceschanged = pickSpanishVoice;
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
