import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CircleDollarSign, Zap } from 'lucide-react';
import Coin from './Coin';
import { flipCoins } from '../../lib/coin';
import { playCoinFlip } from '../../lib/sound';

const NORMAL_MS = 800;
const FAST_MS = 280;
const GAP_MS = 90;

// Eight at a time. A coin is one bit, so 128 bits is 128 flips: at five a time
// that is 26 clicks, which is a chore. Eight makes it 16, and Auto covers
// anyone who does not want to click at all.
const COINS = 8;
const COIN_SIZE = 40;

export default function CoinTray({ remaining, onFlips }) {
  const [values, setValues] = useState(() => Array(COINS).fill(1));
  const [spinKey, setSpinKey] = useState(0);
  const [spinMs, setSpinMs] = useState(NORMAL_MS);
  const [flipping, setFlipping] = useState(false);
  const [auto, setAuto] = useState(false);

  const busy = useRef(false);
  const autoRef = useRef(false);
  const remainingRef = useRef(remaining);
  const onFlipsRef = useRef(onFlips);
  const flipRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { onFlipsRef.current = onFlips; }, [onFlips]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const stopAuto = useCallback(() => {
    autoRef.current = false;
    setAuto(false);
  }, []);

  const doFlip = useCallback(() => {
    if (busy.current) return;
    if (remainingRef.current <= 0) return;
    busy.current = true;
    setFlipping(true);

    const ms = autoRef.current ? FAST_MS : NORMAL_MS;
    // Never hand back more flips than the target still needs, or the last
    // batch would overshoot the bit count it is meant to land on.
    const batch = Math.max(1, Math.min(COINS, remainingRef.current));
    const next = flipCoins(COINS);
    playCoinFlip(autoRef.current);
    setSpinMs(ms);
    setValues(next);
    setSpinKey((k) => k + 1);

    const t = setTimeout(() => {
      busy.current = false;
      setFlipping(false);
      onFlipsRef.current(next.slice(0, batch));

      if (!autoRef.current) return;
      // Let the parent's new remaining count flush before deciding to continue.
      const t2 = setTimeout(() => {
        if (!autoRef.current) return;
        if (remainingRef.current > 0) flipRef.current();
        else stopAuto();
      }, GAP_MS);
      timers.current.push(t2);
    }, ms);
    timers.current.push(t);
  }, [stopAuto]);

  useEffect(() => { flipRef.current = doFlip; }, [doFlip]);

  const toggleAuto = useCallback(() => {
    if (autoRef.current) { stopAuto(); return; }
    if (remainingRef.current <= 0) return;
    autoRef.current = true;
    setAuto(true);
    doFlip();
  }, [doFlip, stopAuto]);

  const done = remaining <= 0;
  // Show exactly as many coins as the next press will actually record, so the
  // tray never displays a flip that did not make it into the bit count.
  const shown = done ? COINS : Math.max(1, Math.min(COINS, remaining));

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={doFlip}
        disabled={flipping || done}
        aria-label={`Flip ${shown} coins`}
        className={`w-full rounded-lg border bg-black/30 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 ${
          done ? 'cursor-default border-emerald-500/20 opacity-70' : 'border-yellow-500/20 hover:border-yellow-500/40'
        }`}
        style={{ cursor: flipping || done ? 'default' : 'pointer' }}
      >
        {/* A fixed four-column grid: flex-wrap split eight coins into rows of
            six and two, which read as two different handfuls. */}
        <span className="grid grid-cols-4 justify-items-center gap-2">
          {values.slice(0, shown).map((v, i) => (
            <Coin key={i} value={v} spinKey={spinKey} size={COIN_SIZE} spinMs={spinMs} />
          ))}
        </span>
      </button>

      <div className="grid w-full grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={doFlip}
          disabled={flipping || done}
          className={`inline-flex items-center justify-center gap-2 rounded border px-4 py-2 text-xs transition-all ${
            flipping || done
              ? 'cursor-default border-gray-800 text-gray-600'
              : 'border-yellow-500/40 bg-yellow-900/50 text-yellow-400 hover:border-yellow-500/60'
          }`}
        >
          <CircleDollarSign size={14} strokeWidth={2} />
          Flip
        </button>
        <button
          type="button"
          onClick={toggleAuto}
          disabled={done && !auto}
          className={`inline-flex items-center justify-center gap-1.5 rounded border px-4 py-2 text-xs transition-all ${
            auto
              ? 'border-yellow-500/60 bg-yellow-950/30 text-yellow-400'
              : done
                ? 'cursor-default border-gray-800 text-gray-600'
                : 'border-gray-700 text-gray-400 hover:text-gray-200'
          }`}
        >
          <Zap size={13} strokeWidth={2} />
          {auto ? 'Stop' : 'Auto'}
        </button>
      </div>
    </div>
  );
}
