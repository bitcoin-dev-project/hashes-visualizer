import { sha256 } from './sha256';

// A hardware noise source is sampled by a comparator: whenever the signal sits
// above a threshold you read a 1, below it a 0. Everything here is a real
// computation on real random samples. What is simulated is only the physics
// that produces the samples, which a browser cannot actually provide.

export const CENTRED = 0.5;
// A comparator whose threshold is off centre produces a biased stream. This is
// the normal state of an unconditioned noise source, not a fault.
export const SKEWED = 0.62;

// getRandomValues rejects requests over 65,536 bytes, so fill in chunks.
export function sampleNoise(count) {
  const buf = new Uint8Array(count);
  for (let i = 0; i < count; i += 65536) {
    window.crypto.getRandomValues(buf.subarray(i, Math.min(i + 65536, count)));
  }
  return Array.from(buf, (b) => b / 255);
}

export function bitsFromSamples(samples, threshold) {
  return samples.map((s) => (s >= threshold ? 1 : 0));
}

// Von Neumann debiasing. Read the stream in pairs: 01 emits 0, 10 emits 1, and
// 00 / 11 are thrown away. Provably removes any fixed bias from independent
// bits, and throws away most of them doing it. It concentrates entropy, it
// never creates any.
export function vonNeumann(bits) {
  const out = [];
  for (let i = 0; i + 1 < bits.length; i += 2) {
    if (bits[i] !== bits[i + 1]) out.push(bits[i]);
  }
  return out;
}

export function onesFraction(bits) {
  if (!bits.length) return 0;
  return bits.reduce((a, b) => a + b, 0) / bits.length;
}

// The repetition-count idea from NIST SP 800-90B: a noise source stuck at one
// value is broken, and a long identical run is how you notice.
export const REPETITION_CUTOFF = 24;

export function longestRun(bits) {
  let best = 0;
  let run = 0;
  for (let i = 0; i < bits.length; i += 1) {
    run = i > 0 && bits[i] === bits[i - 1] ? run + 1 : 1;
    if (run > best) best = run;
  }
  return best;
}

export function healthy(bits) {
  return bits.length === 0 || longestRun(bits) < REPETITION_CUTOFF;
}

// Fold however many clean bits we have into a 256-bit value. Hashing does not
// add entropy: the result is only ever worth the bits that went in.
export function trngDigest(cleanBits) {
  if (!cleanBits.length) return '';
  return sha256(cleanBits.join(''));
}

export function xorHex(a, b) {
  if (!a) return b || '';
  if (!b) return a;
  const n = Math.min(a.length, b.length);
  let out = '';
  for (let i = 0; i < n; i += 1) {
    out += (parseInt(a[i], 16) ^ parseInt(b[i], 16)).toString(16);
  }
  return out;
}
