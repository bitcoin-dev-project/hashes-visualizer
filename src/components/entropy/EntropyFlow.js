import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Binary,
  BookOpen,
  CircleDollarSign,
  Cog,
  Cpu,
  Dices,
  Hash,
  Info,
  RadioTower,
} from 'lucide-react';
import CoinFace from './CoinFace';
import DieFace from './DieFace';
import RollCell from './RollCell';
import PrngStateDiagram from './PrngStateDiagram';
import SourceStack from './SourceStack';
import useWordlist from './useWordlist';
import {
  bip39Shape,
  entropyChecksumBits,
  entropyToBits,
  mnemonicChunks,
} from '../../lib/bip39';

// What the SOURCE arrow is carrying, so it is not an unlabelled line.
const SOURCE_NAMES = {
  dice: 'dice',
  coin: 'coins',
  trng: 'noise',
  prng: 'state',
};

// Named after the lane each one comes from, so the entropy panel can spell out
// the actual conditioning step instead of leaving an arrow to imply it.
const HASH_INPUT_NAMES = {
  dice: 'digits',
  coin: 'bits',
  trng: 'clean bits',
};

const PANEL_TONES = {
  input: {
    border: 'border-yellow-500/20',
    icon: 'border-yellow-500/30 bg-yellow-950/30 text-yellow-400',
    eyebrow: 'text-yellow-500/70',
    title: 'text-yellow-300',
  },
  machine: {
    border: 'border-cyan-500/20',
    icon: 'border-cyan-500/30 bg-cyan-950/30 text-cyan-400',
    eyebrow: 'text-cyan-500/70',
    title: 'text-cyan-300',
  },
  output: {
    border: 'border-emerald-500/20',
    icon: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400',
    eyebrow: 'text-emerald-500/70',
    title: 'text-emerald-300',
  },
};

function StagePanel({ eyebrow, title, icon: Icon, tone = 'input', children, className = '' }) {
  const c = PANEL_TONES[tone];

  return (
    <section
      className={`entropy-stage-panel flex min-h-[360px] xl:min-h-0 flex-col rounded-lg border ${c.border} bg-gray-900/50 shadow-xl shadow-black/30 ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-gray-800/80 px-4 py-3 shrink-0">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${c.icon}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <div className={`text-[9px] uppercase tracking-[0.24em] ${c.eyebrow}`}>{eyebrow}</div>
          <h2 className={`mt-0.5 truncate text-sm font-bold tracking-wide ${c.title}`}>{title}</h2>
        </div>
      </div>
      {/* flex column, not a block: children use flex-1/min-h-0 to get a bounded
          height, which is what lets their inner overflow-auto actually scroll
          instead of spilling past the panel. */}
      <div className="flex-1 min-h-0 p-3 lg:p-4 flex flex-col">{children}</div>
    </section>
  );
}

// offsetY, when given, is the y of the thing this arrow comes out of, measured
// from the top of the row. Without it the arrow centres itself in the full row
// height and ends up pointing at empty space beside a short column.
function FlowConnector({ label, sublabel, active, offsetY = null }) {
  const tone = active ? 'text-yellow-400' : 'text-gray-500';
  const line = active ? 'bg-yellow-500/50' : 'bg-gray-700';
  const pinned = offsetY != null;

  return (
    <div
      className={`relative flex xl:flex-col items-center shrink-0 py-1 xl:px-3 xl:py-0 w-full xl:w-20 ${
        pinned ? 'justify-start' : 'justify-center'
      }`}
    >
      <div
        className={`flex xl:flex-col items-center gap-2 xl:gap-3 w-full ${pinned ? 'absolute left-3 right-3' : ''}`}
        style={pinned ? { top: offsetY, transform: 'translateY(-50%)' } : undefined}
      >
        <div className="min-w-[4rem] xl:min-w-0 xl:w-full text-center">
          <div className={`font-mono text-[10px] leading-tight ${tone}`}>{label}</div>
          {sublabel && <div className="mt-1 font-mono text-[9px] text-gray-500">{sublabel}</div>}
        </div>
        <div className="hidden xl:flex relative items-center w-full text-gray-500">
          <span className={`h-px flex-1 ${line}`} />
          <span className={`entropy-conveyor-bead ${active ? 'opacity-100' : 'opacity-0'}`} />
          <ArrowRight size={15} strokeWidth={2.4} className={tone} />
        </div>
        <div className="flex xl:hidden flex-col items-center justify-center text-gray-500">
          <span className={`w-px h-6 ${line}`} />
          <ArrowRight size={16} strokeWidth={2.4} className={`${tone} rotate-90`} />
        </div>
      </div>
    </div>
  );
}

function StepArrow({ label, active, title }) {
  const tone = active ? 'text-cyan-300' : 'text-gray-500';

  return (
    <div className="relative h-12 shrink-0">
      <div
        className={`absolute left-1/2 top-0 h-full -translate-x-1/2 ${tone}`}
        title={title || label}
      >
        <svg
          width="16"
          height="46"
          viewBox="0 0 16 46"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 1.5V41M4 37L8 41L12 37"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        className={`absolute top-1/2 -translate-y-1/2 truncate font-mono text-[10px] uppercase tracking-[0.14em] ${tone}`}
        style={{ left: 'calc(50% + 1.5rem)', maxWidth: 'calc(50% - 2rem)' }}
      >
        {label}
      </span>
    </div>
  );
}

function MachineLane({ icon: Icon, label, active, children, className = '' }) {
  return (
    <div
      className={`relative flex min-h-0 flex-col rounded-md border bg-black/40 p-3 ${
        active ? 'border-cyan-500/30' : 'border-gray-700'
      } ${className}`}
    >
      <div className="mb-2 flex items-center justify-between gap-3 shrink-0">
        <span className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest ${active ? 'text-gray-200' : 'text-gray-500'}`}>
          <Icon size={13} strokeWidth={2} />
          {label}
        </span>
      </div>
      <div className="thin-scroll flex-1 min-h-[72px] overflow-auto">{children}</div>
    </div>
  );
}

function useMediaQuery(q) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(q).matches,
  );
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatches(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return matches;
}

// Follows the selected source card so the SOURCE arrow stays level with it.
// The card changes height as its tray fills, hence the observer rather than a
// one-off measurement.
// `key` should change only when the observed element itself changes; height
// changes are picked up by the observer without re-running the effect.
function useAnchorOffset(rowRef, anchorRef, enabled, key) {
  const [offset, setOffset] = useState(null);

  useLayoutEffect(() => {
    if (!enabled) { setOffset(null); return undefined; }

    const measure = () => {
      const row = rowRef.current;
      const anchor = anchorRef.current;
      if (!row || !anchor) { setOffset(null); return; }
      const r = row.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      setOffset(a.top + a.height / 2 - r.top);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    if (anchorRef.current) ro.observe(anchorRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [enabled, key, rowRef, anchorRef]);

  return offset;
}

function useWideRows() {
  const q = '(min-width: 1536px)';
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(q).matches,
  );
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide;
}

function fixedRows(value, perGroup, groupsPerRow) {
  if (!value) return '';
  const perRow = perGroup * groupsPerRow;
  const rows = [];
  for (let i = 0; i < value.length; i += perRow) {
    const slice = value.slice(i, i + perRow);
    const groups = [];
    for (let j = 0; j < slice.length; j += perGroup) groups.push(slice.slice(j, j + perGroup));
    rows.push(groups.join(' '));
  }
  return rows.join('\n');
}

// Bits grouped by 11, not by 8. A byte grouping looks tidy but fights the
// lesson: words consume 11 bits each, so 8-bit groups never line up with the
// word list below. Grouped this way, group N is word N.
function BitGroups({ bits, checksumLen, perRow, className = '' }) {
  const entropyLen = bits.length - checksumLen;
  const groups = [];
  for (let i = 0; i < bits.length; i += 11) groups.push([i, bits.slice(i, i + 11)]);

  return (
    <div className={`entropy-dump ${className}`}>
      {groups.map(([start, g], gi) => {
        const fromEntropy = Math.max(0, Math.min(g.length, entropyLen - start));
        const last = gi === groups.length - 1;
        return (
          <React.Fragment key={start}>
            <span className="text-gray-300">{g.slice(0, fromEntropy)}</span>
            <span className="text-yellow-400">{g.slice(fromEntropy)}</span>
            {!last && ((gi + 1) % perRow === 0 ? '\n' : ' ')}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// The whole 256-bit digest, with the tail a smaller target discards shown but
// dimmed. Hiding it made the panel look like SHA-256 had returned 128 bits.
function Digest({ full, keptHex, placeholderHex = 64, className = '' }) {
  if (!full) {
    return <div className={`break-all text-gray-600 ${className}`}>{'·'.repeat(placeholderHex)}</div>;
  }

  const missing = Math.max(0, placeholderHex - full.length);

  return (
    <div className={`break-all ${className}`}>
      <span className="text-yellow-400">{full.slice(0, keptHex)}</span>
      <span className="text-gray-600">
        {full.slice(keptHex)}
        {'·'.repeat(missing)}
      </span>
    </div>
  );
}

function RailStep({ index, label, meta, active, explanation, last = false, children, className = '' }) {
  const [showExplain, setShowExplain] = useState(false);

  return (
    <div className={`grid min-h-0 grid-cols-[2.1rem_minmax(0,1fr)] gap-4 ${last ? 'flex-1' : 'shrink-0'}`}>
      <div className="flex flex-col items-center">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[10px] ${
            active
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-gray-700 bg-black/25 text-gray-500'
          }`}
        >
          {index}
        </span>
        {!last && <span className={`mt-2 w-px flex-1 ${active ? 'bg-emerald-500/25' : 'bg-gray-800'}`} />}
      </div>
      <section className={`min-w-0 ${last ? 'pb-0' : 'pb-7'} ${className}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className={`text-[10px] uppercase tracking-[0.14em] ${active ? 'text-gray-300' : 'text-gray-500'}`}>
            {label}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {explanation && (
              <button
                type="button"
                onClick={() => setShowExplain((open) => !open)}
                aria-expanded={showExplain}
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-all ${
                  showExplain
                    ? 'border-emerald-500/35 bg-emerald-950/20 text-emerald-300'
                    : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300'
                }`}
              >
                <Info size={10} strokeWidth={2} />
                {showExplain ? 'Hide' : 'Explain'}
              </button>
            )}
            {meta && <span className="font-mono text-[10px] text-gray-600">{meta}</span>}
          </span>
        </div>
        {showExplain && explanation && (
          <div className="mb-3 border-l border-emerald-500/25 bg-emerald-950/10 px-3 py-2 font-mono text-[9px] leading-relaxed text-gray-400">
            {explanation}
          </div>
        )}
        {children}
      </section>
    </div>
  );
}

function SoftReadout({ children, active, className = '' }) {
  return (
    <div className={`min-w-0 border-l border-gray-800 bg-white/[0.025] px-4 py-3 font-mono leading-relaxed ${
      active ? 'text-gray-200' : 'text-gray-600'
    } ${className}`}>
      {children}
    </div>
  );
}

function WordMap({ chunks, ready }) {
  if (!chunks.length) {
    return (
      <div className="flex h-40 items-center justify-center border-l border-gray-800 bg-white/[0.02] font-mono text-[10px] text-gray-500">
        waiting for entropy
      </div>
    );
  }

  // Each word next to the exact 11 bits that produced it, checksum bits in
  // yellow so you can see them land inside the final word.
  return (
    <div className="flex flex-col gap-y-1 pr-1 font-mono text-[11px]">
      {chunks.map((chunk, i) => (
        <div key={i} className="flex min-w-0 items-baseline gap-2">
            <span className="w-4 shrink-0 text-right text-gray-600 tabular-nums">{i + 1}</span>
          <span className="shrink-0 tracking-tight">
            <span className="text-gray-500">{chunk.entropyPart}</span>
            <span className="text-yellow-400">{chunk.checksumPart}</span>
          </span>
          <span className={`truncate ${ready ? 'text-gray-100' : 'text-gray-400'}`}>{chunk.word}</span>
        </div>
      ))}
    </div>
  );
}

function EntropyReadout({ entropy, hexLen }) {
  if (!entropy) return <div className="break-all text-gray-600">{'·'.repeat(hexLen)}</div>;
  return <div className="break-all text-yellow-400">{entropy}</div>;
}

function MnemonicSteps({ entropy, target, chunks, ready, source }) {
  const groups = useWideRows() ? 4 : 2;
  const hasEntropy = Boolean(entropy);
  const shape = bip39Shape(target.bits);
  const entropyBits = hasEntropy ? entropyToBits(entropy) : '';
  const checksum = hasEntropy ? entropyChecksumBits(entropy) : '';
  const entropyExplain = source === 'prng'
    ? `BIP-39 starts with these ${target.bits} bits from the PRNG stream. No extra SHA-256 is applied here.`
    : `BIP-39 starts with exactly these ${target.bits} bits of entropy from the machine.`;
  const bitsExplain = `BIP-39 hashes the entropy bytes with SHA-256, appends the first ${shape.checksumBits} checksum bits, then reads ${shape.totalBits} bits in 11-bit groups.`;
  const mnemonicExplain = 'Each 11-bit group is a number from 0 to 2047. That number picks one word from the BIP-39 wordlist.';

  return (
    <div className="flex flex-col font-mono">
      <RailStep
        index="1"
        label="Entropy"
        active={hasEntropy}
        explanation={entropyExplain}
      >
        <SoftReadout active={hasEntropy} className="text-[11px]">
          <EntropyReadout entropy={entropy} hexLen={target.bits / 4} />
        </SoftReadout>
      </RailStep>

      {/* Entropy is 128 or 256 bits and a row is 16 or 32, so the checksum
          always begins a fresh final row. That lets it be appended in place and
          labelled there, instead of needing a step of its own. */}
      <RailStep
        index="2"
        label="Bits"
        active={hasEntropy}
        explanation={bitsExplain}
      >
        <SoftReadout active={hasEntropy} className="text-[10px]">
          {hasEntropy ? (
            <BitGroups
              bits={entropyBits + checksum}
              checksumLen={shape.checksumBits}
              perRow={groups}
            />
          ) : (
            <span className="entropy-dump text-gray-600">
              {fixedRows('·'.repeat(shape.totalBits), 11, groups)}
            </span>
          )}
          <div className="mt-1.5 text-[9px] text-gray-500">
            one group of 11 = one word &middot; yellow = checksum
          </div>
        </SoftReadout>
      </RailStep>

      <RailStep
        index="3"
        label="Mnemonic"
        active={hasEntropy}
        explanation={mnemonicExplain}
        last
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0">
            <WordMap chunks={chunks} ready={ready} />
          </div>
        </div>
      </RailStep>
    </div>
  );
}


export default function EntropyFlow({
  selectedSource,
  onSourceChange,
  rolls,
  target,
  remaining,
  onRolls,
  flips,
  coinRemaining,
  onFlips,
  entropy,
  fullDigest,
  enough,
  trngBits,
  onTrngBits,
  trngBroken,
  onTrngBrokenChange,
  prngState,
  onPrngStateChange,
  prngSeedBits,
  onRandomPrngSeed,
  prngCalls,
  onPrngCallsChange,
  prngCallGoal,
  prngStream,
  prngReference,
  onPrngReferenceChange,
  collected,
  targets,
  targetIdx,
  onTargetChange,
  onReset,
  showReset,
}) {
  const count = rolls.length;
  const flipCount = flips.length;
  const hasDice = selectedSource === 'dice' && count > 0;
  const hasCoin = selectedSource === 'coin' && flipCount > 0;
  const hasTrng = selectedSource === 'trng' && trngBits.length > 0;
  const hasPrng = selectedSource === 'prng' && prngCalls > 0;
  const sourceChosen = Boolean(selectedSource);
  const dropped = 256 - target.bits;
  const started = hasDice || hasCoin || hasTrng || hasPrng;
  const directPrng = selectedSource === 'prng';
  const prngCallBits = prngCallGoal ? target.bits / prngCallGoal : 32;
  const prngOutputBits = Math.min(target.bits, prngCalls * prngCallBits);
  const hashInputName = HASH_INPUT_NAMES[selectedSource] || 'input';

  const wordlist = useWordlist(started);
  const chunks = started && wordlist ? mnemonicChunks(entropy, wordlist) : [];

  // Only the wide layout puts the columns side by side; stacked, the arrow
  // already sits between them and needs no help.
  const rowRef = useRef(null);
  const sourceAnchorRef = useRef(null);
  const sideBySide = useMediaQuery('(min-width: 1280px)');
  const sourceOffset = useAnchorOffset(rowRef, sourceAnchorRef, sideBySide, selectedSource);

  return (
    <div className="w-full min-h-[820px] xl:min-h-0 xl:h-full flex flex-col">
      {/* The bit count lives on each source card now: it belongs next to the
          thing producing it, not in a banner over the whole page. */}
      <div ref={rowRef} className="flex-1 min-h-0 flex flex-col xl:flex-row xl:items-stretch gap-3 xl:gap-0">
        <SourceStack
          selectedSource={selectedSource}
          onSourceChange={onSourceChange}
          remaining={remaining}
          onRolls={onRolls}
          count={count}
          flips={flips}
          coinRemaining={coinRemaining}
          onFlips={onFlips}
          trngBits={trngBits}
          onTrngBits={onTrngBits}
          trngBroken={trngBroken}
          onTrngBrokenChange={onTrngBrokenChange}
          prngState={prngState}
          onPrngStateChange={onPrngStateChange}
          prngSeedBits={prngSeedBits}
          onRandomPrngSeed={onRandomPrngSeed}
          prngCalls={prngCalls}
          onPrngCallsChange={onPrngCallsChange}
          prngCallGoal={prngCallGoal}
          prngStream={prngStream}
          prngReference={prngReference}
          onPrngReferenceChange={onPrngReferenceChange}
          anchorRef={sourceAnchorRef}
          collectedBits={collected}
          targetBits={target.bits}
          targets={targets}
          targetIdx={targetIdx}
          onTargetChange={onTargetChange}
          onReset={onReset}
          showReset={showReset}
          className="xl:basis-[23%] xl:min-w-0"
        />

        <FlowConnector
          label="SOURCE"
          sublabel={SOURCE_NAMES[selectedSource]}
          active={sourceChosen}
          offsetY={sourceOffset}
        />

        <StagePanel
          eyebrow="Machine"
          title="Processor"
          icon={Cog}
          tone="machine"
          className="xl:basis-[43%] xl:min-w-0 xl:h-full xl:min-h-0"
        >
          <div className="entropy-machine-core relative flex-1 min-h-[520px] xl:min-h-0 rounded-lg border border-cyan-500/20 bg-gray-900/50 p-3 overflow-auto thin-scroll">
            <div className="relative z-10 flex h-full min-h-0 flex-col gap-2.5">
              {!selectedSource && (
                <MachineLane
                  icon={Hash}
                  label="Source"
                  active={false}
                  className="min-h-[84px] flex-1"
                >
                  <div className="flex h-full min-h-[68px] items-center justify-center rounded border border-dashed border-gray-700 bg-black/25 font-mono text-[10px] uppercase tracking-widest text-gray-500">
                    select a source
                  </div>
                </MachineLane>
              )}

              {selectedSource === 'dice' && (
                <>
                  <MachineLane
                    icon={Dices}
                    label="Dice"
                    active={hasDice}
                    className="min-h-[84px] flex-1"
                  >
                    {count ? (
                      <div className="flex flex-wrap gap-1 content-start">
                        {rolls.map((v, i) => <DieFace key={i} value={v} size={20} />)}
                      </div>
                    ) : (
                      <div className="h-full min-h-[68px] rounded border border-dashed border-gray-700 bg-black/25" />
                    )}
                  </MachineLane>

                  <StepArrow
                    label="to digits"
                    title="Join roll values in order"
                    active={hasDice}
                  />

                  <MachineLane
                    icon={Binary}
                    label="Digits"
                    active={hasDice}
                    className="min-h-[70px] flex-1"
                  >
                    {count ? (
                      <div className="flex flex-wrap items-center gap-1 content-start">
                        {rolls.map((v, i) => <RollCell key={i} value={v} />)}
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-gray-600">{'·'.repeat(48)}</span>
                    )}
                  </MachineLane>
                </>
              )}

              {selectedSource === 'coin' && (
                <>
                  <MachineLane
                    icon={CircleDollarSign}
                    label="Coins"
                    active={hasCoin}
                    className="min-h-[84px] flex-1"
                  >
                    {flipCount ? (
                      <div className="flex flex-wrap gap-1 content-start">
                        {flips.map((v, i) => <CoinFace key={i} value={v} size={18} />)}
                      </div>
                    ) : (
                      <div className="h-full min-h-[68px] rounded border border-dashed border-gray-700 bg-black/25" />
                    )}
                  </MachineLane>

                  <StepArrow
                    label="to bits"
                    title="Heads becomes 1, tails becomes 0"
                    active={hasCoin}
                  />

                  <MachineLane
                    icon={Binary}
                    label="Bits"
                    active={hasCoin}
                    className="min-h-[70px] flex-1"
                  >
                    {flipCount ? (
                      <div className="flex flex-wrap items-center gap-1 content-start">
                        {flips.map((v, i) => <RollCell key={i} value={v} />)}
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-gray-600">{'·'.repeat(48)}</span>
                    )}
                  </MachineLane>
                </>
              )}

              {selectedSource === 'trng' && (
                <MachineLane
                  icon={RadioTower}
                  label="TRNG bits"
                  active={hasTrng}
                  className="min-h-[84px] flex-1"
                >
                  {trngBits.length ? (
                    <div className="entropy-dump text-[10px] text-gray-300">
                      {fixedRows(trngBits.join(''), 8, 4)}
                    </div>
                  ) : (
                    <span className="font-mono text-[11px] text-gray-600">{'·'.repeat(48)}</span>
                  )}
                </MachineLane>
              )}

              {selectedSource === 'prng' && (
                <>
                  <MachineLane
                    icon={Cpu}
                    label="PRNG interaction"
                    active={Boolean(prngState)}
                    className={prngCallGoal <= 4 ? 'min-h-[380px] flex-[1.35]' : 'min-h-[500px] flex-[2]'}
                  >
                    <PrngStateDiagram
                      initialState={prngState}
                      calls={prngCalls}
                      callGoal={prngCallGoal}
                      seedBits={prngSeedBits}
                      framed={false}
                    />
                  </MachineLane>
                </>
              )}

              {selectedSource && (
                <>
                  <StepArrow
                    label={directPrng ? 'use stream' : 'sha256'}
                    title={
                      directPrng
                        ? `${prngCallGoal} PRNG calls produce ${target.bits} bits; use them as entropy`
                        : `sha256(${hashInputName}) returns 256 bits; keep the first ${target.bits} bits`
                    }
                    active={started}
                  />

                  <MachineLane
                    icon={Hash}
                    label="Entropy"
                    active={started}
                    className="min-h-[130px] shrink-0"
                  >
                    {/* A digest is one value, so it runs as one string. It was
                        split into 8-char groups, which reads like four fields. */}
                    <div className="font-mono text-[11px] leading-relaxed">
                      <div className="mb-1.5">
                        {directPrng ? (
                          <>
                            <span className="text-gray-500">stream =</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gray-500">sha256(</span>
                            <span className={started ? 'text-gray-200' : 'text-gray-600'}>
                              {hashInputName}
                            </span>
                            <span className="text-gray-500">) =</span>
                          </>
                        )}
                      </div>
                      <Digest
                        full={fullDigest}
                        keptHex={target.bits / 4}
                        placeholderHex={directPrng ? target.bits / 4 : 64}
                      />
                      {directPrng && (
                        <div className="mt-2 text-[9px] text-gray-500">
                          <span className="text-cyan-300">{prngOutputBits}</span> / {target.bits} bits from stream
                        </div>
                      )}
                      {!directPrng && dropped > 0 && (
                        <div className="mt-2 text-[9px] text-gray-500">
                          SHA-256 always returns 256 bits &middot; the dimmed{' '}
                          <span className="text-gray-500">{dropped}</span> are dropped
                        </div>
                      )}
                    </div>
                  </MachineLane>
                </>
              )}
            </div>
          </div>
        </StagePanel>

        <FlowConnector
          label="BIP-39"
          active={started}
        />

        <StagePanel
          eyebrow="Output"
          title="Mnemonic"
          icon={BookOpen}
          tone="output"
          className="flex-1 xl:min-w-0 xl:h-full xl:min-h-0"
        >
          <div className="thin-scroll h-full min-h-[420px] xl:min-h-0 overflow-auto pr-1">
            <MnemonicSteps entropy={entropy} target={target} chunks={chunks} ready={enough} source={selectedSource} />
          </div>
        </StagePanel>
      </div>
    </div>
  );
}
