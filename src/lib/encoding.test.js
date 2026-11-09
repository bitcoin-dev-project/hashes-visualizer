import { binaryToHex, binaryToString, hexToBinary, hexToString, stringToHex } from './encoding';

test('converts arbitrary-length byte strings without rounding or dropping leading zeros', () => {
  const hex = '0000' + Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0')).join('');
  const bits = hexToBinary(hex);
  expect(bits).toHaveLength(hex.length * 4);
  expect(binaryToHex(bits)).toBe(hex);
  expect(binaryToHex('')).toBe('');
});

test('accepts uppercase hex, whitespace and a 0x prefix, and rejects malformed bytes', () => {
  expect(hexToBinary(' 0x00 AB\nCD\tEF ')).toBe('00000000101010111100110111101111');
  for (const input of ['r', '12r4', 'abz0', 'a']) expect(() => hexToBinary(input)).toThrow();
  expect(() => binaryToHex('1')).toThrow();
  expect(() => binaryToString('0000000')).toThrow();
});

test('preserves UTF-8, null bytes and BOMs, and rejects lossy text conversion', () => {
  for (const text of ['你好 🔐 café', '\0', '\ufeffabc', '']) {
    expect(hexToString(stringToHex(text))).toBe(text);
  }
  expect(() => hexToString('ff80')).toThrow();
});
