// Tiny synthesized sound effects (Web Audio API) – no asset files, fully offline.
// Sounds are opt-in and only played from the beamer window.

let ctx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Call once on a user gesture so the audio context is allowed to start.
export function unlockAudio() {
  getCtx();
}

function tone(freq, start, dur, type = 'sine', gain = 0.2) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(g);
  g.connect(c.destination);
  const t0 = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

// Short bright "ding" when a match is won.
export function playDing() {
  tone(880, 0, 0.16, 'triangle', 0.22);
  tone(1320, 0.06, 0.22, 'triangle', 0.14);
}

// Little celebratory fanfare for the champion.
export function playFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => tone(f, i * 0.13, 0.32, 'sawtooth', 0.16));
  tone(1046.5, 0.55, 0.7, 'triangle', 0.2);
  tone(1567.98, 0.6, 0.6, 'triangle', 0.12);
}

// Rising sweep as a "hier kommt etwas"-cue (e.g. match intro / final).
export function playWhoosh() {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sawtooth';
  osc.connect(g);
  g.connect(c.destination);
  const t0 = c.currentTime;
  osc.frequency.setValueAtTime(220, t0);
  osc.frequency.exponentialRampToValueAtTime(880, t0 + 0.35);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
  osc.start(t0);
  osc.stop(t0 + 0.42);
}
