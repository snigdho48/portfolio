/**
 * Synthesised UI audio (WebAudio, no files). OFF by default; the AudioContext is only
 * created after a user gesture. Preference is remembered in localStorage.
 */
const KEY = "snigdho-sound";

type Win = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let ambient: { stop: () => void } | null = null;
let on = false;
const subs = new Set<() => void>();

function emit() {
  subs.forEach((f) => f());
}

export function subscribeSound(fn: () => void) {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

export function isSoundOn() {
  return on;
}

export function storedPreference(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as Win).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  return ctx;
}

function startAmbient(c: AudioContext, out: AudioNode) {
  const g = c.createGain();
  g.gain.value = 0.055;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 240;
  lp.connect(g);
  g.connect(out);
  const oscs = [
    { f: 55, t: "sine" as OscillatorType, v: 1 },
    { f: 82.6, t: "sine" as OscillatorType, v: 0.55 },
    { f: 110.4, t: "triangle" as OscillatorType, v: 0.22 },
  ].map(({ f, t, v }) => {
    const o = c.createOscillator();
    o.type = t;
    o.frequency.value = f;
    const og = c.createGain();
    og.gain.value = v;
    o.connect(og);
    og.connect(lp);
    o.start();
    return o;
  });
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lg = c.createGain();
  lg.gain.value = 90;
  lfo.connect(lg);
  lg.connect(lp.frequency);
  lfo.start();
  return {
    stop() {
      oscs.forEach((o) => o.stop());
      lfo.stop();
      g.disconnect();
    },
  };
}

export function startSound() {
  const c = ensure();
  if (!c || !master) return;
  void c.resume();
  on = true;
  master.gain.cancelScheduledValues(c.currentTime);
  master.gain.linearRampToValueAtTime(0.9, c.currentTime + 0.6);
  if (!ambient) ambient = startAmbient(c, master);
  emit();
}

export function stopSound() {
  on = false;
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    const a = ambient;
    ambient = null;
    window.setTimeout(() => a?.stop(), 320);
  }
  emit();
}

export function setSound(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (v) startSound();
  else stopSound();
}

/** Soft filtered-noise sweep for section transitions. */
export function whoosh(strength = 1) {
  if (!on || !ctx || !master) return;
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = noise;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(260, t);
  bp.frequency.exponentialRampToValueAtTime(2100, t + 0.32);
  bp.frequency.exponentialRampToValueAtTime(520, t + 0.85);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.11 * strength, t + 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  s.connect(bp);
  bp.connect(g);
  g.connect(master);
  s.start(t);
  s.stop(t + 0.95);
}

/** Tiny UI blip. */
export function tick(pitch = 1) {
  if (!on || !ctx || !master) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(900 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(520 * pitch, t + 0.07);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + 0.1);
}
