export function stringToBinary(str) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join('');
}

export function normalizeHex(hex) {
  return hex.replace(/\s/g, '').replace(/^0x/i, '').toLowerCase();
}

export function hexToBinary(hex) {
  const normalized = normalizeHex(hex);
  if (!/^(?:[0-9a-f]{2})*$/.test(normalized)) {
    throw new Error('Hex needs two digits per byte, using 0–9 and A–F.');
  }
  const bytes = normalized.match(/.{2}/g) || [];
  return bytes.map(b => parseInt(b, 16).toString(2).padStart(8, '0')).join('');
}

export function hexToString(hex) {
  return binaryToString(hexToBinary(hex));
}

export function stringToHex(str) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function binaryToHex(bin) {
  if (!/^[01]*$/.test(bin) || bin.length % 4 !== 0) {
    throw new Error('Hex conversion needs complete groups of four bits.');
  }
  return (bin.match(/.{4}/g) || []).map(nibble => parseInt(nibble, 2).toString(16)).join('');
}

export function binaryToString(bin) {
  if (!/^[01]*$/.test(bin) || bin.length % 8 !== 0) {
    throw new Error('Text conversion needs complete bytes (eight bits each).');
  }
  const bytes = (bin.match(/.{8}/g) || []).map(b => parseInt(b, 2));
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(new Uint8Array(bytes));
}

export function decimalToBinary(num) {
  return Number(num).toString(2);
}

export function binaryToDecimal(bin) {
  return parseInt(bin, 2);
}

export function appendOneBit(input) {
  return input + '1';
}

export function isMultipleOf512(n) {
  return n % 512 === 0;
}

export function calculateK(L) {
  let k = 0;
  while ((L + 1 + k + 64) % 512 !== 0) k++;
  return k;
}

export function return64Bit(num) {
  return num.padStart(64, '0');
}

export function padding(input, base = 'text') {
  const binary = base === 'bin' ? input : base === 'hex' ? hexToBinary(input) : stringToBinary(input);
  const L = binary.length;
  const k = calculateK(L);
  const lenBits = return64Bit(decimalToBinary(L));
  return binary + '1' + '0'.repeat(k) + lenBits;
}

export function paddingExplained(input, base = 'text') {
  const binary = base === 'bin' ? input : base === 'hex' ? hexToBinary(input) : stringToBinary(input);
  const L = binary.length;
  const K = calculateK(L);
  const L64 = return64Bit(decimalToBinary(L));
  const result = binary + '1' + '0'.repeat(K) + L64;
  return { 
    input: binary, 
    L, 
    LBinary: decimalToBinary(L), 
    K, 
    L64, 
    result, 
    inputAppended: binary + '1' 
  };
}

export function chunkString(str, len = 512) {
  return str.match(new RegExp(`.{1,${len}}`, 'g')) || [];
}

export function rotateRight(val, r) {
  const mask = 0xffffffff;
  const rot = r & 31;
  return ((val >>> rot) | ((val << (32 - rot)) & mask)) >>> 0;
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

