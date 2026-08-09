import React from 'react';
import StepCard from './StepCard';
import { bitsFromRolls } from '../../lib/entropy';

function Term({ value, label, accent, muted, bumpKey }) {
  return (
    <div className="flex flex-col items-center">
      <span
        key={bumpKey}
        className={`entropy-eq font-mono tabular-nums leading-none ${bumpKey !== undefined ? 'entropy-bump' : ''} ${
          accent
            ? 'text-yellow-400 text-2xl xl:text-3xl'
            : muted
              ? 'text-gray-300 text-xl xl:text-2xl'
              : 'text-white text-2xl xl:text-3xl'
        }`}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-gray-600 mt-1.5">{label}</span>
    </div>
  );
}

const Op = ({ children }) => (
  <span className="text-gray-700 text-lg xl:text-xl font-mono self-start mt-1">{children}</span>
);

export default function CollectStep({ rolls, target }) {
  const count = rolls.length;
  const collected = bitsFromRolls(count);
  const excess = collected - target.bits;

  return (
    <div className="entropy-pipeline p-3 lg:px-4 lg:py-3">
      <StepCard n="1" label="Collect" right={`Target: ${target.bits} bits`} active={count > 0}>
        <div className="flex items-start justify-center gap-3 xl:gap-4">
          <Term value={count} label="rolls" bumpKey={count} />
          <Op>×</Op>
          <Term value="log₂(6)" label="bits per die" muted />
          <Op>=</Op>
          <Term value={collected.toFixed(1)} label="bits of entropy" accent bumpKey={count} />
        </div>

        {/* Where the difference between collected and target goes */}
        <div className="flex items-baseline justify-between gap-2 mt-3 font-mono text-[10px]">
          <span className="text-gray-500">{target.bits} used</span>
          <span className="text-gray-600">
            {excess > 0 ? `${excess.toFixed(1)} excess` : `${(target.bits - collected).toFixed(1)} short`}
          </span>
        </div>
      </StepCard>
    </div>
  );
}
