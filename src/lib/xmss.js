import { sha256 } from './sha256';

// A deliberately small teaching model, not RFC 8391 or a SHRINCS implementation.
// Full SHA-256 values, six Winternitz-style chains (w = 4), an 8-bit message
// digest plus its two-digit checksum, and domain-separated Merkle hashing.
// RFC XMSS additionally specifies PRFs, masks, addresses, L-trees and encoding.
export const XMSS_MODEL = { base: 4, chainCount: 6, chainSteps: 3, messageDigits: 4 };
const hash = (domain, ...values) => sha256(JSON.stringify(['xmss-learning-v1', domain, ...values]));

export function encodeMessage(message, randomizer, root, index) {
  const digest = hash('message', randomizer, root, index, message);
  const byte = parseInt(digest.slice(0, 2), 16);
  const digits = [6, 4, 2, 0].map(shift => (byte >>> shift) & 3);
  const checksum = digits.reduce((sum, digit) => sum + 3 - digit, 0);
  return { digest, byte, checksum, digits: [...digits, Math.floor(checksum / 4), checksum % 4] };
}

function chainStep(value, leaf, chain, position) {
  return hash('chain', leaf, chain, position, value);
}

function leafHash(index, tips) { return hash('leaf', index, tips); }
function parentHash(level, index, left, right) { return hash('node', level, index, left, right); }

export function createXMSSDemo(height = 3, seed = 'xmss-learning-key-01') {
  if (![2, 3, 4].includes(height)) throw new Error('Choose a height of 2, 3, or 4.');
  const count = 2 ** height;
  const chains = Array.from({ length: count }, (_, leaf) => (
    Array.from({ length: XMSS_MODEL.chainCount }, (_, chain) => {
      const values = [hash('secret', seed, height, leaf, chain)];
      for (let position = 1; position <= 3; position++) {
        values.push(chainStep(values[position - 1], leaf, chain, position));
      }
      return values;
    })
  ));
  const levels = [chains.map((key, index) => leafHash(index, key.map(chain => chain[3])))];
  for (let level = 1; level <= height; level++) {
    const previous = levels[level - 1];
    levels.push(Array.from({ length: previous.length / 2 }, (_, index) => (
      parentHash(level, index, previous[index * 2], previous[index * 2 + 1])
    )));
  }
  return { height, seed, chains, levels, root: levels[height][0], usedLeaves: new Set() };
}

export function authenticationPath(tree, index) {
  if (!Number.isInteger(index) || index < 0 || index >= 2 ** tree.height) {
    throw new Error('That leaf is outside this tree.');
  }
  return Array.from({ length: tree.height }, (_, level) => tree.levels[level][(index >>> level) ^ 1]);
}

export function previewXMSSMessage(tree, index, message) {
  const randomizer = hash('randomizer', tree.seed, tree.height, index);
  return { randomizer, ...encodeMessage(message, randomizer, tree.root, index) };
}

export function signXMSSDemo(tree, index, message) {
  const auth = authenticationPath(tree, index);
  if (tree.usedLeaves.has(index)) throw new Error('This one-time key has already signed a message. Choose a fresh leaf.');
  const { randomizer, ...encoding } = previewXMSSMessage(tree, index, message);
  const signature = {
    index,
    randomizer,
    values: encoding.digits.map((position, chain) => tree.chains[index][chain][position]),
    auth,
  };
  // Reserve before returning the signature. Verification never releases a key.
  tree.usedLeaves.add(index);
  return signature;
}

// The verifier only receives public data; it never reads the tree or its seed.
export function verifyXMSSDemo(publicKey, message, signature) {
  const { root, height } = publicKey;
  if (!signature || !Array.isArray(signature.auth) || !Array.isArray(signature.values) ||
      ![2, 3, 4].includes(height) || !Number.isInteger(signature.index) ||
      signature.index < 0 || signature.index >= 2 ** height || signature.auth.length !== height ||
      signature.values.length !== 6 ||
      ![root, signature.randomizer, ...signature.auth, ...signature.values].every(value => /^[a-f0-9]{64}$/.test(value))) {
    throw new Error('The signature does not match the learning model format.');
  }
  const encoding = encodeMessage(message, signature.randomizer, root, signature.index);
  const recoveredChains = signature.values.map((value, chain) => {
    const points = [{ position: encoding.digits[chain], value }];
    for (let position = encoding.digits[chain] + 1; position <= 3; position++) {
      value = chainStep(value, signature.index, chain, position);
      points.push({ position, value });
    }
    return points;
  });
  const tips = recoveredChains.map(points => points[points.length - 1].value);
  const leaf = leafHash(signature.index, tips);
  const steps = [];
  let value = leaf;
  for (let level = 0; level < height; level++) {
    const index = signature.index >>> level;
    const sibling = signature.auth[level];
    const siblingSide = index % 2 === 0 ? 'right' : 'left';
    const [left, right] = siblingSide === 'right' ? [value, sibling] : [sibling, value];
    const parent = parentHash(level + 1, index >>> 1, left, right);
    steps.push({ level, index, sibling, siblingSide, left, right, parent });
    value = parent;
  }
  return { ...encoding, tips, recoveredChains, leaf, steps, root: value, valid: value === root };
}

export const shortHash = (value, length = 8) => value ? value.slice(0, length) : '········';
export const flipHash = value => `${value[0] === '0' ? '1' : '0'}${value.slice(1)}`;

export function verificationStages(height) {
  return [
    { title: 'Read the signature', description: 'The verifier receives the leaf index, randomizer, one-time signature, and authentication path.' },
    { title: 'Finish the hash chains', description: 'The message digest and checksum tell the verifier how many hashes remain on each chain.' },
    { title: 'Recover the leaf', description: 'Compress the six recovered chain endpoints into this one-time key’s public leaf.' },
    ...Array.from({ length: height }, (_, level) => ({
      title: `Climb to level ${level + 1}`,
      description: 'Combine the current node with the supplied sibling. The leaf index determines their left-to-right order.',
    })),
    { title: 'Compare the roots', description: 'Accept only if the reconstructed root equals the root in the public key.' },
  ];
}
