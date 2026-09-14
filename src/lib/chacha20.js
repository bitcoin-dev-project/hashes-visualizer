// Educational, inspectable implementation of the IETF variant in RFC 8439.
// The traces and BigInt authenticator are for learning, not production crypto.
export const DEMO_KEY = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
export const DEMO_NONCE = '000000000000004a00000000';
export const RFC_MESSAGE =
  "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";
export const CONSTANTS = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];
export const ROUND_GROUPS = [
  [0, 4, 8, 12],
  [1, 5, 9, 13],
  [2, 6, 10, 14],
  [3, 7, 11, 15],
  [0, 5, 10, 15],
  [1, 6, 11, 12],
  [2, 7, 8, 13],
  [3, 4, 9, 14],
];
export const OPERATIONS = [
  { target: 0, source: 1, type: 'add', formula: 'a = a + b' },
  { target: 3, source: 0, type: 'xor', formula: 'd = d ⊕ a' },
  { target: 3, amount: 16, type: 'rotate', formula: 'd = ROTL(d, 16)' },
  { target: 2, source: 3, type: 'add', formula: 'c = c + d' },
  { target: 1, source: 2, type: 'xor', formula: 'b = b ⊕ c' },
  { target: 1, amount: 12, type: 'rotate', formula: 'b = ROTL(b, 12)' },
  { target: 0, source: 1, type: 'add', formula: 'a = a + b' },
  { target: 3, source: 0, type: 'xor', formula: 'd = d ⊕ a' },
  { target: 3, amount: 8, type: 'rotate', formula: 'd = ROTL(d, 8)' },
  { target: 2, source: 3, type: 'add', formula: 'c = c + d' },
  { target: 1, source: 2, type: 'xor', formula: 'b = b ⊕ c' },
  { target: 1, amount: 7, type: 'rotate', formula: 'b = ROTL(b, 7)' },
];

export const wordHex = (word) => (word >>> 0).toString(16).padStart(8, '0');
export const byteHex = (byte) => byte.toString(16).padStart(2, '0');
export const bytesToHex = (bytes) => Array.from(bytes, byteHex).join('');
export const rotateLeft = (word, amount) => ((word << amount) | (word >>> (32 - amount))) >>> 0;

export function hexToBytes(text, length, label = 'Value') {
  const hex = text.replace(/\s/g, '');
  if (!/^[0-9a-f]*$/i.test(hex) || hex.length !== length * 2) {
    throw new Error(
      `${label} must contain exactly ${length * 2} hex digits (${length} bytes). Spaces are allowed.`
    );
  }
  return Uint8Array.from(hex.match(/../g) || [], (pair) => parseInt(pair, 16));
}

function validateInputs(key, nonce, counter) {
  if (!(key instanceof Uint8Array) || key.length !== 32) throw new Error('Key must be 32 bytes.');
  if (!(nonce instanceof Uint8Array) || nonce.length !== 12)
    throw new Error('Nonce must be 12 bytes.');
  if (!Number.isInteger(counter) || counter < 0 || counter > 0xffffffff) {
    throw new Error('Counter must be a whole number from 0 to 4294967295.');
  }
}

export function serializeWords(words) {
  const bytes = new Uint8Array(words.length * 4);
  const view = new DataView(bytes.buffer);
  words.forEach((word, i) => view.setUint32(i * 4, word, true));
  return bytes;
}

function readWords(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: bytes.length / 4 }, (_, i) => view.getUint32(i * 4, true));
}

export function quarterRound(values) {
  const state = [...values];
  const steps = [state.slice()];
  OPERATIONS.forEach(({ target, source, type, amount }) => {
    if (type === 'add') state[target] = (state[target] + state[source]) >>> 0;
    if (type === 'xor') state[target] = (state[target] ^ state[source]) >>> 0;
    if (type === 'rotate') state[target] = rotateLeft(state[target], amount);
    steps.push(state.slice());
  });
  return { result: state, steps };
}

export function chacha20Block(key, nonce, counter) {
  validateInputs(key, nonce, counter);
  const initial = [...CONSTANTS, ...readWords(key), counter, ...readWords(nonce)];
  const state = initial.slice();
  const rounds = [];
  for (let q = 0; q < 80; q += 1) {
    const indices = ROUND_GROUPS[q % 8];
    const before = state.slice();
    const { result, steps } = quarterRound(indices.map((i) => state[i]));
    indices.forEach((index, i) => {
      state[index] = result[i];
    });
    rounds.push({
      indices,
      before,
      after: state.slice(),
      steps,
      round: Math.floor(q / 4) + 1,
      kind: q % 8 < 4 ? 'Column' : 'Diagonal',
    });
  }
  const final = state.map((word, i) => (word + initial[i]) >>> 0);
  return { initial, rounds, mixed: state, final, bytes: serializeWords(final) };
}

// XOR is its own inverse: this same function encrypts and decrypts bytes.
export function chacha20(message, key, nonce, counter = 1) {
  validateInputs(key, nonce, counter);
  const count = Math.ceil(message.length / 64);
  if (counter + Math.max(0, count - 1) > 0xffffffff) {
    throw new Error('This message would overflow the 32-bit counter. Choose a lower counter.');
  }
  const output = new Uint8Array(message.length);
  const keystream = new Uint8Array(count * 64);
  const blocks = [];
  for (let i = 0; i < count; i += 1) {
    const block = chacha20Block(key, nonce, counter + i);
    blocks.push(block);
    keystream.set(block.bytes, i * 64);
    for (let j = 0; j < Math.min(64, message.length - i * 64); j += 1) {
      output[i * 64 + j] = message[i * 64 + j] ^ block.bytes[j];
    }
  }
  return { output, keystream, blocks };
}

function littleEndianNumber(bytes) {
  return Array.from(bytes).reduceRight((n, byte) => (n << BigInt(8)) | BigInt(byte), BigInt(0));
}

function numberBytes(number, length) {
  return Uint8Array.from({ length }, (_, i) => Number((number >> BigInt(i * 8)) & BigInt(255)));
}

export function poly1305(message, oneTimeKey) {
  if (oneTimeKey.length !== 32) throw new Error('Poly1305 needs a 32-byte one-time key.');
  const r =
    littleEndianNumber(oneTimeKey.slice(0, 16)) & BigInt('0x0ffffffc0ffffffc0ffffffc0fffffff');
  const s = littleEndianNumber(oneTimeKey.slice(16));
  const p = (BigInt(1) << BigInt(130)) - BigInt(5);
  let acc = BigInt(0);
  for (let i = 0; i < message.length; i += 16) {
    const chunk = message.slice(i, i + 16);
    const n = littleEndianNumber(chunk) + (BigInt(1) << BigInt(chunk.length * 8));
    acc = ((acc + n) * r) % p;
  }
  return numberBytes(acc + s, 16);
}

export function authenticationTag(ciphertext, key, nonce, aad = new Uint8Array()) {
  const oneTimeKey = chacha20Block(key, nonce, 0).bytes.slice(0, 32);
  const aadLength = Math.ceil(aad.length / 16) * 16;
  const cipherLength = Math.ceil(ciphertext.length / 16) * 16;
  const macInput = new Uint8Array(aadLength + cipherLength + 16);
  macInput.set(aad);
  macInput.set(ciphertext, aadLength);
  macInput.set(numberBytes(BigInt(aad.length), 8), aadLength + cipherLength);
  macInput.set(numberBytes(BigInt(ciphertext.length), 8), aadLength + cipherLength + 8);
  return poly1305(macInput, oneTimeKey);
}

export function seal(message, key, nonce, aad = new Uint8Array()) {
  const { output: ciphertext } = chacha20(message, key, nonce, 1);
  return { ciphertext, tag: authenticationTag(ciphertext, key, nonce, aad) };
}

export function open(ciphertext, tag, key, nonce, aad = new Uint8Array()) {
  const expected = authenticationTag(ciphertext, key, nonce, aad);
  let difference = tag.length ^ expected.length;
  for (let i = 0; i < expected.length; i += 1) difference |= expected[i] ^ tag[i];
  if (difference !== 0) return null;
  return chacha20(ciphertext, key, nonce, 1).output;
}
