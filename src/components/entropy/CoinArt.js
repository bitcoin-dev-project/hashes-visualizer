import React from 'react';

// Struck coin faces, drawn in a 100x100 box so one set of paths serves both
// the 44px tray coins and the 18px ones in the pipeline.
//
// Heads is a profile bust, which is where the side gets its name. Tails is a
// laurel wreath, the usual reverse. Beyond looking like coinage, the two read
// apart at small sizes because one is a solid mass and the other is an open
// ring, which a letter H and a letter T do not.

const INK = '#5b4413';

function Rim() {
  return (
    <>
      <circle cx="50" cy="50" r="46" fill="none" stroke={INK} strokeWidth="2.5" opacity="0.35" />
      <circle cx="50" cy="50" r="41" fill="none" stroke={INK} strokeWidth="1" opacity="0.28" />
    </>
  );
}

function Heads({ labelled }) {
  const cy = labelled ? 36 : 44;
  return (
    <g fill={INK}>
      <circle cx="50" cy={cy} r="13.5" />
      <path d={`M 27 ${cy + 33} a 23 21 0 0 1 46 0 z`} />
    </g>
  );
}

// A laurel wreath: leaves laid around a circle, open at the top. Generating
// them from the angle keeps the thing symmetric by construction. Hand-placing
// two curved branches is what made the first attempt look like an insect.
const LEAVES = 11;
const GAP = 60; // degrees of opening at the top of the wreath

function Tails({ labelled }) {
  const cy = labelled ? 40 : 50;
  const r = labelled ? 22 : 28;

  const at = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return [50 + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };

  // Angles run clockwise on screen because SVG y points down, so starting
  // just past the top gap and sweeping forward closes the ring the long way.
  const start = -90 + GAP / 2;
  const sweep = 360 - GAP;
  const [x1, y1] = at(start);
  const [x2, y2] = at(start + sweep);

  return (
    <g>
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${x2} ${y2}`}
        fill="none"
        stroke={INK}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {Array.from({ length: LEAVES }, (_, i) => {
        const a = start + (sweep * i) / (LEAVES - 1);
        const [x, y] = at(a);
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={labelled ? 6.5 : 8}
            ry={labelled ? 3.2 : 4}
            fill={INK}
            // Slanted off the tangent, the way laurel leaves sit on a branch.
            transform={`rotate(${a + 62} ${x} ${y})`}
          />
        );
      })}
    </g>
  );
}

export default function CoinGlyph({ value, size, labelled = true }) {
  const heads = Boolean(value);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className="block"
      aria-hidden="true"
      focusable="false"
    >
      <Rim />
      {heads ? <Heads labelled={labelled} /> : <Tails labelled={labelled} />}
      {labelled && (
        <text
          x="50"
          y="84"
          textAnchor="middle"
          fill={INK}
          fontFamily="monospace"
          fontSize="13"
          fontWeight="700"
          letterSpacing="1.5"
        >
          {heads ? 'HEADS' : 'TAILS'}
        </text>
      )}
    </svg>
  );
}
