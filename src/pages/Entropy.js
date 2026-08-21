import React, { useCallback, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Keyboard } from 'lucide-react';
import EntropyFlow from '../components/entropy/EntropyFlow';
import { TARGETS, bitsFromRolls, digestFromRolls, entropyFromRolls, parseRolls } from '../lib/entropy';
import { bitsFromFlips, entropyFromFlips, hexFromFlips, parseFlips } from '../lib/coin';
import {
  DEFAULT_PRNG_STATE,
  PRNG_BYTES_PER_CALL,
  prngStream,
} from '../lib/prng';
import { trngDigest } from '../lib/trng';

export default function EntropyPage() {
  const [targetIdx, setTargetIdx] = useState(1);
  const [selectedSource, setSelectedSource] = useState(null);
  const [rolls, setRolls] = useState([]);
  const [flips, setFlips] = useState([]);
  const [manual, setManual] = useState('');
  // null, or the source the typed-input panel is collecting for.
  const [showManual, setShowManual] = useState(null);
  const [trngBits, setTrngBits] = useState([]);
  const [trngBroken, setTrngBroken] = useState(false);
  const [prngState, setPrngState] = useState(DEFAULT_PRNG_STATE);
  const [prngSeedBits, setPrngSeedBits] = useState(0);
  const [prngCalls, setPrngCalls] = useState(0);
  const [prngReference, setPrngReference] = useState(null);

  const target = TARGETS[targetIdx];
  const prngCallGoal = Math.ceil(target.bits / (PRNG_BYTES_PER_CALL * 8));
  const effectivePrngCalls = Math.min(prngCalls, prngCallGoal);
  // Counted against the chosen length, not the largest one: Auto should stop
  // where 12 words is satisfied, and only run on to 24 if that is what is
  // selected. Switching to the longer target simply reopens the difference.
  const remaining = Math.max(0, target.rolls - rolls.length);
  const coinRemaining = Math.max(0, target.flips - flips.length);
  const diceEntropyBits = bitsFromRolls(rolls.length);
  const coinEntropyBits = bitsFromFlips(flips.length);
  const trngEntropyBits = trngBits.length;
  // A PRNG with a known S0 is deterministic. It can expand bytes, but the
  // entropy belongs to whatever created S0, not to the PRNG itself.
  const prngEntropyBits = selectedSource === 'prng' ? prngSeedBits : 0;
  const diceHex = rolls.length ? entropyFromRolls(rolls, target.bits) : '';
  // Coins are direct: the entropy is the flips themselves, so it is complete
  // only once every one of the target bits has actually been flipped.
  const coinHex = entropyFromFlips(flips, target.bits);
  const trngHex = trngBits.length ? trngDigest(trngBits).slice(0, target.bits / 4) : '';
  const prngPreview = prngStream(prngState, effectivePrngCalls);
  const prngHex = effectivePrngCalls >= prngCallGoal ? prngPreview.slice(0, target.bits / 4) : '';
  // Hash-conditioned sources show the full 256-bit digest in the machine.
  // PRNG shows the stream directly, and coins show the flips packing into hex
  // nibble by nibble, because in both lanes those bits are the entropy.
  const diceFull = rolls.length ? digestFromRolls(rolls) : '';
  const coinFull = flips.length ? hexFromFlips(flips.slice(0, target.bits)) : '';
  const trngFull = trngBits.length ? trngDigest(trngBits) : '';
  const prngFull = prngPreview;

  // Four sources now, so a lookup rather than a ternary chain.
  const BITS_BY_SOURCE = {
    dice: diceEntropyBits,
    coin: coinEntropyBits,
    trng: trngEntropyBits,
    prng: prngEntropyBits,
  };
  const HEX_BY_SOURCE = {
    dice: diceHex,
    coin: coinHex,
    trng: trngHex,
    prng: prngHex,
  };
  const FULL_BY_SOURCE = {
    dice: diceFull,
    coin: coinFull,
    trng: trngFull,
    prng: prngFull,
  };
  const collected = BITS_BY_SOURCE[selectedSource] || 0;
  // Hashed sources show entropy from the first roll or clean bit, since the
  // digest exists immediately. Coins are direct, so their entropy (and the
  // mnemonic) appears only once every target bit has been flipped.
  const entropy = HEX_BY_SOURCE[selectedSource] || '';
  const fullDigest = FULL_BY_SOURCE[selectedSource] || '';
  const enough = Boolean(selectedSource && entropy && collected >= target.bits);

  const clearInputs = useCallback(() => {
    setRolls([]);
    setFlips([]);
    setManual('');
    setShowManual(null);
    setTrngBits([]);
    setTrngBroken(false);
    setPrngState(DEFAULT_PRNG_STATE);
    setPrngSeedBits(0);
    setPrngCalls(0);
    setPrngReference(null);
  }, []);

  const handleSourceChange = useCallback((source) => {
    if (selectedSource === source) return;
    clearInputs();
    setSelectedSource(source);
  }, [clearInputs, selectedSource]);

  const resetAll = useCallback(() => {
    clearInputs();
    setSelectedSource(null);
  }, [clearInputs]);

  const handleRolls = useCallback((values) => {
    setRolls((prev) => [...prev, ...values]);
  }, []);

  const handleFlips = useCallback((values) => {
    setFlips((prev) => [...prev, ...values]);
  }, []);

  const handleTrngBits = useCallback((bits) => {
    setTrngBits((prev) => [...prev, ...bits]);
  }, []);

  const handlePrngStateChange = useCallback((value) => {
    setPrngState(value);
    setPrngSeedBits(0);
  }, []);

  const handleRandomPrngSeed = useCallback(() => {
    const bytes = new Uint8Array(target.bits / 8);
    if (!window.crypto?.getRandomValues) return;
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    setPrngState(hex);
    setPrngSeedBits(target.bits);
    setPrngCalls(0);
    setPrngReference(null);
  }, [target.bits]);

  const handleTargetChange = useCallback((idx) => {
    const next = TARGETS[idx];
    const nextCallGoal = Math.ceil(next.bits / (PRNG_BYTES_PER_CALL * 8));
    setTargetIdx(idx);
    setPrngCalls((current) => Math.min(current, nextCallGoal));
  }, []);

  // Typing in what a real d6 or a real coin actually produced, which is the
  // point of both sources: the randomness should come from off the screen.
  const MANUAL = {
    dice: { label: 'Dice input', parse: parseRolls, unit: 'rolls', placeholder: '3 6 2 5 1 4 …', back: 'Back to dice' },
    coin: { label: 'Coin input', parse: parseFlips, unit: 'flips', placeholder: 'H T T H 1 0 1 …', back: 'Back to coins' },
  };
  const manualCfg = MANUAL[showManual] || MANUAL.dice;
  const manualParsed = showManual ? manualCfg.parse(manual) : [];

  const applyManual = () => {
    if (!manualParsed.length) return;
    if (showManual === 'coin') setFlips(manualParsed);
    else setRolls(manualParsed);
    setSelectedSource(showManual);
    setShowManual(null);
  };

  const hasInputState = Boolean(
    selectedSource || rolls.length || flips.length || trngBits.length || prngCalls || prngReference,
  );
  return (
    <div className="text-xs flex-1 flex flex-col lg:min-h-0 lg:overflow-hidden">
      <Helmet>
        <title>Entropy Visualizer - Random Sources to a BIP-39 Mnemonic | Hash Explained</title>
        <meta name="description" content="Choose dice, coin flips, TRNG, or PRNG input and watch entropy build up, then turn into a BIP-39 mnemonic. See why hashing never creates entropy it was not given." />
        <link rel="canonical" href="https://hashexplained.com/entropy" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hashexplained.com/entropy" />
        <meta property="og:title" content="Entropy Visualizer - Random Sources to a BIP-39 Mnemonic" />
        <meta property="og:description" content="Choose an entropy source, watch it build, and see it become a mnemonic." />
        <meta property="og:site_name" content="Hash Explained" />
        <meta property="og:image" content="https://hashexplained.com/thumbnail_entropy.png" />
        <meta property="og:image:alt" content="Entropy Visualizer: dice, coins, TRNG, and PRNG sources become BIP-39 seed words" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Entropy Visualizer - Random Sources to a BIP-39 Mnemonic" />
        <meta name="twitter:description" content="Choose an entropy source, watch it build, and see it become a mnemonic." />
        <meta name="twitter:image" content="https://hashexplained.com/thumbnail_entropy.png" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Entropy Visualizer',
          description: 'Interactive visualizer for entropy and key generation: dice rolls, coin flips, TRNG bits, PRNG seeds, SHA-256, and the BIP-39 mnemonic they produce.',
          url: 'https://hashexplained.com/entropy',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          isPartOf: { '@type': 'WebSite', name: 'Hash Explained', url: 'https://hashexplained.com' },
        })}</script>
      </Helmet>

      {/* Body */}
      <div className="entropy-workbench flex-1 min-h-0 overflow-auto flex flex-col px-3 py-3 lg:px-5 lg:py-4">
        {showManual ? (
          <div className="my-auto w-full">
            <div className="w-full max-w-2xl mx-auto rounded-lg border border-yellow-500/20 bg-gray-900/70 p-4 lg:p-5 shadow-xl shadow-black/30">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-yellow-400">
                  <Keyboard size={14} strokeWidth={2} />
                  {manualCfg.label}
                </span>
                <span className="font-mono text-[10px] text-gray-600">
                  {manualParsed.length} parsed
                </span>
              </div>
              <textarea
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                rows={5}
                placeholder={manualCfg.placeholder}
                className="w-full rounded border border-gray-800 bg-black/40 p-3 font-mono text-sm text-gray-200 focus:outline-none focus:border-yellow-500/40 placeholder:text-gray-700"
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={applyManual}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-yellow-500/40 bg-yellow-900/50 text-yellow-400 text-[11px]"
                >
                  <Keyboard size={13} strokeWidth={2} />
                  Use {manualParsed.length} {manualCfg.unit}
                </button>
                <button
                  type="button"
                  onClick={() => setShowManual(null)}
                  className="px-3 py-1.5 rounded border border-gray-800 text-gray-500 text-[11px] hover:text-gray-300"
                >
                  {manualCfg.back}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[1760px] mx-auto min-h-full flex">
            <EntropyFlow
              selectedSource={selectedSource}
              onSourceChange={handleSourceChange}
              rolls={rolls}
              target={target}
              remaining={remaining}
              onRolls={handleRolls}
              flips={flips}
              coinRemaining={coinRemaining}
              onFlips={handleFlips}
              entropy={entropy}
              fullDigest={fullDigest}
              enough={enough}
              trngBits={trngBits}
              onTrngBits={handleTrngBits}
              trngBroken={trngBroken}
              onTrngBrokenChange={setTrngBroken}
              prngState={prngState}
              onPrngStateChange={handlePrngStateChange}
              prngSeedBits={prngSeedBits}
              onRandomPrngSeed={handleRandomPrngSeed}
              prngCalls={effectivePrngCalls}
              onPrngCallsChange={setPrngCalls}
              prngCallGoal={prngCallGoal}
              prngStream={prngPreview}
              prngReference={prngReference}
              onPrngReferenceChange={setPrngReference}
              collected={collected}
              targets={TARGETS}
              targetIdx={targetIdx}
              onTargetChange={handleTargetChange}
              onReset={resetAll}
              showReset={hasInputState}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-800 shrink-0 flex items-center justify-between gap-3">
        <span className="text-[10px] text-gray-600">
          <span className="text-gray-500">Simulated input, educational only.</span> Not for a real wallet.
        </span>
        {!showManual && (selectedSource === 'dice' || selectedSource === 'coin') && (
          <button
            type="button"
            onClick={() => { setManual(''); setShowManual(selectedSource); }}
            className="inline-flex items-center gap-1.5 text-[10px] text-yellow-400 hover:underline shrink-0"
          >
            <Keyboard size={12} strokeWidth={2} />
            Type real {selectedSource === 'coin' ? 'flips' : 'dice'} →
          </button>
        )}
      </div>
    </div>
  );
}
