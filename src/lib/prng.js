import { sha256 } from './sha256';

export const DEFAULT_PRNG_STATE = '123';
export const PRNG_BYTES_PER_CALL = 4;
export const PRNG_DEMO_CALLS = 8;

export function prngSeedBytes(seed) {
  if (!seed) return 0;
  return new TextEncoder().encode(seed).length;
}

export function prngSeedBits(seed) {
  return prngSeedBytes(seed) * 8;
}

const HEX_PER_CALL = PRNG_BYTES_PER_CALL * 2;

export function prngRounds(initialState, calls) {
  if (!initialState || calls <= 0) return [];

  const rounds = [];
  let state = sha256(`state:${initialState}`);

  for (let index = 0; index < calls; index += 1) {
    const output = sha256(`out:${state}:${index}`).slice(0, HEX_PER_CALL);
    const nextState = sha256(`state:${state}:${output}:${index}`);
    rounds.push({
      index,
      state,
      nextState,
      output,
    });
    state = nextState;
  }

  return rounds;
}

export function prngStream(initialState, calls = PRNG_DEMO_CALLS) {
  if (!initialState) return '';
  return prngRounds(initialState, calls).map((round) => round.output).join('');
}
