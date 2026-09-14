import { createCipheriv } from 'crypto';
import {
  authenticationTag,
  bytesToHex,
  chacha20,
  chacha20Block,
  DEMO_KEY,
  DEMO_NONCE,
  hexToBytes,
  open,
  poly1305,
  quarterRound,
  RFC_MESSAGE,
  rotateLeft,
  seal,
} from './chacha20';

const key = hexToBytes(DEMO_KEY, 32);
const nonce = hexToBytes(DEMO_NONCE, 12);
const encode = (text) => new TextEncoder().encode(text);
const RFC_CIPHERTEXT =
  '6e2e359a2568f98041ba0728dd0d6981e97e7aec1d4360c20a27afccfd9fae0bf91b65c5524733ab8f593dabcd62b3571639d624e65152ab8f530c359f0861d807ca0dbf500d6a6156a38e088a22b65e52bc514d16ccf806818ce91ab77937365af90bbf74a35be6b40b8eedf2785e42874d';

test('quarter round agrees with RFC 8439 section 2.1.1', () => {
  const before = [0x11111111, 0x01020304, 0x9b8d6f43, 0x01234567];
  const trace = quarterRound(before);
  expect(trace.result).toEqual([0xea2a92f4, 0xcb1cf8ce, 0x4581472e, 0x5881c4bb]);
  expect(trace.steps[0]).toEqual(before);
  expect(trace.steps).toHaveLength(13);
  expect(before[0]).toBe(0x11111111);
  expect(rotateLeft(0x80000001, 1)).toBe(3);
});

test('block state, 20 rounds, feed-forward, and byte order match RFC 8439 section 2.3.2', () => {
  const block = chacha20Block(key, hexToBytes('000000090000004a00000000', 12), 1);
  expect(block.initial.slice(12)).toEqual([1, 0x09000000, 0x4a000000, 0]);
  expect(block.rounds).toHaveLength(80);
  expect(block.mixed).toEqual([
    0x837778ab, 0xe238d763, 0xa67ae21e, 0x5950bb2f, 0xc4f2d0c7, 0xfc62bb2f, 0x8fa018fc, 0x3f5ec7b7,
    0x335271c2, 0xf29489f3, 0xeabda8fc, 0x82e46ebd, 0xd19c12b4, 0xb04e16de, 0x9e83d0cb, 0x4e3c50a2,
  ]);
  expect(bytesToHex(block.bytes)).toBe(
    '10f1e7e4d13b5915500fdd1fa32071c4c7d1f4c733c068030422aa9ac3d46c4ed2826446079faa0914c2d705d98b02a2b5129cd1de164eb9cbd083e8a2503c4e'
  );
});

test('multi-block encryption matches RFC 8439 section 2.4.2 and decrypts', () => {
  const plaintext = encode(RFC_MESSAGE);
  const result = chacha20(plaintext, key, nonce);
  expect(bytesToHex(result.output)).toBe(RFC_CIPHERTEXT);
  expect(result.blocks).toHaveLength(2);
  expect(result.blocks[1].initial[12]).toBe(2);
  expect(Array.from(chacha20(result.output, key, nonce).output)).toEqual(Array.from(plaintext));
});

test('Poly1305 matches RFC 8439 section 2.5.2', () => {
  const oneTimeKey = hexToBytes(
    '85d6be7857556d337f4452fe42d506a80103808afb0db2fd4abff6af4149f51b',
    32
  );
  expect(bytesToHex(poly1305(encode('Cryptographic Forum Research Group'), oneTimeKey))).toBe(
    'a8061dc1305136c6c22b8baf0c0127a9'
  );
});

test('combined AEAD matches RFC 8439 section 2.8.2', () => {
  const aeadKey = hexToBytes(
    '808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9f',
    32
  );
  const aeadNonce = hexToBytes('070000004041424344454647', 12);
  const aad = hexToBytes('50515253c0c1c2c3c4c5c6c7', 12);
  const result = seal(encode(RFC_MESSAGE), aeadKey, aeadNonce, aad);
  expect(bytesToHex(result.tag)).toBe('1ae10b594f09e26a7e902ecbd0600691');
  expect(bytesToHex(result.ciphertext)).toBe(
    'd31a8d34648e60db7b86afbc53ef7ec2a4aded51296e08fea9e2b5a736ee62d63dbea45e8ca9671282fafb69da92728b1a71de0a9e060b2905d6a5b67ecd3b3692ddbd7f2d778b8c9803aee328091b58fab324e4fad675945585808b4831d7bc3ff4def08e4b7a9de576d26586cec64b6116'
  );
});

test.each([0, 1, 15, 16, 17, 63, 64, 65, 128, 256])(
  'agrees with Node crypto at %i message bytes, including AAD padding',
  (length) => {
    const message = Uint8Array.from({ length }, (_, i) => (i * 79 + 129) % 256);
    const aad = Uint8Array.from({ length: length % 33 }, (_, i) => i + 1);
    const cipher = createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: 16 });
    cipher.setAAD(aad, { plaintextLength: message.length });
    const expected = Buffer.concat([cipher.update(message), cipher.final()]);
    const result = seal(message, key, nonce, aad);
    expect(bytesToHex(result.ciphertext)).toBe(expected.toString('hex'));
    expect(bytesToHex(result.tag)).toBe(cipher.getAuthTag().toString('hex'));
    expect(Array.from(open(result.ciphertext, result.tag, key, nonce, aad))).toEqual(
      Array.from(message)
    );
  }
);

test('authentication rejects tampered ciphertext, tags, AAD, and nonces', () => {
  const aad = encode('from=Alice');
  const result = seal(encode('Pay Bob $10'), key, nonce, aad);
  const changed = result.ciphertext.slice();
  changed[9] ^= 8;
  expect(new TextDecoder().decode(chacha20(changed, key, nonce).output)).toBe('Pay Bob $90');
  expect(open(changed, result.tag, key, nonce, aad)).toBeNull();
  expect(open(result.ciphertext, result.tag.slice(1), key, nonce, aad)).toBeNull();
  expect(open(result.ciphertext, result.tag, key, nonce, encode('from=Eve'))).toBeNull();
  const changedNonce = nonce.slice();
  changedNonce[0] ^= 1;
  expect(open(result.ciphertext, result.tag, key, changedNonce, aad)).toBeNull();
  expect(bytesToHex(authenticationTag(changed, key, nonce, aad))).not.toBe(bytesToHex(result.tag));
});

test('UTF-8, byte boundaries, empty input, and nonzero byte offsets work', () => {
  const message = encode('你好 🔐 café');
  const paddedKey = new Uint8Array(40);
  paddedKey.set(key, 4);
  const slicedKey = paddedKey.subarray(4, 36);
  const result = chacha20(message, slicedKey, nonce, 10);
  expect(new TextDecoder().decode(chacha20(result.output, key, nonce, 10).output)).toBe(
    '你好 🔐 café'
  );
  expect(chacha20(new Uint8Array(), key, nonce).output).toHaveLength(0);
  expect(chacha20(new Uint8Array(64), key, nonce, 0xffffffff).blocks).toHaveLength(1);
  expect(chacha20Block(new Uint8Array(32), new Uint8Array(12), 0).bytes.slice(0, 8)).toEqual(
    hexToBytes('76b8e0ada0f13d90', 8)
  );
});

test('invalid key, nonce, hex and counter overflow are rejected', () => {
  expect(hexToBytes('AA bb', 2)).toEqual(Uint8Array.of(170, 187));
  expect(() => hexToBytes('zz', 1)).toThrow(/hex digits/);
  expect(() => hexToBytes('abc', 2)).toThrow(/hex digits/);
  expect(() => chacha20Block(new Uint8Array(31), nonce, 0)).toThrow(/32 bytes/);
  expect(() => chacha20Block(key, new Uint8Array(8), 0)).toThrow(/12 bytes/);
  [-1, 1.5, NaN, 0x100000000].forEach((counter) =>
    expect(() => chacha20Block(key, nonce, counter)).toThrow(/Counter/)
  );
  expect(() => chacha20(new Uint8Array(65), key, nonce, 0xffffffff)).toThrow(/overflow/);
});
