import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dices, Zap } from 'lucide-react';
import Die from './Die';
import { rollDice } from '../../lib/entropy';
import { playDiceRoll } from '../../lib/sound';

const NORMAL_MS = 850;
const FAST_MS = 300;
const GAP_MS = 100;

// Five at a time: enough that a 12-word seed is ten clicks rather than fifty,
// and Auto covers anyone who does not want to click at all.
const DICE = 5;
const DIE_SIZE = 54;

export default function DiceTray({ remaining, onRolls }) {
  const [values, setValues] = useState(() => Array(DICE).fill(1));
  const [spinKey, setSpinKey] = useState(0);
  const [spinMs, setSpinMs] = useState(NORMAL_MS);
  const [rolling, setRolling] = useState(false);
  const [auto, setAuto] = useState(false);

  const busy = useRef(false);
  const autoRef = useRef(false);
  const remainingRef = useRef(remaining);
  const onRollsRef = useRef(onRolls);
  const rollRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => { remainingRef.current = remaining; }, [remaining]);
  useEffect(() => { onRollsRef.current = onRolls; }, [onRolls]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const stopAuto = useCallback(() => {
    autoRef.current = false;
    setAuto(false);
  }, []);

  const doRoll = useCallback(() => {
    if (busy.current) return;
    if (remainingRef.current <= 0) return;
    busy.current = true;
    setRolling(true);

    const ms = autoRef.current ? FAST_MS : NORMAL_MS;
    const next = rollDice(DICE);
    playDiceRoll(ms);
    setSpinMs(ms);
    setValues(next);
    setSpinKey((k) => k + 1);

    const t = setTimeout(() => {
      busy.current = false;
      setRolling(false);
      onRollsRef.current(next);

      if (!autoRef.current) return;
      // Let the parent's new remaining count flush before deciding to continue.
      const t2 = setTimeout(() => {
        if (!autoRef.current) return;
        if (remainingRef.current > 0) rollRef.current();
        else stopAuto();
      }, GAP_MS);
      timers.current.push(t2);
    }, ms);
    timers.current.push(t);
  }, [stopAuto]);

  useEffect(() => { rollRef.current = doRoll; }, [doRoll]);

  const toggleAuto = useCallback(() => {
    if (autoRef.current) { stopAuto(); return; }
    if (remainingRef.current <= 0) return;
    autoRef.current = true;
    setAuto(true);
    doRoll();
  }, [doRoll, stopAuto]);

  const done = remaining <= 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={doRoll}
        disabled={rolling || done}
        aria-label={`Roll ${DICE} dice`}
        className={`flex flex-wrap items-center justify-center content-center gap-2 rounded-lg border w-full bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70 ${
          done ? 'border-emerald-500/20 cursor-default opacity-70' : 'border-yellow-500/20 hover:border-yellow-500/40'
        }`}
        style={{ cursor: rolling || done ? 'default' : 'pointer', minHeight: DIE_SIZE + 36 }}
      >
        {values.map((v, i) => (
          <Die key={i} value={v} spinKey={spinKey} size={DIE_SIZE} spinMs={spinMs} />
        ))}
      </button>

      <div className="grid w-full grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={doRoll}
          disabled={rolling || done}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded border text-xs transition-all ${
            rolling || done
              ? 'border-gray-800 text-gray-600 cursor-default'
              : 'border-yellow-500/40 bg-yellow-900/50 text-yellow-400 hover:border-yellow-500/60'
          }`}
        >
          <Dices size={14} strokeWidth={2} />
          Roll
        </button>
        <button
          type="button"
          onClick={toggleAuto}
          disabled={done && !auto}
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded border text-xs transition-all ${
            auto
              ? 'border-yellow-500/60 bg-yellow-950/30 text-yellow-400'
              : done
                ? 'border-gray-800 text-gray-600 cursor-default'
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
