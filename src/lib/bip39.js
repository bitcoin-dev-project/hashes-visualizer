import { sha256Bytes } from './sha256';

export function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToBits(bytes) {
  let bits = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bits += bytes[i].toString(2).padStart(8, '0');
  }
  return bits;
}

export function entropyToBits(entropyHex) {
  return entropyHex ? bytesToBits(hexToBytes(entropyHex)) : '';
}

// How the pieces line up: 128 bits of entropy takes a 4-bit checksum, giving
// 132 bits, which is exactly 12 chunks of 11. 256 takes 8, giving 264, which
// is exactly 24. And 11 bits is exactly one index into a 2048-word list.
export function bip39Shape(entropyBits) {
  const checksumBits = entropyBits / 32;
  const totalBits = entropyBits + checksumBits;
  return { entropyBits, checksumBits, totalBits, words: totalBits / 11 };
}

// The checksum is the leading bits of SHA-256 over the entropy BYTES, not over
// its hex text. Hashing the hex string instead is the classic way to produce a
// mnemonic that looks fine but every wallet rejects.
export function entropyChecksumBits(entropyHex) {
  const bytes = hexToBytes(entropyHex);
  const { checksumBits } = bip39Shape(bytes.length * 8);
  const digest = sha256Bytes(bytes);

  let digestBits = '';
  for (let i = 0; i < Math.ceil(checksumBits / 8); i += 1) {
    digestBits += parseInt(digest.slice(i * 2, i * 2 + 2), 16).toString(2).padStart(8, '0');
  }
  return digestBits.slice(0, checksumBits);
}

export function entropyToMnemonic(entropyHex, wordlist) {
  if (!entropyHex || !wordlist) return [];
  const bytes = hexToBytes(entropyHex);
  const bits = bytesToBits(bytes) + entropyChecksumBits(entropyHex);

  const words = [];
  for (let i = 0; i < bits.length; i += 11) {
    words.push(wordlist[parseInt(bits.slice(i, i + 11), 2)]);
  }
  return words;
}

// The 11-bit chunks with the index each one resolves to, for showing the work.
// Each chunk is split into the part that came from the entropy and the part
// that came from the appended checksum, so the two can be told apart on screen.
export function mnemonicChunks(entropyHex, wordlist) {
  if (!entropyHex || !wordlist) return [];
  const bytes = hexToBytes(entropyHex);
  const entropyBits = bytesToBits(bytes);
  const bits = entropyBits + entropyChecksumBits(entropyHex);
  const entropyLen = entropyBits.length;

  const chunks = [];
  for (let i = 0; i < bits.length; i += 11) {
    const chunk = bits.slice(i, i + 11);
    const fromEntropy = Math.max(0, Math.min(chunk.length, entropyLen - i));
    const index = parseInt(chunk, 2);
    chunks.push({
      bits: chunk,
      entropyPart: chunk.slice(0, fromEntropy),
      checksumPart: chunk.slice(fromEntropy),
      index,
      word: wordlist[index],
    });
  }
  return chunks;
}
