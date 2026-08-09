import React from 'react';
import { FastForward, Play, RotateCcw, Shuffle } from 'lucide-react';
import { PRNG_DEMO_CALLS } from '../../lib/prng';
import { playPrngStep } from '../../lib/sound';

// One primary action, two quiet ones. "Change state" used to sit here as a
// fourth button, but the S0 field above it already does that job.
const PRIMARY = 'border-cyan-500/30 bg-cyan-950/25 text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-500/45';
const QUIET = 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300';
const OFF = 'border-gray-800 text-gray-700 cursor-default';

export default function PrngSource({
  initialState,
  onInitialStateChange,
  seedBits = 0,
  targetBits = 128,
  onRandomSeed,
  calls,
  onCallsChange,
  callGoal = PRNG_DEMO_CALLS,
  stream,
  reference,
  onReferenceChange,
}) {
  const cappedGoal = Math.max(1, callGoal);
  const hasOutput = calls > 0;
  const done = calls >= cappedGoal;
  const referencePrefix = reference?.stream?.slice(0, stream.length) || '';
  const matchesReference = Boolean(
    reference && hasOutput && initialState === reference.initialState && stream === referencePrefix,
  );
  const differsFromReference = Boolean(
    reference && hasOutput && initialState !== reference.initialState && stream !== referencePrefix,
  );

  // Remember the run being abandoned so the next one can be compared against it.
  const restart = () => {
    if (hasOutput) onReferenceChange({ initialState, stream, calls });
    if (hasOutput) playPrngStep('reset');
    onCallsChange(0);
  };

  const runNext = () => {
    if (done) return;
    playPrngStep('next');
    onCallsChange(Math.min(calls + 1, cappedGoal));
  };

  const runAll = () => {
    if (done) return;
    playPrngStep('all');
    onCallsChange(cappedGoal);
  };

  const changeState = (value) => {
    onInitialStateChange(value);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded border border-gray-800 bg-black/40 px-2 py-1.5 font-mono">
        <label htmlFor="entropy-prng-state" className="shrink-0 text-amber-300/80">
          S0 =
        </label>
        <input
          id="entropy-prng-state"
          value={initialState}
          onChange={(e) => changeState(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[12px] text-gray-200 outline-none"
        />
      </div>
      <div className="flex items-center justify-between gap-2 font-mono text-[9px]">
        <span className={seedBits ? 'text-amber-300/80' : 'text-gray-600'}>
          {seedBits ? `random S0 · ${seedBits} bits` : 'typed S0 · 0 bits'}
        </span>
        <button
          type="button"
          onClick={onRandomSeed}
          className="inline-flex items-center gap-1 rounded border border-gray-700 px-2 py-1 text-gray-400 transition-all hover:border-cyan-500/35 hover:bg-cyan-950/20 hover:text-cyan-300"
        >
          <Shuffle size={11} strokeWidth={2} />
          Random S0
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={runNext}
          disabled={done}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded border px-2 py-1.5 text-[11px] transition-all ${done ? OFF : PRIMARY}`}
        >
          <Play size={12} strokeWidth={2} />
          Next call
        </button>
        <button
          type="button"
          onClick={runAll}
          disabled={done}
          title={`Run all ${cappedGoal} calls`}
          aria-label={`Run all ${cappedGoal} calls`}
          className={`rounded border px-2 py-1.5 transition-all ${done ? OFF : QUIET}`}
        >
          <FastForward size={12} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={restart}
          disabled={!hasOutput}
          title="Back to S0, same state"
          aria-label="Back to S0, same state"
          className={`rounded border px-2 py-1.5 transition-all ${hasOutput ? QUIET : OFF}`}
        >
          <RotateCcw size={12} strokeWidth={2} />
        </button>
      </div>

      {matchesReference && (
        <div className="rounded border border-emerald-500/25 bg-emerald-950/20 px-2 py-1 font-mono text-[9px] text-emerald-300">
          Same S0, same outputs as the last run.
        </div>
      )}
      {differsFromReference && (
        <div className="rounded border border-amber-500/20 bg-amber-950/10 px-2 py-1 font-mono text-[9px] text-amber-300/80">
          S0 changed from {reference.initialState}: different sequence.
        </div>
      )}
      {!reference && !hasOutput && (
        <div className="font-mono text-[9px] leading-relaxed text-gray-600">
          Entropy comes from S0. Generate random S0 for {targetBits} bits, or type a known S0 for 0.
        </div>
      )}
    </div>
  );
}
