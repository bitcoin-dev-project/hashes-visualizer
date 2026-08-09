import React from 'react';
import CoinGlyph from './CoinArt';

// A flat coin. The tray coins are real CSS 3D discs, which is far too much
// markup to repeat 256 times, so the pipeline uses these instead. No word on
// the face at this size: the bust and the wreath still tell the sides apart.
export default function CoinFace({ value, size = 20 }) {
  return (
    <span
      className="entropy-bump inline-flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 34% 28%, #f6e5ab 0%, #e3c469 45%, #bd932f 100%)',
        boxShadow: 'inset 0 0 0 1px rgba(90,63,10,0.4)',
      }}
      title={value ? 'heads' : 'tails'}
    >
      <CoinGlyph value={value} size={size} labelled={false} />
    </span>
  );
}
