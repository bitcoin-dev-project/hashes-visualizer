// A fair coin has two equally likely faces, so one flip carries log2(2) bits.
// That is exactly 1, which is what makes coins the tidiest source on the page:
// a d6 hands you 2.585 bits and wastes the fraction, a coin hands you a whole
// bit and wastes nothing. 128 flips is 128 bits, no rounding up.
export const BITS_PER_FLIP = 1;

export const HEADS = 1;
export const TAILS = 0;

export function bitsFromFlips(count) {
  return count * BITS_PER_FLIP;
}

// 256 is an exact multiple of 2, so the low bit of a uniform random byte is
// already a fair coin. The d6 needs rejection sampling because 256 is not a
// multiple of 6; here there is nothing to reject.
export function flipCoin() {
  const buf = new Uint8Array(1);
  window.crypto.getRandomValues(buf);
  return buf[0] & 1;
}

export function flipCoins(n) {
  const out = new Array(n);
  for (let i = 0; i < n; i += 1) out[i] = flipCoin();
  return out;
}

// How many distinct flip sequences exist so far: 2^n. For coins this is the
// same number as the bit count, which is the whole point of using them.
export function flipGuessSpace(count) {
  if (count <= 0) return '0';
  if (count < 21) return (2 ** count).toLocaleString('en-US');
  return `2^${count}`;
}

// No hash here, unlike the dice. Fair flips are already uniform bits, so the
// flips ARE the entropy: pack them MSB-first, four flips per hex digit, and
// the only hash anywhere in the coin lane is the BIP-39 checksum. The dice
// lane must hash because log2(6) bits per roll never fills whole digits; a
// hash here would be harmless but would make the mnemonic irreproducible in
// any other coin-flip tool.
// Only complete nibbles are emitted, so a partial tray packs partially.
export function hexFromFlips(flips) {
  let out = '';
  for (let i = 0; i + 4 <= flips.length; i += 4) {
    out += parseInt(flips.slice(i, i + 4).join(''), 2).toString(16);
  }
  return out;
}

// The entropy exists only once every one of its bits has been flipped; extra
// flips past the target change nothing an attacker would have to search.
export function entropyFromFlips(flips, bits) {
  if (flips.length < bits) return '';
  return hexFromFlips(flips.slice(0, bits));
}

// Accepts what someone flipping a real coin would actually type: 0/1, or H/T
// in either case. Anything else is ignored.
export function parseFlips(text) {
  const out = [];
  for (const ch of String(text)) {
    if (ch === '0') out.push(TAILS);
    else if (ch === '1') out.push(HEADS);
    else if (ch === 'h' || ch === 'H') out.push(HEADS);
    else if (ch === 't' || ch === 'T') out.push(TAILS);
  }
  return out;
}
