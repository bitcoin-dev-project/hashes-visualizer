import { createHash } from 'crypto';
import { sha256Bytes } from './sha256';
import { COLLISION_MESSAGES, FULL_DIGESTS, REDUCED_38_DIGEST } from '../testFixtures/sha256Collision';

test('reproduces the screenshot collision using 38 rounds on every padded block', () => {
  expect(COLLISION_MESSAGES[0]).not.toBe(COLLISION_MESSAGES[1]);
  for (const message of COLLISION_MESSAGES) {
    const bytes = Buffer.from(message, 'hex');
    expect(bytes).toHaveLength(128);
    expect(sha256Bytes(bytes, 38)).toBe(REDUCED_38_DIGEST);
  }
  for (const rounds of [37, 39, 64]) {
    expect(sha256Bytes(Buffer.from(COLLISION_MESSAGES[0], 'hex'), rounds))
      .not.toBe(sha256Bytes(Buffer.from(COLLISION_MESSAGES[1], 'hex'), rounds));
  }
});

test('keeps the standard 64-round digests unchanged and matches native crypto', () => {
  COLLISION_MESSAGES.forEach((message, i) => {
    const bytes = Buffer.from(message, 'hex');
    expect(sha256Bytes(bytes)).toBe(FULL_DIGESTS[i]);
    expect(sha256Bytes(bytes)).toBe(createHash('sha256').update(bytes).digest('hex'));
  });
});

test.each([0, 65, 1.5, NaN])('rejects an invalid round count: %p', rounds => {
  expect(() => sha256Bytes(new Uint8Array(), rounds)).toThrow('Rounds per block');
});
