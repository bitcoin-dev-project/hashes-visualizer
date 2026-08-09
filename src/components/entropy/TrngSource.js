import React, { useCallback, useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import {
  SKEWED,
  bitsFromSamples,
  sampleNoise,
  vonNeumann,
} from '../../lib/trng';
import { playBreakToggle, playTrngSample } from '../../lib/sound';

// Sized so a full 256-bit seed takes several presses rather than one:
// real hardware is far faster, but one click filling the meter hides the work.
const BATCH = 192;    // raw samples taken per press
const WAVE = 56;      // how much of the signal we draw

function clamp01(n) {
  return Math.max(0.02, Math.min(0.98, n));
}

function liveNoisePoint(t, broken) {
  if (broken) return 0.96 + Math.sin(t * 0.08) * 0.015 + Math.random() * 0.01;
  return clamp01(
    0.5
      + Math.sin(t * 0.55) * 0.16
      + Math.sin(t * 1.37 + 1.8) * 0.11
      + (Math.random() - 0.5) * 0.38,
  );
}

export default function TrngSource({ onBits, broken, onBrokenChange }) {
  const [wave, setWave] = useState(() => Array.from({ length: WAVE }, (_, i) => liveNoisePoint(i, false)));
  const [samplePulse, setSamplePulse] = useState(0);

  useEffect(() => {
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      setWave((prev) => {
        const base = prev.length ? prev.slice(1) : [];
        while (base.length < WAVE - 1) base.push(liveNoisePoint(tick + base.length, broken));
        base.push(liveNoisePoint(tick + WAVE, broken));
        return base;
      });
    }, 90);

    return () => window.clearInterval(id);
  }, [broken]);

  const sample = useCallback(() => {
    playTrngSample(broken);
    // A dead noise source sits pinned at one rail instead of wandering.
    const samples = broken
      ? Array.from({ length: BATCH }, () => 0.97 + Math.random() * 0.02)
      : sampleNoise(BATCH);

    const bits = bitsFromSamples(samples, SKEWED);
    setSamplePulse((n) => n + 1);
    onBits(vonNeumann(bits));
  }, [broken, onBits]);

  const toggleBroken = useCallback(() => {
    const next = !broken;
    playBreakToggle(next);
    onBrokenChange(next);
  }, [broken, onBrokenChange]);

  // Draw the signal and the comparator threshold it is read against.
  const w = 100;
  const h = 26;
  const path = wave.length
    ? wave.map((v, i) => `${(i / (WAVE - 1)) * w},${(1 - v) * h}`).join(' ')
    : '';
  const thresholdY = (1 - SKEWED) * h;

  return (
    <div className="flex flex-col gap-2">
      <div className="trng-scope relative overflow-hidden rounded border border-gray-800 bg-black/40 p-1.5">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[26px] w-full" preserveAspectRatio="none">
          <line
            x1="0" y1={thresholdY} x2={w} y2={thresholdY}
            stroke="currentColor" strokeWidth="0.4"
            className={broken ? 'text-red-300/70' : 'text-yellow-300/70'}
            strokeDasharray="2 2" vectorEffect="non-scaling-stroke"
          />
          {path && (
            <polyline
              key={samplePulse}
              points={path} fill="none" stroke="currentColor" strokeWidth="0.85"
              className={`trng-wave-line ${samplePulse ? 'trng-wave-sampled ' : ''}${broken ? 'text-red-400/80' : 'text-cyan-300/90'}`}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {samplePulse > 0 && <span key={samplePulse} className="trng-sample-sweep" />}
      </div>

      <div className="font-mono text-[9px] leading-relaxed text-gray-500">
        TRNG samples physical noise and turns it into random bits.
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={sample}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded border border-yellow-500/40 bg-yellow-900/50 px-2 py-1.5 text-[11px] text-yellow-400 transition-all hover:border-yellow-500/60"
        >
          <Activity size={12} strokeWidth={2} />
          Sample
        </button>
        <button
          type="button"
          onClick={toggleBroken}
          title="Simulate the noise source failing"
          className={`rounded border px-2 py-1.5 text-[11px] transition-all ${
            broken
              ? 'border-red-500/50 bg-red-950/30 text-red-400'
              : 'border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
        >
          {broken ? 'Broken' : 'Break'}
        </button>
      </div>
    </div>
  );
}
