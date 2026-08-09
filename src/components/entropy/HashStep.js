import React from 'react';
import DieFace from './DieFace';
import RollCell from './RollCell';
import StepCard from './StepCard';
import { digestFromRolls } from '../../lib/entropy';

export default function HashStep({ rolls, target }) {
  const count = rolls.length;
  const complete = count > 0;
  const digest = complete ? digestFromRolls(rolls) : '';
  const keep = target.bits / 4;
  // Only the 12-word target is narrower than the digest, so only it truncates.
  const truncates = target.bits < 256;

  return (
    <div className="entropy-pipeline flex flex-col gap-2 p-3 lg:px-4 lg:py-3">
      {/* The faces you actually rolled, so the digits below have a visible source */}
      <StepCard n="2" label="Dice" right={count ? `${count} rolled` : ''} active={count > 0}>
        <div className="flex flex-wrap gap-0.5 content-start">
          {count ? (
            rolls.map((v, i) => <DieFace key={i} value={v} />)
          ) : (
            <span className="font-mono text-[11px] text-gray-700">{'·'.repeat(40)}</span>
          )}
        </div>
      </StepCard>

      <div className="text-sm text-gray-700 pl-4 -my-0.5">↓</div>

      <StepCard n="3" label="Hash input" right={count ? `${count} digits` : ''} active={count > 0}>
        <div className="flex flex-wrap items-center gap-px content-start">
          {count ? (
            rolls.map((v, i) => <RollCell key={i} value={v} />)
          ) : (
            <span className="font-mono text-[11px] text-gray-700">{'·'.repeat(40)}</span>
          )}
        </div>
      </StepCard>

      {/* The operation itself, given room rather than a caption */}
      <div className="flex items-center justify-center gap-3 py-1">
        <span className={`text-3xl leading-none ${complete ? 'text-gray-600' : 'text-gray-800'}`}>↓</span>
        <span className={`font-mono text-sm ${complete ? 'text-yellow-400' : 'text-gray-700'}`}>SHA-256</span>
      </div>

      <StepCard n="4" label="Entropy" right={`${target.bits} bits`} active={complete}>
        <div className="font-mono text-[11px] break-all leading-relaxed">
          {digest ? (
            truncates ? (
              <>
                <span className="text-yellow-400">{digest.slice(0, keep)}</span>
                <span className="text-gray-700">{digest.slice(keep)}</span>
              </>
            ) : (
              <span className="text-yellow-400">{digest}</span>
            )
          ) : (
            <span className="text-gray-700">{'·'.repeat(64)}</span>
          )}
        </div>
      </StepCard>
    </div>
  );
}
