import React from 'react';
import { OPERATIONS, wordHex } from '../../lib/chacha20';

const bits = (value) => (value >>> 0).toString(2).padStart(32, '0');

function BitLine({ label, value, highlight = 0, rotated = false }) {
  const binary = bits(value);
  return (
    <div className="cc-bitline">
      <span>{label}</span>
      <code>
        {binary.split('').map((bit, i) => (
          <span
            key={i}
            className={
              highlight && (rotated ? i >= 32 - highlight : i < highlight) ? 'cc-bit-wrap' : ''
            }
          >
            {bit}
          </span>
        ))}
      </code>
    </div>
  );
}

export default function QuarterRound({ quarter, operation, onOperation }) {
  const op = OPERATIONS[Math.max(0, operation - 1)];
  const before = quarter.steps[Math.max(0, operation - 1)];
  const after = quarter.steps[operation];
  const a = before[op.target];
  const b = before[op.source];
  return (
    <div className="cc-quarter">
      <div className="cc-registers">
        {'abcd'.split('').map((letter, i) => (
          <div key={letter}>
            <span>
              {letter} <small>word {quarter.indices[i]}</small>
            </span>
            <code>{wordHex(after[i])}</code>
          </div>
        ))}
      </div>
      <div className="cc-section-label">Select an operation</div>
      <div className="cc-operations">
        {OPERATIONS.map((item, i) => (
          <button
            type="button"
            key={i}
            className={operation === i + 1 ? 'is-active' : ''}
            aria-pressed={operation === i + 1}
            onClick={() => onOperation(i + 1)}
          >
            <span>{String(i + 1).padStart(2, '0')}</span>
            <code>{item.formula}</code>
            <small>{item.type === 'rotate' ? 'ROTL' : item.type.toUpperCase()}</small>
          </button>
        ))}
      </div>
      <div className="cc-mini-controls">
        <button
          type="button"
          onClick={() => onOperation(operation - 1)}
          disabled={operation === 0}
          aria-label="Previous operation"
        >
          ←
        </button>
        <span>
          {operation === 0 ? 'Before this quarter round' : `After operation ${operation} / 12`}
        </span>
        <button
          type="button"
          onClick={() => onOperation(operation + 1)}
          disabled={operation === 12}
          aria-label="Next operation"
        >
          →
        </button>
      </div>
      {operation > 0 && (
        <div className="cc-operation-detail" aria-live="polite">
          <h3>
            {op.type === 'add'
              ? 'ADD · keep the lowest 32 bits'
              : op.type === 'xor'
                ? 'XOR · different bits give 1'
                : `ROTATE LEFT · ${op.amount} places`}
          </h3>
          <code className="cc-equation">
            {wordHex(a)} {op.type === 'add' ? '+' : op.type === 'xor' ? '⊕' : '↶'}{' '}
            {op.type === 'rotate' ? op.amount : wordHex(b)}
            <br />= {wordHex(after[op.target])}
          </code>
          <div className="cc-bits">
            <BitLine label="in" value={a} highlight={op.type === 'rotate' ? op.amount : 0} />
            {op.type !== 'rotate' && <BitLine label={op.type === 'add' ? '+' : '⊕'} value={b} />}
            <BitLine
              label="out"
              value={after[op.target]}
              highlight={op.type === 'rotate' ? op.amount : 0}
              rotated
            />
          </div>
          <details className="cc-more" key={op.type}>
            <summary>How {op.type === 'rotate' ? 'rotation' : op.type.toUpperCase()} works</summary>
            {op.type === 'add' && (
              <p>
                Normal addition, wrapping at 2³².{' '}
                {a + b > 0xffffffff
                  ? 'This sum overflows, so discard the carry above bit 31.'
                  : 'This sum fits in 32 bits, so nothing wraps this time.'}
              </p>
            )}
            {op.type === 'xor' && (
              <p>Compare each pair of bits: 0 ⊕ 0 = 0, 1 ⊕ 1 = 0, and 0 ⊕ 1 = 1.</p>
            )}
            {op.type === 'rotate' && (
              <p>The highlighted bits wrap from the left edge to the right. No bits are lost.</p>
            )}
          </details>
        </div>
      )}
    </div>
  );
}
