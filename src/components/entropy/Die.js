import React, { useEffect, useRef, useState } from 'react';
import { PIPS } from './pips';

// Cube layout, verified face by face: opposite sides sum to 7.
const REST = {
  1: { x: 0, y: 0 },
  2: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 0, y: 180 },
};

const FACE = {
  1: 'rotateY(0deg)',
  2: 'rotateX(-90deg)',
  3: 'rotateY(90deg)',
  4: 'rotateY(-90deg)',
  5: 'rotateX(90deg)',
  6: 'rotateY(180deg)',
};


// Next angle congruent to `target` mod 360 that is at least `turns` spins ahead,
// so the die always rotates forward and always stops square to a face.
function spinTo(current, target, turns) {
  const base = current + turns * 360;
  return base + ((((target - base) % 360) + 360) % 360);
}

// Sits just behind each face so the rounded corners reveal solid material
// instead of a gap straight through the hollow cube.
function Core({ value, size }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        transform: `${FACE[value]} translateZ(${size / 2 - 3}px)`,
        borderRadius: Math.round(size * 0.04),
        background: '#dcdcd2',
      }}
    />
  );
}

function Face({ value, size }) {
  const pip = Math.round(size * 0.155);

  return (
    <div
      className="absolute inset-0 grid"
      style={{
        transform: `${FACE[value]} translateZ(${size / 2}px)`,
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: Math.round(size * 0.14),
        borderRadius: Math.round(size * 0.1),
        background: 'linear-gradient(145deg, #fbfbf7 0%, #ecece4 55%, #d6d6cc 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(0,0,0,0.10), inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -4px 10px rgba(0,0,0,0.10)',
      }}
    >
      {PIPS[value].map(([row, col]) => (
        <div key={`${row}-${col}`} style={{ gridArea: `${row} / ${col}` }} className="flex items-center justify-center">
          <span
            className="rounded-full block"
            style={{
              width: pip,
              height: pip,
              background: 'radial-gradient(circle at 34% 30%, #4a4a4a 0%, #1c1c1c 60%, #0b0b0b 100%)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.5)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Die({ value, spinKey, size = 72, spinMs = 900 }) {
  const [rot, setRot] = useState(() => REST[value] || REST[1]);
  const seenKey = useRef(spinKey);

  useEffect(() => {
    if (spinKey === seenKey.current) return;
    seenKey.current = spinKey;
    const rest = REST[value];
    setRot((r) => ({
      x: spinTo(r.x, rest.x, 2 + Math.floor(Math.random() * 2)),
      y: spinTo(r.y, rest.y, 2 + Math.floor(Math.random() * 3)),
    }));
  }, [spinKey, value]);

  return (
    <div style={{ perspective: 900, width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
          transition: `transform ${spinMs}ms cubic-bezier(0.18, 0.72, 0.19, 1)`,
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <Core key={`core-${v}`} value={v} size={size} />
        ))}
        {[1, 2, 3, 4, 5, 6].map((v) => (
          <Face key={v} value={v} size={size} />
        ))}
      </div>
    </div>
  );
}
