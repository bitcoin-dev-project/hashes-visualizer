import React from 'react';
import StepCard from './StepCard';
import useWordlist from './useWordlist';
import { bip39Shape, entropyChecksumBits, entropyToBits, mnemonicChunks } from '../../lib/bip39';

const Dots = ({ n }) => <span className="text-gray-700">{'·'.repeat(n)}</span>;

export default function MnemonicPanel({ entropy, target }) {
  const complete = Boolean(entropy);
  const wordlist = useWordlist(complete);
  const shape = bip39Shape(target.bits);

  const bits = complete ? entropyToBits(entropy) : '';
  const checksum = complete ? entropyChecksumBits(entropy) : '';
  const chunks = complete && wordlist ? mnemonicChunks(entropy, wordlist) : [];

  return (
    <div className="entropy-pipeline flex flex-col gap-3 p-3 lg:px-4 lg:py-3">
      {/* hex -> bits -> the checksum that gets appended */}
      <StepCard
        n="5"
        label="Checksum"
        right={`${shape.entropyBits} + ${shape.checksumBits}`}
        active={complete}
      >
        <div className="font-mono text-[10px] break-all leading-relaxed">
          {complete ? <span className="text-yellow-400">{entropy}</span> : <Dots n={shape.entropyBits / 4} />}
        </div>

        <div className="text-xs text-gray-600 my-1 pl-4">↓</div>

        <div className="font-mono text-[9px] break-all leading-[1.45] text-gray-400">
          {complete ? bits : <Dots n={shape.entropyBits} />}
        </div>

        <div className="text-[10px] text-gray-600 mt-1.5 mb-1 pl-4">
          ↓ <span className="font-mono">SHA-256</span> · first {shape.checksumBits}
        </div>

        <div className="font-mono text-[11px] tracking-wider">
          {complete ? <span className="text-yellow-400">{checksum}</span> : <Dots n={shape.checksumBits} />}
        </div>
      </StepCard>

      {/* every group of 11 bits, the number it makes, and the word it picks */}
      <StepCard
        n="6"
        label="Words"
        right={`${shape.totalBits} ÷ 11 = ${shape.words}`}
        active={complete}
      >
        {chunks.length ? (
          // 24 rows do not fit in one column on a laptop, so the long mnemonic
          // splits in two while the 12-word one stays a single readable list.
          <div className={shape.words > 12 ? 'grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-0.5' : 'flex flex-col gap-0.5'}>
            {chunks.map((c, i) => (
              <div key={i} className="flex items-baseline gap-1.5 font-mono text-[10px] min-w-0">
                <span className="w-4 text-right text-gray-700 shrink-0">{i + 1}</span>
                <span className="tracking-tight px-1 rounded-sm bg-gray-800 shrink-0">
                  <span className="text-gray-400">{c.entropyPart}</span>
                  <span className="text-yellow-400">{c.checksumPart}</span>
                </span>
                <span className="text-gray-700 shrink-0">→</span>
                <span className="w-7 text-right text-gray-600 shrink-0">{c.index}</span>
                <span className="text-gray-100 text-xs truncate">{c.word}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="font-mono text-[10px] text-gray-700">
            {complete ? 'loading wordlist…' : `${'·'.repeat(11)} → ···· × ${shape.words}`}
          </div>
        )}
      </StepCard>
    </div>
  );
}
