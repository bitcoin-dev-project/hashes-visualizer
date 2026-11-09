import { createXMSSDemo, encodeMessage, flipHash, signXMSSDemo, verifyXMSSDemo } from './xmss';

describe('XMSS learning model', () => {
  test.each([2, 3, 4])('every leaf verifies against one unchanged public root at height %i', height => {
    const tree = createXMSSDemo(height);
    const publicKey = { height, root: tree.root };
    for (let index = 0; index < 2 ** height; index++) {
      const message = `Message ${index} 🌳`;
      const signature = signXMSSDemo(tree, index, message);
      // This public-only object contains no seed, tree nodes, or private chains.
      const result = verifyXMSSDemo(publicKey, message, JSON.parse(JSON.stringify(signature)));
      expect(result.valid).toBe(true);
      expect(result.root).toBe(publicKey.root);
      expect(signature.auth).toHaveLength(height);
      expect(signature.values).toHaveLength(6);
    }
    expect(tree.usedLeaves.size).toBe(2 ** height);
    expect(tree.root).toBe(publicKey.root);
  });

  test('refuses to sign twice with the same one-time key', () => {
    const tree = createXMSSDemo();
    signXMSSDemo(tree, 2, 'First message');
    expect(() => signXMSSDemo(tree, 2, 'Second message')).toThrow(/already signed/);
    expect(tree.usedLeaves.size).toBe(1);
  });

  test('checksum includes the full complement sum as two base-4 digits', () => {
    const samples = Array.from({ length: 100 }, (_, index) => encodeMessage(String(index), 'R', 'root', 0));
    for (const { digits, checksum } of samples) {
      expect(digits).toHaveLength(6);
      expect(digits.every(digit => digit >= 0 && digit <= 3)).toBe(true);
      expect(digits[4] * 4 + digits[5]).toBe(checksum);
      expect(digits.slice(0, 4).reduce((sum, digit) => sum + digit, 0) + checksum).toBe(12);
    }
  });

  test.each(['message', 'randomizer', 'chain value', 'proof node', 'index', 'proof ordering'])('rejects a changed %s', field => {
    const tree = createXMSSDemo();
    const original = 'A little trust goes a long way.';
    const signature = signXMSSDemo(tree, 2, original);
    let message = original;
    if (field === 'message') message += '!';
    if (field === 'randomizer') signature.randomizer = flipHash(signature.randomizer);
    if (field === 'chain value') signature.values[0] = flipHash(signature.values[0]);
    if (field === 'proof node') signature.auth[0] = flipHash(signature.auth[0]);
    if (field === 'index') signature.index = 3;
    if (field === 'proof ordering') signature.auth.reverse();
    expect(verifyXMSSDemo({ height: 3, root: tree.root }, message, signature).valid).toBe(false);
    // A failed verification must not make the signing key fresh again.
    expect(() => signXMSSDemo(tree, 2, original)).toThrow(/already signed/);
  });

  test('a new demonstration seed creates a new public commitment', () => {
    const first = createXMSSDemo(3, 'key-1');
    const second = createXMSSDemo(3, 'key-2');
    const signature = signXMSSDemo(first, 0, 'Hello');
    expect(second.root).not.toBe(first.root);
    expect(verifyXMSSDemo({ height: 3, root: second.root }, 'Hello', signature).valid).toBe(false);
  });

  test('validates indexes and incomplete signatures', () => {
    const tree = createXMSSDemo();
    expect(() => createXMSSDemo(8)).toThrow(/height/);
    expect(() => signXMSSDemo(tree, -1, '')).toThrow(/outside/);
    expect(() => signXMSSDemo(tree, 8, '')).toThrow(/outside/);
    expect(() => verifyXMSSDemo({ height: 3, root: tree.root }, '', {})).toThrow(/format/);
    const signature = signXMSSDemo(tree, 0, '');
    expect(verifyXMSSDemo({ height: 3, root: tree.root }, '', signature).valid).toBe(true);
    signature.auth.pop();
    expect(() => verifyXMSSDemo({ height: 3, root: tree.root }, '', signature)).toThrow(/format/);
  });
});
