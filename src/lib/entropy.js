import { sha256 } from './sha256';

// A d6 has six equally likely faces, so one roll carries log2(6) bits.
// Not 3: a die does not hand you a whole number of bits.
export const BITS_PER_ROLL = Math.log2(6);

// Roll counts are rounded up so the collected entropy clears the target rather
// than landing just under it. A Coldcard asks for 99, which is 255.9 bits, a
// hair short of 256; 100 gives 258.5 and clears it.
// Coin counts need no rounding up: a fair flip is exactly one bit, so the
// flip count and the bit count are the same number.
export const TARGETS = [
  { bits: 128, words: 12, rolls: 50, flips: 128 },
  { bits: 256, words: 24, rolls: 100, flips: 256 },
];

export function bitsFromRolls(count) {
  return count * BITS_PER_ROLL;
}

// Rejection sampling: 252 is the largest multiple of 6 below 256, so discarding
// bytes at or above it keeps all six faces exactly equally likely.
export function rollDie() {
  const buf = new Uint8Array(1);
  for (;;) {
    window.crypto.getRandomValues(buf);
    if (buf[0] < 252) return (buf[0] % 6) + 1;
  }
}

export function rollDice(n) {
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) out[i] = rollDie();
  return out;
}

// The same construction a Coldcard uses: hash the decimal digits of every roll
// and keep the leading bits. The hash folds the rolls into a fixed width, it
// does not add anything that was not already there.
// How many distinct roll sequences exist so far: 6^n. This is the number an
// attacker would have to search, and it stays honest no matter how impressive
// the 256-bit digest built from those rolls happens to look.
export function guessSpace(rollCount) {
  if (rollCount <= 0) return '0';
  const log10 = rollCount * Math.log10(6);
  if (log10 < 7) return Math.round(6 ** rollCount).toLocaleString('en-US');
  const exp = Math.floor(log10);
  return `${(10 ** (log10 - exp)).toFixed(1)} × 10^${exp}`;
}

export function digestFromRolls(rolls) {
  if (!rolls.length) return '';
  return sha256(rolls.join(''));
}

export function entropyFromRolls(rolls, bits) {
  if (!rolls.length) return '';
  return sha256(rolls.join('')).slice(0, bits / 4);
}

// Whatever the digest is wide, the result can only hold what the dice put in.
export function usableBits(rollCount, targetBits) {
  return Math.min(bitsFromRolls(rollCount), targetBits);
}

export function parseRolls(text) {
  const out = [];
  for (const ch of String(text)) {
    const n = ch.charCodeAt(0) - 48;
    if (n >= 1 && n <= 6) out.push(n);
  }
  return out;
}
