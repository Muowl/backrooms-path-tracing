/**
 * audio.js — Procedural sound for the Backrooms game.
 *
 * Everything here is synthesized with the Web Audio API — no external
 * assets, matching the project's "100% procedural" philosophy. The star
 * of the show is the fluorescent 60Hz mains hum, the canonical Backrooms
 * sound, layered with its 120Hz harmonic and a thin band-passed buzz.
 *
 * An AudioContext can only start after a user gesture, so `initAudio()`
 * must be called from a click/keydown handler (we call it on the first
 * pointer-lock). All nodes route through a master gain so a single mute
 * toggle silences everything.
 */

let ctx = null;
let master = null;
let humGain = null;
let muted = false;
let started = false;

/**
 * Lazily create the AudioContext and the persistent ambience graph.
 * Safe to call multiple times — only the first call does work. Must be
 * invoked from within a user gesture or the context stays suspended.
 */
export function initAudio() {
  if (started) {
    // Browsers suspend the context when it loses focus; resume on re-entry.
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return; // No Web Audio support — game runs silent.

  ctx = new AudioCtx();
  started = true;

  master = ctx.createGain();
  master.gain.value = muted ? 0.0 : 1.0;
  master.connect(ctx.destination);

  buildHum();

  if (ctx.state === 'suspended') ctx.resume();
}

/**
 * The fluorescent hum: a 60Hz fundamental plus its 120Hz harmonic (the
 * sound of AC mains through a ballast) and a faint band-passed noise for
 * the electrical buzz. Kept quiet so footsteps and space read over it.
 */
function buildHum() {
  humGain = ctx.createGain();
  humGain.gain.value = 0.06;
  humGain.connect(master);

  // 60Hz fundamental + 120Hz harmonic
  [60, 120].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = i === 0 ? 1.0 : 0.35;
    osc.connect(g).connect(humGain);
    osc.start();
  });

  // Thin electrical buzz: white noise band-passed around 120Hz
  const buzz = ctx.createBufferSource();
  buzz.buffer = makeNoiseBuffer(2.0);
  buzz.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 120;
  bp.Q.value = 8;
  const buzzGain = ctx.createGain();
  buzzGain.gain.value = 0.12;
  buzz.connect(bp).connect(buzzGain).connect(humGain);
  buzz.start();
}

/**
 * Generate a reusable buffer of white noise `seconds` long.
 */
function makeNoiseBuffer(seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/**
 * A single footstep: a short filtered-noise transient with a fast decay.
 * `inWater` softens and lowers it into a wet slosh. Slight random pitch
 * keeps repeated steps from sounding mechanical.
 */
export function footstep(inWater = false) {
  if (!ctx || muted) return;

  const now = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = makeNoiseBuffer(0.2);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const base = inWater ? 420 : 900;
  filter.frequency.value = base * (0.85 + Math.random() * 0.3);
  filter.Q.value = inWater ? 2 : 6;

  const g = ctx.createGain();
  const peak = inWater ? 0.14 : 0.1;
  const decay = inWater ? 0.18 : 0.09;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  src.connect(filter).connect(g).connect(master);
  src.start(now);
  src.stop(now + decay + 0.02);
}

/**
 * A soft double-thump heartbeat, used when sanity runs low. `intensity`
 * (0..1) scales volume so the pulse grows as fear does.
 */
export function heartbeat(intensity = 1) {
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  const vol = 0.12 + intensity * 0.25;

  const thump = (t, gain) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.2);
  };

  thump(now, vol); // lub
  thump(now + 0.18, vol * 0.7); // dub
}

/**
 * A bright confirmation blip for picking up a VHS tape: two quick rising
 * tones, distinct from the murky ambience so a pickup reads clearly.
 */
export function collectSound() {
  if (!ctx || muted) return;
  const now = ctx.currentTime;
  [660, 990].forEach((freq, i) => {
    const t = now + i * 0.09;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.18);
  });
}

/**
 * Toggle mute on the master bus with a short fade to avoid a click.
 * Returns the new muted state.
 */
export function toggleMute() {
  muted = !muted;
  if (master && ctx) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(muted ? 0.0 : 1.0, now + 0.08);
  }
  return muted;
}

export function isMuted() {
  return muted;
}
