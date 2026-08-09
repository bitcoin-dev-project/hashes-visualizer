import React from 'react';
import { PIPS } from './pips';

// A flat die face. The rolling dice are real CSS cubes, which is far too much
// markup to repeat a hundred times, so the pipeline uses these instead.
export default function DieFace({ value, size = 20 }) {
  const pip = Math.max(2, Math.round(size * 0.17));

  return (
    <span
      className="entropy-bump inline-grid shrink-0"
      style={{
        width: size,
        height: size,
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.round(size * 0.16),
        borderRadius: Math.round(size * 0.22),
        background: 'linear-gradient(145deg, #fbfbf7 0%, #ecece4 60%, #dcdcd2 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.14)',
      }}
    >
      {PIPS[value].map(([row, col]) => (
        <span key={`${row}-${col}`} style={{ gridArea: `${row} / ${col}` }} className="flex items-center justify-center">
          <span className="rounded-full block" style={{ width: pip, height: pip, background: '#1c1c1c' }} />
        </span>
      ))}
    </span>
  );
}
