import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleDollarSign, Cpu, Dices, RadioTower, RefreshCcw } from 'lucide-react';
import Coin from './Coin';
import CoinTray from './CoinTray';
import Die from './Die';
import DiceTray from './DiceTray';
import PrngSource from './PrngSource';
import TrngSource from './TrngSource';

function SourceCard({
  icon: Icon,
  label,
  selected,
  hasData,
  cardRef,
  children,
  className = '',
}) {
  return (
    <section
      ref={cardRef}
      className={`entropy-stage-panel flex min-h-0 flex-col rounded-lg border shadow-xl shadow-black/30 transition-all ${
        selected
          ? 'border-yellow-500/55 bg-gray-900/70 shadow-yellow-500/10'
          : hasData
            ? 'border-emerald-500/35 bg-gray-900/50'
            : 'border-yellow-500/25 bg-gray-900/45 hover:border-yellow-500/40 hover:bg-gray-900/55'
      } ${className}`}
    >
      <div className="flex w-full items-center gap-2 px-3 py-3 text-left">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border ${
            selected
              ? 'border-yellow-500/45 bg-yellow-950/35 text-yellow-300'
              : hasData
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                : 'border-gray-700 bg-black/35 text-gray-400'
          }`}
        >
          <Icon size={14} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className={`text-[10px] uppercase tracking-widest ${selected ? 'text-yellow-300' : 'text-gray-400'}`}>
            {label}
          </div>
        </div>
        <span
          className={`ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            selected
              ? 'border-yellow-500/40 bg-yellow-950/30 text-yellow-400'
              : 'border-gray-700 text-gray-500'
          }`}
          title={selected ? 'Selected source' : 'Choose source'}
        >
          {selected && <Check size={12} strokeWidth={2.5} />}
        </span>
      </div>
      {selected && children && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}

const SOURCE_LABELS = {
  dice: 'Dice',
  coin: 'Coins',
  trng: 'TRNG',
  prng: 'PRNG',
};

function SourceActionHeader({ source, onChange, onReset, showReset }) {
  return (
    <div className="mb-2 flex min-w-0 items-center justify-between gap-3">
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-yellow-300"
      >
        &larr; Change source
      </button>
      <div className="flex min-w-0 items-center gap-2">
        <div className="truncate text-[10px] uppercase tracking-widest text-yellow-300">
          {SOURCE_LABELS[source]}
        </div>
        {showReset && (
          <button
            type="button"
            onClick={onReset}
            title="Reset"
            aria-label="Reset"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-gray-800 text-gray-500 transition-all hover:border-gray-700 hover:text-gray-300"
          >
            <RefreshCcw size={11} strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}

function TargetSelector({ targets, targetIdx, onTargetChange, collectedBits }) {
  if (!targets?.length) return null;

  return (
    <div className="mb-3 rounded border border-gray-800 bg-black/25 p-2 font-mono">
      <div className="mb-2 text-[9px] uppercase tracking-widest text-gray-500">
        Seed length
      </div>
      <div className="grid grid-cols-2 gap-2">
        {targets.map((t, i) => {
          const selected = i === targetIdx;
          const cleared = collectedBits >= t.bits;
          return (
            <button
              key={t.bits}
              type="button"
              onClick={() => onTargetChange(i)}
              title={`${t.words} words from ${t.bits} bits`}
              className={`min-w-0 rounded border px-2 py-1.5 text-[11px] transition-all ${
                selected
                  ? cleared
                    ? 'border-emerald-500/50 bg-emerald-950/25 text-emerald-300'
                    : 'border-yellow-500/45 bg-yellow-950/35 text-yellow-400'
                  : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
              }`}
            >
              <span>{t.words} words</span>
              <span className="text-gray-600"> · {t.bits}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Log2({ n }) {
  return (
    <>
      log<sub className="text-base leading-none">2</sub>({n})
    </>
  );
}

function FormulaTerm({ value, label, accent = false }) {
  return (
    <div className="min-w-0 text-center">
      <div className={`whitespace-nowrap text-[30px] leading-none tracking-normal ${accent ? 'text-yellow-400' : 'text-gray-100'}`}>
        {value}
      </div>
      <div className="mt-3 whitespace-nowrap text-[9px] uppercase tracking-widest text-gray-500">
        {label}
      </div>
    </div>
  );
}

function SourceProgress({ source, collectedBits, targetBits, count, flipCount, trngCount }) {
  const value = source === 'dice' ? collectedBits.toFixed(1) : collectedBits.toFixed(0);
  const pct = targetBits ? Math.max(0, Math.min(100, (collectedBits / targetBits) * 100)) : 0;
  const ready = collectedBits >= targetBits;
  const formula = {
    dice: {
      left: count,
      leftLabel: 'rolls',
      middle: <Log2 n="6" />,
      middleLabel: 'bits per die',
      resultLabel: 'bits of entropy',
    },
    coin: {
      left: flipCount,
      leftLabel: 'flips',
      middle: <Log2 n="2" />,
      middleLabel: 'bits per flip',
      resultLabel: 'bits of entropy',
    },
    trng: {
      left: trngCount,
      leftLabel: 'clean bits',
      middle: '1',
      middleLabel: 'bit each',
      resultLabel: 'bits of entropy',
    },
    prng: {
      left: 'H(S0)',
      leftLabel: 'seed entropy',
      resultLabel: 'known here',
    },
  }[source];
  const note = source === 'prng'
    ? collectedBits > 0
      ? 'Random S0 carries entropy; PRNG expands it into bytes.'
      : 'Typed S0 is known here, so H(S0) = 0.'
    : null;

  return (
    <div className="mt-3 rounded border border-yellow-500/20 bg-black/30 px-3 py-3 font-mono">
      <div className="flex min-w-0 items-start justify-center gap-2 overflow-hidden">
        <FormulaTerm value={formula.left} label={formula.leftLabel} />
        {formula.middle && (
          <>
            <div className="pt-0.5 text-[28px] leading-none text-gray-600">&times;</div>
            <FormulaTerm value={formula.middle} label={formula.middleLabel} />
          </>
        )}
        <div className="pt-0.5 text-[28px] leading-none text-gray-600">=</div>
        <FormulaTerm value={value} label={formula.resultLabel} accent />
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full ${ready ? 'bg-emerald-400' : 'bg-yellow-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && (
        <div className="mt-2 text-center text-[9px] leading-relaxed text-gray-500">
          {note}
        </div>
      )}
    </div>
  );
}

function DicePreview({ tick }) {
  const a = (tick % 6) + 1;
  const b = ((tick + 3) % 6) + 1;
  return (
    <div className="flex h-16 items-center justify-center gap-2">
      <Die value={a} spinKey={tick} size={34} spinMs={620} />
      <Die value={b} spinKey={tick} size={34} spinMs={620} />
    </div>
  );
}

function CoinPreview({ tick }) {
  return (
    <div className="flex h-16 items-center justify-center gap-2">
      <Coin value={tick % 2} spinKey={tick} size={34} spinMs={620} />
      <Coin value={(tick + 1) % 2} spinKey={tick} size={34} spinMs={620} />
    </div>
  );
}

function TrngPreview({ tick }) {
  const points = useMemo(() => {
    const out = [];
    for (let i = 0; i < 28; i += 1) {
      const x = (i / 27) * 100;
      const v = 0.5 + Math.sin((i + tick) * 0.72) * 0.24 + Math.sin((i + tick) * 1.9) * 0.12;
      out.push(`${x},${(1 - Math.max(0.08, Math.min(0.92, v))) * 28}`);
    }
    return out.join(' ');
  }, [tick]);

  return (
    <div className="flex h-16 items-center">
      <svg viewBox="0 0 100 28" className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="13" x2="100" y2="13" stroke="currentColor" strokeWidth="0.55" strokeDasharray="2 2" className="text-yellow-400/55" vectorEffect="non-scaling-stroke" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.1" className="text-cyan-300/90" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

function PrngPreview({ tick }) {
  const lit = tick % 4;
  return (
    <div className="flex h-16 items-center justify-center">
      <svg viewBox="0 0 150 54" className="h-14 w-full" aria-hidden="true">
        <path d="M28 27H56M94 27H122M75 39V48H28V35" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-gray-500" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="8" y="16" width="28" height="22" rx="4" className={lit === 0 ? 'fill-amber-400/45' : 'fill-amber-400/20'} />
        <rect x="58" y="13" width="36" height="28" rx="5" className="fill-amber-400/35 stroke-amber-300/45" strokeWidth="1" />
        <rect x="122" y="16" width="24" height="22" rx="4" className={lit > 1 ? 'fill-cyan-300/80' : 'fill-cyan-300/30'} />
        <text x="76" y="31" textAnchor="middle" className="fill-amber-100" fontFamily="monospace" fontSize="9" fontWeight="700">PRNG</text>
      </svg>
    </div>
  );
}

function SourceTile({ icon: Icon, label, description, onSelect, children }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-h-[9rem] min-w-0 flex-col rounded-lg border border-yellow-500/25 bg-gray-900/45 p-3 text-left shadow-xl shadow-black/25 transition-all hover:border-yellow-500/50 hover:bg-gray-900/65 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/70"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-yellow-500/35 bg-yellow-950/30 text-yellow-300">
          <Icon size={14} strokeWidth={2} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-yellow-300">
          {label}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        {children}
      </div>
      <div className="mt-2 font-mono text-[9px] leading-snug text-gray-400 group-hover:text-gray-300">
        {description}
      </div>
    </button>
  );
}

function SourcePicker({ onSelect, anchorRef }) {
  const [tick, setTick] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1300);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div ref={anchorRef} className="flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-3">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-yellow-500/80">
          Choose source
        </div>
        <div className="mt-1 font-mono text-[10px] leading-relaxed text-gray-400">
          Pick where the entropy comes from.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <SourceTile
          icon={Dices}
          label="Dice"
          description="Roll physical dice"
          onSelect={() => onSelect('dice')}
        >
          <DicePreview tick={tick} />
        </SourceTile>

        <SourceTile
          icon={CircleDollarSign}
          label="Coins"
          description="Flip heads or tails"
          onSelect={() => onSelect('coin')}
        >
          <CoinPreview tick={tick} />
        </SourceTile>

        <SourceTile
          icon={RadioTower}
          label="TRNG"
          description="Sample physical noise"
          onSelect={() => onSelect('trng')}
        >
          <TrngPreview tick={tick} />
        </SourceTile>

        <SourceTile
          icon={Cpu}
          label="PRNG"
          description="Expand a seed into bytes"
          onSelect={() => onSelect('prng')}
        >
          <PrngPreview tick={tick} />
        </SourceTile>
      </div>
    </div>
  );
}

export default function SourceStack({
  selectedSource,
  onSourceChange,
  remaining,
  onRolls,
  count = 0,
  flips = [],
  coinRemaining = 0,
  onFlips,
  className = '',
  trngBits = [],
  onTrngBits,
  trngBroken = false,
  onTrngBrokenChange,
  prngState = '',
  onPrngStateChange,
  prngSeedBits = 0,
  onRandomPrngSeed,
  prngCalls = 0,
  onPrngCallsChange,
  prngCallGoal,
  prngStream = '',
  prngReference,
  onPrngReferenceChange,
  anchorRef,
  collectedBits = 0,
  targetBits = 128,
  targets = [],
  targetIdx = 0,
  onTargetChange,
  onReset,
  showReset = false,
}) {
  const changeSource = () => onSourceChange(null);

  const withActiveShell = (source, card) => (
    <div className="min-w-0">
      <SourceActionHeader source={source} onChange={changeSource} onReset={onReset} showReset={showReset} />
      <TargetSelector
        targets={targets}
        targetIdx={targetIdx}
        onTargetChange={onTargetChange}
        collectedBits={collectedBits}
      />
      {card}
      <SourceProgress
        source={source}
        collectedBits={collectedBits}
        targetBits={targetBits}
        count={count}
        flipCount={flips.length}
        trngCount={trngBits.length}
      />
    </div>
  );

  const activeSource = () => {
    switch (selectedSource) {
      case 'dice':
        return withActiveShell('dice', (
          <SourceCard
            icon={Dices}
            label="Dice"
            selected
            hasData={count > 0}
            cardRef={anchorRef}
          >
            <DiceTray remaining={remaining} onRolls={onRolls} />
          </SourceCard>
        ));
      case 'coin':
        return withActiveShell('coin', (
          <SourceCard
            icon={CircleDollarSign}
            label="Coins"
            selected
            hasData={flips.length > 0}
            cardRef={anchorRef}
          >
            <CoinTray remaining={coinRemaining} onFlips={onFlips} />
          </SourceCard>
        ));
      case 'trng':
        return withActiveShell('trng', (
          <SourceCard
            icon={RadioTower}
            label="TRNG"
            selected
            hasData={trngBits.length > 0}
            cardRef={anchorRef}
          >
            <TrngSource
              onBits={onTrngBits}
              broken={trngBroken}
              onBrokenChange={onTrngBrokenChange}
            />
          </SourceCard>
        ));
      case 'prng':
        return withActiveShell('prng', (
          <SourceCard
            icon={Cpu}
            label="PRNG"
            selected
            hasData={prngCalls > 0}
            cardRef={anchorRef}
          >
            <PrngSource
              initialState={prngState}
              onInitialStateChange={onPrngStateChange}
              seedBits={prngSeedBits}
              targetBits={targetBits}
              onRandomSeed={onRandomPrngSeed}
              calls={prngCalls}
              onCallsChange={onPrngCallsChange}
              callGoal={prngCallGoal}
              stream={prngStream}
              reference={prngReference}
              onReferenceChange={onPrngReferenceChange}
            />
          </SourceCard>
        ));
      default:
        return <SourcePicker onSelect={onSourceChange} anchorRef={anchorRef} />;
    }
  };

  return (
    <div className={`thin-scroll flex min-h-0 w-full overflow-auto pr-1 ${className}`}>
      <div
        className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
          {activeSource()}
        </div>
      </div>
    </div>
  );
}
