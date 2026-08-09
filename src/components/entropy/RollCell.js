import React from 'react';

// Shared so a roll looks identical everywhere it appears. The dice tray, the
// roll log, and the hash input are all meant to read as the same object.
export default function RollCell({ value, animate = true }) {
  return (
    <span
      className={`${animate ? 'entropy-roll-in ' : ''}w-5 h-5 shrink-0 flex items-center justify-center rounded-sm border border-yellow-500/20 bg-yellow-950/20 text-yellow-400 text-[10px] font-mono`}
    >
      {value}
    </span>
  );
}
