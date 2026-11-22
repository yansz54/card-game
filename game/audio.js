// Ember Sigils — all sound is synthesised with WebAudio. No audio files, no network.

let audioCtx = null;
let muted = false;

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

function ensureContext() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (muted) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playCardSound() { tone(520, 0.12, 'triangle', 0.16); tone(780, 0.14, 'triangle', 0.12, 0.05); }
export function playDrawSound() { tone(660, 0.08, 'sine', 0.10); }
export function playAttackSound() { tone(220, 0.16, 'sawtooth', 0.14, 0, 90); }
export function playHurtSound() { tone(160, 0.2, 'square', 0.10, 0, 70); }
export function playHealSound() { tone(523, 0.16, 'sine', 0.12); tone(784, 0.22, 'sine', 0.10, 0.09); }
export function playSpellSound() { tone(880, 0.18, 'sine', 0.12, 0, 220); tone(440, 0.2, 'triangle', 0.10, 0.06, 110); }
export function playTurnSound() { tone(392, 0.1, 'triangle', 0.12); tone(523, 0.12, 'triangle', 0.12, 0.08); }
export function playWinFanfare() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, 'triangle', 0.16, i * 0.13));
  tone(1319, 0.5, 'triangle', 0.14, 0.55);
}
export function playLossSound() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.34, 'sine', 0.13, i * 0.16));
}
export function playClickSound() { tone(700, 0.05, 'sine', 0.08); }
