import React, { useEffect, useRef, useState } from 'react';
import { HEADS } from '../../lib/coin';
import CoinGlyph from './CoinArt';

// Same approach as the dice: a real CSS 3D object rather than a physics or
// sprite library. The flip has to end on a face the caller already chose, and
// a tumbling simulation would only have to be forced back onto that answer.
const THICK = 5;

// Heads faces the viewer at rest; tails is the same disc turned over.
const REST = { 1: 0, 0: 180 };

// Next angle congruent to `target` mod 360 that is at least `turns` spins
// ahead, so the coin always turns forward and always lands square to a face.
function spinTo(current, target, turns) {
  const base = current + turns * 360;
  return base + ((((target - base) % 360) + 360) % 360);
}

function Face({ size, back, heads }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-full"
      style={{
        transform: `rotateX(${back ? 180 : 0}deg) translateZ(${THICK / 2}px)`,
        backfaceVisibility: 'hidden',
        background: 'radial-gradient(circle at 34% 28%, #f6e5ab 0%, #e3c469 42%, #b98f2f 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(90,63,10,0.45), inset 0 2px 5px rgba(255,255,255,0.55), inset 0 -3px 7px rgba(90,63,10,0.28)',
      }}
    >
      <CoinGlyph value={heads ? 1 : 0} size={size} />
    </div>
  );
}

export default function Coin({ value, spinKey, size = 44, spinMs = 900 }) {
  const [rot, setRot] = useState(() => REST[value] ?? 0);
  const seenKey = useRef(spinKey);

  useEffect(() => {
    if (spinKey === seenKey.current) return;
    seenKey.current = spinKey;
    setRot((r) => spinTo(r, REST[value], 3 + Math.floor(Math.random() * 3)));
  }, [spinKey, value]);

  return (
    <div style={{ perspective: 800, width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rot}deg)`,
          transition: `transform ${spinMs}ms cubic-bezier(0.18, 0.72, 0.19, 1)`,
        }}
      >
        {/* Sits between the two faces so the coin reads as solid metal rather
            than two sheets when it is caught mid-turn. */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: '#8f6d22' }}
        />
        <Face size={size} heads />
        <Face size={size} back />
      </div>
    </div>
  );
}

export { HEADS };
