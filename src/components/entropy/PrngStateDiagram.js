import React, { useId } from 'react';
import {
  PRNG_BYTES_PER_CALL,
  PRNG_DEMO_CALLS,
  prngRounds,
} from '../../lib/prng';

const WIDTH = 520;
const ROW_H = 38;
const TOP_Y = 44;
const RAIL_X = 24;
const STATE_X = 48;
const BOX_X = 184;
const BOX_W = 74;
const BOX_H = 26;
const OUT_X = 310;
const HEX_X = 365;

function cleanId(value) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
}

function rowCenter(index) {
  return TOP_Y + index * ROW_H;
}

function Arrow({ x1, y1, x2, y2, markerId, muted }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="1.4"
      markerEnd={`url(#${markerId})`}
      className={muted ? 'text-gray-800' : 'text-gray-600'}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function CallRow({ index, output, markerId, pending, last }) {
  const cy = rowCenter(index);
  const boxTop = cy - BOX_H / 2;
  const stateTone = index === 0 ? 'fill-amber-200/85' : pending ? 'fill-gray-700' : 'fill-gray-500';

  return (
    <g>
      <text
        x={STATE_X}
        y={cy}
        className={stateTone}
        fontFamily="monospace"
        fontSize="14"
        fontWeight={index === 0 ? '700' : '500'}
        dominantBaseline="middle"
      >
        {`S${index}`}
      </text>

      <Arrow x1={STATE_X + 42} y1={cy} x2={BOX_X - 8} y2={cy} markerId={markerId} muted={pending} />

      <rect
        x={BOX_X}
        y={boxTop}
        width={BOX_W}
        height={BOX_H}
        rx="6"
        className={pending ? 'fill-transparent stroke-gray-700' : 'fill-cyan-950/20 stroke-cyan-500/35'}
        strokeWidth="1.4"
      />
      <text
        x={BOX_X + BOX_W / 2}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className={pending ? 'fill-gray-700' : 'fill-cyan-100'}
        fontFamily="monospace"
        fontSize="12"
        fontWeight="700"
      >
        PRNG
      </text>

      <Arrow x1={BOX_X + BOX_W} y1={cy} x2={OUT_X - 8} y2={cy} markerId={markerId} muted={pending} />

      <text
        x={OUT_X}
        y={cy}
        className={pending ? 'fill-cyan-300/20' : 'fill-cyan-300'}
        fontFamily="monospace"
        fontSize="13"
        dominantBaseline="middle"
      >
        {`Out${index}`}
      </text>
      <text
        x={HEX_X}
        y={cy}
        className={output ? 'fill-cyan-300/65' : 'fill-cyan-300/20'}
        fontFamily="monospace"
        fontSize="11.5"
        dominantBaseline="middle"
      >
        {output || '........'}
      </text>

      <path
        d={
          last
            ? `M ${BOX_X + BOX_W / 2} ${cy + BOX_H / 2} V ${cy + ROW_H - 13}`
            : `M ${BOX_X + BOX_W / 2} ${cy + BOX_H / 2} V ${cy + ROW_H / 2} H ${RAIL_X} V ${rowCenter(index + 1)} H ${STATE_X - 6}`
        }
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        markerEnd={`url(#${markerId})`}
        className={pending ? 'text-gray-800' : 'text-gray-600'}
        vectorEffect="non-scaling-stroke"
      />

      {last && (
        <text
          x={BOX_X + BOX_W / 2 + 9}
          y={cy + ROW_H - 11}
          className={pending ? 'fill-gray-700' : 'fill-gray-500'}
          fontFamily="monospace"
          fontSize="12"
          dominantBaseline="middle"
        >
          {`S${index + 1}`}
        </text>
      )}
    </g>
  );
}

export default function PrngStateDiagram({
  initialState,
  calls,
  callGoal = PRNG_DEMO_CALLS,
  seedBits = 0,
  compact = false,
  framed = true,
  className = '',
}) {
  const rawId = useId();
  const markerId = `prng-circuit-arrow-${cleanId(rawId)}`;
  const rowCount = Math.max(1, callGoal);
  const visibleCalls = Math.max(0, Math.min(calls, rowCount));
  const rounds = prngRounds(initialState, visibleCalls);
  const outputBytes = visibleCalls * PRNG_BYTES_PER_CALL;
  const totalBytes = rowCount * PRNG_BYTES_PER_CALL;
  const height = TOP_Y + rowCount * ROW_H + 18;
  const wrapper = framed ? 'rounded-lg border border-gray-800 bg-black/30 p-2' : 'p-0';

  return (
    <div className={`prng-diagram ${wrapper} ${className}`}>
      <div className="rounded-md border border-cyan-500/20 bg-black/35 px-2 py-2">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          className="block w-full"
          style={{ maxHeight: compact ? 280 : 330 }}
          role="img"
          aria-label="PRNG state loop"
        >
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-gray-600" />
            </marker>
          </defs>

          <text x={STATE_X} y="18" className="fill-gray-600" fontFamily="monospace" fontSize="9">
            state in
          </text>
          <text x={BOX_X + BOX_W / 2} y="18" textAnchor="middle" className="fill-gray-600" fontFamily="monospace" fontSize="9">
            call
          </text>
          <text x={OUT_X} y="18" className="fill-gray-600" fontFamily="monospace" fontSize="9">
            output
          </text>

          {Array.from({ length: rowCount }, (_, index) => (
            <CallRow
              key={index}
              index={index}
              output={rounds[index]?.output}
              markerId={markerId}
              pending={index >= visibleCalls}
              last={index === rowCount - 1}
            />
          ))}
        </svg>
      </div>

      <div className="mt-2 rounded-md border border-cyan-500/20 bg-black/35 p-2">
        <div className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[10px]">
          <span className="uppercase tracking-widest text-cyan-500/70">Stream</span>
          <span className="text-gray-600">
            <span className="text-cyan-300">{outputBytes}</span> / {totalBytes} bytes
          </span>
        </div>

        <div className="thin-scroll flex items-center gap-1 overflow-x-auto pb-1">
          {Array.from({ length: rowCount }, (_, index) => {
            const round = rounds[index];
            return (
              <span
                key={index}
                className={`shrink-0 rounded border px-1 py-0.5 font-mono text-[10px] ${
                  round
                    ? 'border-cyan-500/25 bg-cyan-950/25 text-cyan-300'
                    : 'border-gray-800 bg-black/30 text-gray-700'
                }`}
                title={`Out${index}`}
              >
                {round ? round.output : '........'}
              </span>
            );
          })}
        </div>

        <div className="mt-1.5 flex items-center justify-between border-t border-gray-800 pt-1.5 font-mono text-[10px]">
          <span className="text-gray-600">H(S0)</span>
          <span className={seedBits ? 'text-amber-300/90' : 'text-gray-500'}>{seedBits} bits</span>
        </div>
      </div>
    </div>
  );
}
