let audioContext = null;

const MASTER_VOLUME = 0.24;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  if (!audioContext) audioContext = new AudioCtx();
  return audioContext;
}

function withAudioContext(play) {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === 'closed') return;

  if (ctx.state === 'running') {
    play(ctx);
    return;
  }

  ctx.resume()
    .then(() => {
      if (ctx.state !== 'closed') play(ctx);
    })
    .catch(() => {});
}

function master(ctx, at, duration, volume = 1) {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(MASTER_VOLUME * volume, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  gain.connect(ctx.destination);
  return gain;
}

function connectOutput(ctx, node, destination, pan = 0) {
  if (!ctx.createStereoPanner || Math.abs(pan) < 0.01) {
    node.connect(destination);
    return;
  }

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
  node.connect(panner);
  panner.connect(destination);
}

function scheduleTone(ctx, {
  frequency = 440,
  to = null,
  type = 'sine',
  at = 0,
  duration = 0.12,
  volume = 0.8,
  pan = 0,
}) {
  const start = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const out = master(ctx, start, duration, volume);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration);
  connectOutput(ctx, osc, out, pan);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function scheduleNoiseBurst(ctx, {
  at = 0,
  duration = 0.12,
  volume = 0.7,
  filter = 'bandpass',
  frequency = 900,
  q = 0.7,
  decay = 1.5,
  pan = 0,
}) {
  const start = ctx.currentTime + at;
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const t = i / length;
    data[i] = (Math.random() * 2 - 1) * ((1 - t) ** decay);
  }

  const source = ctx.createBufferSource();
  const biquad = ctx.createBiquadFilter();
  const out = master(ctx, start, duration, volume);
  biquad.type = filter;
  biquad.frequency.setValueAtTime(frequency, start);
  biquad.Q.setValueAtTime(q, start);
  source.buffer = buffer;
  source.connect(biquad);
  connectOutput(ctx, biquad, out, pan);
  source.start(start);
}

function noiseBurst(options) {
  withAudioContext((ctx) => scheduleNoiseBurst(ctx, options));
}

// --- dice ------------------------------------------------------------------
// A real die is a small hard body: each contact is a click plus a few short
// resonant modes, not a burst of broadband hiss. Modes are synthesised
// directly so the dice keep a pitch and read as objects rather than static.

const DIE_MODES = [[1, 1], [1.63, 0.5], [2.41, 0.24]];

// Must match the transition easing in components/entropy/Die.js.
const DIE_EASING = [0.18, 0.72, 0.19, 1];

let noiseBuffer = null;
let diceBus = null;

function getNoiseBuffer(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 1.5);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

// One shared bus: a compressor glues five dice into a single tray instead of a
// pile-up, and two short taps stand in for the room the tray sits in.
function getDiceBus(ctx) {
  if (diceBus && diceBus.ctx === ctx) return diceBus.input;

  const input = ctx.createGain();
  input.gain.value = MASTER_VOLUME;

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.setValueAtTime(-20, ctx.currentTime);
  comp.knee.setValueAtTime(12, ctx.currentTime);
  comp.ratio.setValueAtTime(4, ctx.currentTime);
  comp.attack.setValueAtTime(0.002, ctx.currentTime);
  comp.release.setValueAtTime(0.14, ctx.currentTime);
  input.connect(comp);
  comp.connect(ctx.destination);

  [[0.017, 2600, 0.15], [0.033, 1500, 0.08]].forEach(([time, cutoff, level]) => {
    const delay = ctx.createDelay(0.1);
    const lowpass = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    delay.delayTime.value = time;
    lowpass.type = 'lowpass';
    lowpass.frequency.value = cutoff;
    gain.gain.value = level;
    input.connect(delay);
    delay.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(comp);
  });

  diceBus = { ctx, input };
  return input;
}

function bezierAxis(p1, p2, u) {
  const v = 1 - u;
  return 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u;
}

// When (0..1 of the spin) the die has turned `progress` of the way to its rest
// angle. It spins fast and eases out, so equal slices of rotation are packed
// together at the start and stretch apart at the end: the exact rhythm of a die
// tumbling to a stop, and in sync with what is on screen.
function timeAtProgress(progress) {
  const [x1, y1, x2, y2] = DIE_EASING;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 22; i += 1) {
    const mid = (lo + hi) / 2;
    if (bezierAxis(y1, y2, mid) < progress) lo = mid;
    else hi = mid;
  }
  return bezierAxis(x1, x2, (lo + hi) / 2);
}

function dieNoise(ctx, dest, { at, duration, frequency, q = 1, filter = 'bandpass', volume, pan = 0 }) {
  const buffer = getNoiseBuffer(ctx);
  const source = ctx.createBufferSource();
  const biquad = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rand(0.9, 1.1);
  biquad.type = filter;
  biquad.frequency.setValueAtTime(frequency, at);
  biquad.Q.setValueAtTime(q, at);
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  source.connect(biquad);
  biquad.connect(gain);
  connectOutput(ctx, gain, dest, pan);
  source.start(at, rand(0, buffer.duration - 0.4), duration + 0.02);
}

function dieMode(ctx, dest, { at, frequency, duration, volume, pan = 0 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, at);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.94, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.0012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(gain);
  connectOutput(ctx, gain, dest, pan);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

function scheduleDiceHit(ctx, dest, { at, strength = 1, pitch = 900, pan = 0, thud = false }) {
  const s = Math.max(0.08, Math.min(1.1, strength));

  // Edge click. Harder contacts are brighter, which is most of what sells force.
  // A wide band through noise loses a lot of level, hence the large volumes
  // here next to the modes below: these are pre-filter amplitudes.
  dieNoise(ctx, dest, {
    at,
    duration: 0.005 + 0.008 * s,
    frequency: pitch * (2.3 + 1.5 * s),
    q: 0.8,
    volume: 4.6 * s,
    pan,
  });

  DIE_MODES.forEach(([ratio, amp], i) => {
    if (i === 2 && Math.random() > 0.5) return;
    dieMode(ctx, dest, {
      at: at + i * 0.0008,
      frequency: pitch * ratio * rand(0.99, 1.01),
      duration: (0.05 - i * 0.011) * (0.55 + 0.6 * s),
      volume: 0.11 * amp * s,
      pan,
    });
  });

  if (thud) {
    dieNoise(ctx, dest, {
      at,
      duration: rand(0.035, 0.055),
      frequency: rand(140, 210),
      q: 0.7,
      filter: 'lowpass',
      volume: 4.3 * s,
      pan,
    });
  }
}

function scheduleCoinRing(ctx, at, volume = 1, duration = 0.22) {
  [2450, 3670, 5140].forEach((frequency, i) => {
    scheduleTone(ctx, {
      at: at + i * 0.006,
      frequency: frequency + rand(-180, 180),
      type: 'sine',
      duration: duration * (1 - i * 0.12),
      volume: volume * (0.1 - i * 0.018),
    });
  });
}

export function playDiceRoll(spinMs = 850) {
  withAudioContext((ctx) => {
    const bus = getDiceBus(ctx);
    const now = ctx.currentTime;
    const span = Math.max(0.18, spinMs / 1000);
    const fast = span < 0.5;
    // Three audible dice already sound like a handful; five would only cost
    // nodes and mud up the transients.
    const voices = fast ? 2 : 3;

    // The dice leaving the hand: a soft knock on the table under everything.
    dieNoise(ctx, bus, {
      at: now,
      duration: 0.06,
      frequency: 150,
      q: 0.6,
      filter: 'lowpass',
      volume: 2.2,
    });

    for (let v = 0; v < voices; v += 1) {
      // Each die gets its own size, place in the tray and start offset, so they
      // read as separate objects instead of one loud die.
      const pitch = rand(720, 1180);
      const seat = (v - (voices - 1) / 2) * 0.42;
      const lead = rand(0, 0.028);
      const bounces = fast ? 5 : 7 + Math.floor(Math.random() * 3);

      for (let k = 1; k <= bounces; k += 1) {
        const progress = k / (bounces + 1);
        const at = now + lead + timeAtProgress(progress) * span + rand(-0.005, 0.005);
        const strength = (1.05 - 0.6 * progress) * rand(0.72, 1.05);
        scheduleDiceHit(ctx, bus, {
          at,
          strength,
          pitch,
          pan: seat + rand(-0.07, 0.07),
          thud: progress > 0.4 && Math.random() > 0.45,
        });
      }

      // Settling: the die rocks flat in a few quick decaying taps. This is the
      // part the ear hears as "it stopped", so it lands while the animation is
      // still visibly easing out rather than after it.
      let at = now + lead + timeAtProgress(bounces / (bounces + 1)) * span + rand(0.045, 0.075);
      let gap = fast ? 0.036 : 0.05;
      let strength = 0.5;
      for (let k = 0; k < (fast ? 2 : 3); k += 1) {
        scheduleDiceHit(ctx, bus, { at, strength, pitch, pan: seat, thud: k === 0 });
        at += gap * rand(0.85, 1.15);
        gap *= 0.62;
        strength *= 0.48;
      }
    }
  });
}

export function playCoinFlip(fast = false) {
  withAudioContext((ctx) => {
    const land = fast ? 0.24 : 0.42;

    scheduleNoiseBurst(ctx, {
      duration: 0.12,
      frequency: 5200,
      volume: 0.22,
      filter: 'highpass',
      q: 0.7,
      decay: 0.75,
    });

    const ticks = fast ? 4 : 7;
    for (let i = 0; i < ticks; i += 1) {
      const at = 0.035 + i * (land * 0.58 / ticks) + rand(0, 0.018);
      scheduleNoiseBurst(ctx, {
        at,
        duration: rand(0.012, 0.026),
        frequency: rand(2600, 6400),
        volume: rand(0.12, 0.22),
        filter: 'bandpass',
        q: rand(3, 7),
        decay: 1.1,
      });
      if (i % 2 === 0) scheduleCoinRing(ctx, at + 0.006, 0.7, 0.09);
    }

    scheduleNoiseBurst(ctx, {
      at: land,
      duration: 0.035,
      frequency: 4700,
      volume: 0.38,
      filter: 'highpass',
      q: 0.8,
      decay: 1.6,
    });
    scheduleCoinRing(ctx, land + 0.012, 1, fast ? 0.16 : 0.24);
    scheduleNoiseBurst(ctx, {
      at: land + 0.03,
      duration: 0.08,
      frequency: 420,
      volume: 0.16,
      filter: 'lowpass',
      q: 0.5,
      decay: 2.2,
    });
  });
}

export function playTrngSample(broken = false) {
  withAudioContext((ctx) => {
    scheduleNoiseBurst(ctx, {
      duration: broken ? 0.18 : 0.2,
      frequency: broken ? 190 : 1800,
      volume: broken ? 0.24 : 0.34,
      filter: broken ? 'lowpass' : 'bandpass',
      q: broken ? 0.35 : 1.5,
      decay: broken ? 0.55 : 0.85,
    });

    if (broken) return;

    for (let i = 0; i < 7; i += 1) {
      scheduleNoiseBurst(ctx, {
        at: rand(0.012, 0.18),
        duration: rand(0.006, 0.018),
        frequency: rand(2500, 7800),
        volume: rand(0.08, 0.18),
        filter: 'highpass',
        q: 0.8,
        decay: 0.8,
      });
    }
  });
}

export function playBreakToggle(broken) {
  withAudioContext((ctx) => {
    scheduleNoiseBurst(ctx, {
      duration: broken ? 0.2 : 0.12,
      frequency: broken ? 160 : 1500,
      volume: broken ? 0.28 : 0.22,
      filter: broken ? 'lowpass' : 'bandpass',
      q: broken ? 0.45 : 1.4,
      decay: broken ? 0.8 : 1.2,
    });
    if (!broken) {
      for (let i = 0; i < 4; i += 1) {
        scheduleNoiseBurst(ctx, {
          at: i * 0.018,
          duration: 0.01,
          frequency: rand(3000, 7000),
          volume: 0.08,
          filter: 'highpass',
        });
      }
    }
  });
}

export function playPrngStep(kind = 'next') {
  if (kind === 'all') {
    [0, 1, 2, 3].forEach((i) => {
      noiseBurst({ at: i * 0.036, duration: 0.016, frequency: 2800, filter: 'bandpass', q: 4, volume: 0.16 });
    });
    return;
  }

  if (kind === 'reset') {
    noiseBurst({ duration: 0.08, frequency: 700, filter: 'lowpass', volume: 0.18, decay: 1.8 });
    return;
  }

  noiseBurst({ duration: 0.018, frequency: 2600, filter: 'bandpass', q: 5, volume: 0.15 });
  noiseBurst({ at: 0.026, duration: 0.014, frequency: 3800, filter: 'bandpass', q: 6, volume: 0.1 });
}
