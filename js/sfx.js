// Tiny synthesized sound effects (no audio files needed).
let ctx = null;
function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function noise(dur, { freq = 800, q = 1, gain = 0.4, type = 'lowpass', decay = dur } = {}) {
  const c = ac(); if (!c) return;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + decay);
  src.connect(f).connect(g).connect(c.destination);
  src.start();
}
function tone(freq, dur, { type = 'sine', gain = 0.2, slide = 0 } = {}) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), c.currentTime + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + dur);
}

export const sfx = {
  unlock() { ac(); },
  punch() { noise(0.12, { freq: 600, gain: 0.5 }); tone(110, 0.12, { gain: 0.35, slide: -60 }); },
  hit() { noise(0.16, { freq: 900, gain: 0.55 }); tone(80, 0.18, { gain: 0.4, slide: -40 }); },
  block() { tone(320, 0.08, { type: 'square', gain: 0.08 }); noise(0.06, { freq: 2500, gain: 0.2 }); },
  thud() { tone(60, 0.35, { gain: 0.5, slide: -30 }); noise(0.25, { freq: 300, gain: 0.35 }); },
  whoosh() { noise(0.18, { freq: 1400, q: 0.7, gain: 0.12, type: 'bandpass' }); },
  click() { tone(660, 0.05, { type: 'triangle', gain: 0.08 }); },
  item() { tone(880, 0.09, { type: 'triangle', gain: 0.1 }); setTimeout(() => tone(1320, 0.14, { type: 'triangle', gain: 0.1 }), 80); },
  coin() { tone(1200, 0.06, { type: 'square', gain: 0.05 }); setTimeout(() => tone(1600, 0.1, { type: 'square', gain: 0.05 }), 60); },
  objective() { tone(440, 0.18, { type: 'triangle', gain: 0.1 }); setTimeout(() => tone(660, 0.3, { type: 'triangle', gain: 0.1 }), 140); },
  gunshot() { noise(0.5, { freq: 1800, gain: 0.9, decay: 0.45 }); tone(70, 0.4, { gain: 0.6, slide: -40 }); },
  splash() { noise(0.9, { freq: 1200, q: 0.5, gain: 0.35, type: 'bandpass', decay: 0.8 }); },
  horn() { tone(220, 1.2, { type: 'sawtooth', gain: 0.06 }); tone(277, 1.2, { type: 'sawtooth', gain: 0.05 }); },
  rifle() { noise(0.35, { freq: 2200, gain: 0.6, decay: 0.3 }); tone(90, 0.25, { gain: 0.4, slide: -50 }); },
  ding() { setTimeout(() => tone(1500, 0.25, { type: 'triangle', gain: 0.08 }), 120); },
  kick() { noise(0.14, { freq: 450, gain: 0.6 }); tone(70, 0.2, { gain: 0.45, slide: -40 }); },
  thump() { tone(50, 0.6, { gain: 0.45, slide: -20 }); },
  bell() { for (const [f, d] of [[1760, 0], [2640, 0], [1760, 260], [2640, 260]]) setTimeout(() => tone(f, 0.5, { type: 'triangle', gain: 0.07 }), d); },
  tick() { tone(2400, 0.03, { type: 'square', gain: 0.05 }); },
  boom() { noise(1.4, { freq: 500, gain: 1, decay: 1.3 }); tone(40, 1.2, { gain: 0.7, slide: -20 }); },
};
