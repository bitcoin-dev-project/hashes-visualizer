import './App.css';
import React, { useState, useEffect } from 'react';
import {
  padding,
  chunkString,
  rotateRight,
  stringToBinary,
  binaryToString,
  binaryToHex,
  stringToHex,
  hexToString, hexToBinary, decimalToBinary, calculateK
} from './lib/encoding'

import { WCalculationAnimation, CompressionRoundExplainer } from './components/BitAnimations';

// Detailed Explanation Panel - Shows exact step-by-step operations with actual values
function DetailedExplainer({ phase, paddingStep, currentWIndex, currentRound, input, inputBinary, inputLength, kZeros, lengthBits, wView, letters, lettersBefore, k, toBin }) {

  if (phase === 'padding') {
    const titles = ["Message → Bits", "Add '1' marker", "Pad with zeros", "Add length", "Block ready"];
    return (
      <div className="space-y-5">
        <div className="text-green-400 font-bold text-base">{titles[paddingStep]}</div>
        
        {paddingStep === 0 && (
          <div className="space-y-4">
            <div className="text-gray-400 text-sm leading-relaxed">Each character → 8 bits (ASCII/UTF-8)</div>
            <div className="bg-gray-800/50 rounded p-4 space-y-2">
              {input.split('').map((char, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <span className="text-yellow-400 font-bold">'{char}'</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-400">{char.charCodeAt(0)}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-white font-mono">{inputBinary.slice(i*8, (i+1)*8)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {paddingStep === 1 && (
          <div className="space-y-4">
            <div className="text-gray-400 text-sm leading-relaxed">Append "1" bit to mark end of message</div>
            <div className="bg-gray-800/50 rounded p-4 text-sm">
              <span className="text-gray-500">message bits + </span>
              <span className="text-green-400 font-bold text-lg">1</span>
            </div>
          </div>
        )}
        
        {paddingStep === 2 && (
          <div className="space-y-4">
            <div className="text-gray-400 text-sm leading-relaxed">Pad with zeros until length ≡ 448 (mod 512)</div>
            <div className="bg-gray-800/50 rounded p-4 text-sm space-y-2">
              <div><span className="text-gray-500">Current: </span><span className="text-white">{inputLength + 1} bits</span></div>
              <div><span className="text-gray-500">Need: </span><span className="text-white">448 bits</span></div>
              <div><span className="text-gray-500">Add: </span><span className="text-blue-400 font-bold">{kZeros} zeros</span></div>
            </div>
          </div>
        )}
        
        {paddingStep === 3 && (
          <div className="space-y-4">
            <div className="text-gray-400 text-sm leading-relaxed">Append original message length as 64-bit big-endian</div>
            <div className="bg-gray-800/50 rounded p-4 text-sm space-y-3">
              <div className="text-gray-500 font-medium">How we calculate length:</div>
              <div className="pl-3 space-y-1">
                <div><span className="text-gray-500">Message: </span><span className="text-yellow-400">"{input}"</span></div>
                <div><span className="text-gray-500">Characters: </span><span className="text-white">{input.length}</span></div>
                <div><span className="text-gray-500">Bits per char: </span><span className="text-white">8</span></div>
                <div><span className="text-gray-500">Total bits: </span><span className="text-white">{input.length} × 8 = <span className="text-green-400 font-bold">{inputLength}</span></span></div>
              </div>
              <div className="border-t border-gray-700 pt-3 mt-3">
                <div className="mb-2"><span className="text-gray-500">Convert {inputLength} to 64-bit binary:</span></div>
                <div className="text-purple-400 font-mono break-all text-xs">{lengthBits}</div>
              </div>
            </div>
          </div>
        )}
        
        {paddingStep === 4 && (
          <div className="space-y-4">
            <div className="text-gray-400 text-sm leading-relaxed">512-bit block ready</div>
            <div className="bg-gray-800/50 rounded p-4 text-sm space-y-2">
              <div><span className="text-white">{inputLength}</span><span className="text-gray-500"> (message) + </span></div>
              <div><span className="text-green-400">1</span><span className="text-gray-500"> (marker) + </span></div>
              <div><span className="text-blue-400">{kZeros}</span><span className="text-gray-500"> (zeros) + </span></div>
              <div><span className="text-purple-400">64</span><span className="text-gray-500"> (length) = </span><span className="text-white font-bold">512 bits</span></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'chunk') {
    return (
      <div className="space-y-5">
        <div className="text-yellow-400 font-bold text-base">Parse Block → Message Schedule</div>
        
        <div className="bg-gray-800/50 rounded p-4 text-sm space-y-4">
          <div className="text-gray-400 font-bold">512-bit block → 64 words (32 bits each)</div>
          <div className="border-t border-gray-700 pt-4 mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400 font-semibold">w[0..15]</span>
              <span className="text-gray-500">←</span>
              <span className="text-gray-400">Direct copy from padded block</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-300">w[16..63]</span>
              <span className="text-gray-500">←</span>
              <span className="text-gray-400">Computed using σ₀ and σ₁</span>
            </div>
          </div>
        </div>
        
        <div className="bg-green-900/20 border border-green-800/30 rounded p-4 text-sm">
          <div className="text-gray-400 mb-2">Next: Computing w[16..63]</div>
          <div className="text-gray-500 leading-relaxed">Each new word mixes 4 previous words to spread message bits throughout the schedule.</div>
        </div>
      </div>
    );
  }

  if (phase === 'schedule' && currentWIndex !== null) {
    return (
      <WCalculationAnimation 
        t={currentWIndex} 
        wView={wView} 
        toBin={toBin} 
      />
    );
  }

  if (phase === 'init') {
    // Initial hash values h0..h7 from square roots of first 8 primes
    const hPrimes = [2, 3, 5, 7, 11, 13, 17, 19];
    const hValues = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const varNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    
    const formatBinCompact = (n) => {
      return (n >>> 0).toString(2).padStart(32, '0');
    };
    
    return (
      <div className="space-y-6">
        <div className="text-purple-400 font-bold text-base">Initialize Working Variables</div>
        
        <div className="text-gray-400 text-sm space-y-3 leading-relaxed">
          <p>Before compression begins, we need 8 working variables (<span className="text-purple-400">a..h</span>) that will be modified in each round.</p>
          <p>These start with special initial values defined by SHA-256:</p>
        </div>
        
        {/* Formula explanation */}
        <div className="bg-gray-900/50 rounded p-4 border border-gray-800">
          <div className="text-gray-500 text-sm leading-relaxed">
            <span className="text-gray-400">Formula:</span> Take the <span className="text-purple-300">square root</span> of the first 8 prime numbers, extract the fractional part, and multiply by 2³² to get 32-bit integers.
          </div>
          <div className="text-gray-600 text-xs font-mono mt-3">
            h = frac(√prime) × 2³²
          </div>
        </div>
        
        {/* Mapping with primes - all inline */}
        <div className="space-y-1.5 text-xs font-mono">
          {hValues.map((h, i) => (
            <div key={i} className="flex items-center whitespace-nowrap">
              <span className="text-gray-600 w-10">√{String(hPrimes[i]).padEnd(2)}</span>
              <span className="text-gray-600">→</span>
              <span className="text-gray-500 w-6 text-right">h{i}</span>
              <span className="text-gray-600 mx-1">→</span>
              <span className="text-purple-400 font-bold w-4">{varNames[i]}</span>
              <span className="text-gray-600 mx-1">=</span>
              <span className="text-gray-400">{formatBinCompact(h)}</span>
            </div>
          ))}
        </div>
        
        <div className="text-gray-600 text-sm pt-4 border-t border-gray-800 leading-relaxed">
          These "nothing up my sleeve" numbers are derived from math constants, ensuring no hidden backdoors in the algorithm.
        </div>
      </div>
    );
  }

  if (phase === 'kconst') {
    // K constants explanation step
    const kPrimes = [2, 3, 5, 7, 11, 13, 17, 19];
    const formatBinCompact = (n) => (n >>> 0).toString(2).padStart(32, '0');
    
    return (
      <div className="space-y-6">
        <div className="text-cyan-400 font-bold text-base">Round Constants k₀..k₆₃</div>
        
        <div className="text-gray-400 text-sm space-y-3 leading-relaxed">
          <p>In addition to working variables, SHA-256 uses <span className="text-cyan-400">64 constant values</span> - one for each compression round.</p>
          <p>These add extra "randomness" to the mixing process.</p>
        </div>
        
        {/* Formula explanation */}
        <div className="bg-gray-900/50 rounded p-4 border border-gray-800">
          <div className="text-gray-500 text-sm leading-relaxed">
            <span className="text-gray-400">Formula:</span> Take the <span className="text-cyan-300">cube root</span> of the first 64 prime numbers, extract the fractional part, and multiply by 2³².
          </div>
          <div className="text-gray-600 text-xs font-mono mt-3">
            k = frac(∛prime) × 2³²
          </div>
        </div>
        
        {/* Show first 8 k values */}
        <div className="space-y-1.5 text-xs font-mono">
          {kPrimes.map((prime, i) => (
            <div key={i} className="flex items-center whitespace-nowrap">
              <span className="text-gray-600 w-8">∛{String(prime).padEnd(2)}</span>
              <span className="text-gray-600">→</span>
              <span className="text-cyan-400 w-6 text-right ml-1">k{i}</span>
              <span className="text-gray-600 mx-1">=</span>
              <span className="text-gray-400">{formatBinCompact(k[i])}</span>
            </div>
          ))}
          <div className="text-gray-600 py-2">⋮ k₈..k₆₂ (from ∛23 to ∛307) ⋮</div>
          <div className="flex items-center whitespace-nowrap">
            <span className="text-gray-600 w-8">∛311</span>
            <span className="text-gray-600">→</span>
            <span className="text-cyan-400 w-6 text-right ml-1">k63</span>
            <span className="text-gray-600 mx-1">=</span>
            <span className="text-gray-400">{formatBinCompact(k[63])}</span>
          </div>
        </div>
        
        <div className="text-gray-600 text-sm pt-4 border-t border-gray-800 leading-relaxed">
          Like h₀..h₇, these are "nothing up my sleeve" numbers from mathematical constants.
        </div>
      </div>
    );
  }

  if (phase === 'compressintro') {
    return (
      <div className="space-y-6">
        <div className="text-orange-400 font-bold text-base">Compression Overview</div>
        
        <div className="text-gray-400 text-sm space-y-3 leading-relaxed">
          <p>Now we run <span className="text-orange-400 font-bold">64 rounds</span> of compression. Each round:</p>
        </div>
        
        {/* Steps overview */}
        <div className="space-y-4 text-sm">
          <div className="flex gap-3 items-start">
            <span className="text-orange-400 font-bold">1.</span>
            <div>
              <span className="text-gray-400">Compute </span>
              <span className="text-yellow-400">T₁</span>
              <span className="text-gray-400"> using: </span>
              <span className="text-purple-400">e, f, g, h</span>
              <span className="text-gray-400">, </span>
              <span className="text-green-400">w[i]</span>
              <span className="text-gray-400">, </span>
              <span className="text-cyan-400">k[i]</span>
            </div>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="text-orange-400 font-bold">2.</span>
            <div>
              <span className="text-gray-400">Compute </span>
              <span className="text-yellow-400">T₂</span>
              <span className="text-gray-400"> using: </span>
              <span className="text-purple-400">a, b, c</span>
            </div>
          </div>
          
          <div className="flex gap-3 items-start">
            <span className="text-orange-400 font-bold">3.</span>
            <div>
              <span className="text-gray-400">Update all 8 variables:</span>
              <div className="text-gray-500 text-xs font-mono mt-3 ml-3 space-y-1">
                <div><span className="text-purple-400">a</span> = T₁ + T₂</div>
                <div><span className="text-purple-400">e</span> = d + T₁</div>
                <div className="text-gray-600">b,c,d ← shift from a,b,c</div>
                <div className="text-gray-600">f,g,h ← shift from e,f,g</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Visual representation */}
        <div className="bg-gray-900/50 rounded p-4 border border-gray-800">
          <div className="text-gray-500 text-sm leading-relaxed">
            Each round thoroughly mixes the message (<span className="text-green-400">w</span>) with the state (<span className="text-purple-400">a..h</span>) using bitwise operations like rotations, XOR, AND.
          </div>
        </div>
        
        <div className="text-gray-600 text-sm pt-4 border-t border-gray-800 leading-relaxed">
          After 64 rounds, the final a..h values are added back to h₀..h₇ to produce the hash.
        </div>
      </div>
    );
  }

  if (phase === 'compress' && currentRound !== null) {
    return (
      <CompressionRoundExplainer 
        round={currentRound}
        letters={letters}
        lettersBefore={lettersBefore}
        wView={wView}
        k={k}
        toBin={toBin}
      />
    );
  }

  if (phase === 'digest') {
    return (
      <div className="space-y-5">
        <div className="text-emerald-400 font-bold text-base">Final Hash</div>
        <div className="text-gray-400 text-sm leading-relaxed">Add a..h back to h0..h7</div>
        <div className="text-gray-500 text-sm leading-relaxed">Concatenate all 8 words → 256 bits</div>
      </div>
    );
  }

  return null;
}

function App() {
  const [result, setResult] = useState('');
  const [inputBase, setInputBase] = useState('text');
  const [paddedInput, setPaddedInput] = useState('0');
  const [wView, setWView] = useState(new Array(64).fill(0));
  const [letters, setLetters] = useState([]);
  const [lettersBefore, setLettersBefore] = useState([]);
  const [hs, setHs] = useState([]);
  const [hsBefore, setHsBefore] = useState([]);
  const [clock, setClock] = useState(0);
  const [input, setInput] = useState('');
  const [inputPlaceholder, setInputPlaceholderInput] = useState('Enter message to hash...');
  const [chunksCount, setChunksCount] = useState(1);
  const [autoplay, setAutoplay] = useState(false);

  const k = [
    1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
    -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
    1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
    264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
    -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
    113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
    1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
    -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
    430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
    1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
    -1866530822, -1538233109, -1090935817, -965641998];

  useEffect(() => {
    if(clock !== lastClock() && autoplay) {
      const interval = setInterval(() => {
        onClock()
      }, 60);
      return () => clearInterval(interval);
    }
    setAutoplay(false)
  }, [clock, autoplay]);

  useEffect(() => {
    setPaddedInput(padding('', inputBase));
  }, []);

  function onAutoClock() {
    setAutoplay(!autoplay);
    if(!autoplay) onClock();
  }

  function onClock() {
      if (clock < lastClock()) setClock(clock + 1);
    let res = shaStepped(input, firstLoop(clock), secondLoop(clock), chunksLoop(clock));
    setWView(res.w);
    setResult(res.hash);
    setHs(res.hs);
    setHsBefore(res.hsBefore);
    setLetters(res.letters);
    setLettersBefore(res.lettersBefore);
  }

  function onInputChange(value) {
    if(inputBase === 'bin' && !['0', '1', ''].includes(value.substr(-1))) return;
    if(inputBase === 'hex' && !['a', 'b', 'c', 'd', 'e', 'f', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ''].includes(value.substr(-1))) return;
    setInput(value);
    setPaddedInput(padding(value, inputBase));
    if(clock === 0) value = '';
    let res = shaStepped(value, firstLoop(clock), secondLoop(clock), chunksLoop(clock));
    setWView(res.w);
    setResult(res.hash);
    setHs(res.hs);
    setHsBefore(res.hsBefore);
    setLetters(res.letters);
    setLettersBefore(res.lettersBefore);
  }

  function onClockBack() {
    if(clock === 0) return;
    setClock(clock - 1);
    let value = input;
    if(clock === 1) value = '';
    let res = shaStepped(value, firstLoop(clock - 2), secondLoop(clock - 2), chunksLoop(clock));
    setWView(res.w);
    setResult(res.hash);
    setLetters(res.letters);
    setLettersBefore(res.lettersBefore);
    setHs(res.hs);
    setHsBefore(res.hsBefore);
  }

  function firstLoop(clock) {
    let step = clock % 118;
    if(step < 5) return 15;
    if(step + 11 < 64) return 10 + step;
    return 63;
  }

  function secondLoop(clock) {
    let step = clock % 118;
    if(step >= 53 && step < 117) return step - 53;
    if(step >= 117) return 63;
    return 0;
  }

  function chunksLoop(clock) {
    if(clock < 118) return 1;
    return Math.floor(clock / 118) + 1;
  }

  function onInputBaseChange(value) {
    setInputBase(value);
    if(value === 'bin') {
      if(inputBase === 'text') setInput(stringToBinary(input));
      if(inputBase === 'hex') setInput(hexToBinary(input));
      setInputPlaceholderInput('10101...');
    }
    if(value === 'text') {
      if(inputBase === 'bin') {
        setInput(binaryToString(input));
        if(binaryToString(input) === '\x00') setInput('');
      }
      if(inputBase === 'hex') setInput(hexToString(input));
      setInputPlaceholderInput('Type message...');
    }
    if(value === 'hex') {
      if(inputBase === 'bin') setInput(binaryToHex(input));
      if(inputBase === 'text') setInput(stringToHex(input));
      setInputPlaceholderInput('a1b5c8');
    }
  }

  function onClockFinish() {
    let cyclesCount = paddedInput.length / 512;
    setClock(lastClockStateless(cyclesCount));
    let res = shaStepped(input, 63, 63, cyclesCount);
    setWView(res.w);
    setResult(res.hash);
    setLetters(res.letters);
    setLettersBefore(res.lettersBefore);
    setHs(res.hs);
    setHsBefore(res.hsBefore);
  }

  function onClockInit() {
    setClock(0);
    setAutoplay(false);
    let res = shaStepped('', firstLoop(0), secondLoop(0), 1);
    setWView(res.w);
    setResult(res.hash);
    setLetters(res.letters);
    setLettersBefore(res.lettersBefore);
    setHs(res.hs);
    setHsBefore(res.hsBefore);
  }

  // Jump to a specific clock value
  function jumpToPhase(targetClock) {
    setClock(targetClock);
    setAutoplay(false);
    let res = shaStepped(input, firstLoop(targetClock), secondLoop(targetClock), chunksLoop(targetClock));
    setWView(res.w);
    setResult(res.hash);
    setLetters(res.letters);
    setLettersBefore(res.lettersBefore);
    setHs(res.hs);
    setHsBefore(res.hsBefore);
  }

  function lastClock() {
    if(chunksCount === 1) return 117;
    return 117 + 118 * (chunksCount - 1);
  }

  function lastClockStateless(chunks) {
    if(chunks === 1) return 117;
    return 117 + 118 * (chunks - 1);
  }

  function cycleClock() {
    return clock % 118;
  }

  function shaStepped(message, firstLoop, secondLoop, chunksLoop) {
    let h0 = 0x6a09e667; let h1 = 0xbb67ae85; let h2 = 0x3c6ef372; let h3 = 0xa54ff53a;
    let h4 = 0x510e527f; let h5 = 0x9b05688c; let h6 = 0x1f83d9ab; let h7 = 0x5be0cd19;
    let s0, s1, S1, S0, a, b, c, d, e, f, g, h, ch, temp1, temp2, maj = 0;
    let w = [];
    let hsBefore = [];
    let lettersBefore = [];
    let inputPadded = padding(message, inputBase);
    let chunks = chunkString(inputPadded);
    setChunksCount(chunks.length);

    for(let n = 0; n < chunksLoop; n++) {
      let chunk = chunks[n];
      w = new Array(64).fill(0);
      chunkString(chunk, 32).forEach((messageWord, i) => {
        w[i] = parseInt(messageWord, 2);
      });

      let firstLoopForCurrentChunk = n < chunksLoop - 1 ? 63 : firstLoop;
      for(let i = 16; i <= firstLoopForCurrentChunk; i++) {
        s0 = (rotateRight(w[i-15], 7) ^ rotateRight(w[i-15], 18) ^ (w[i-15] >>> 3)) >>> 0;
        s1 = (rotateRight(w[i-2], 17) ^ rotateRight(w[i-2], 19) ^ (w[i-2] >>> 10)) >>> 0;
        w[i] = (w[i-16] + s0 + w[i-7] + s1) % (2**32);
      }

      a = h0; b = h1; c = h2; d = h3; e = h4; f = h5; g = h6; h = h7;
      let secondLoopForCurrentChunk = n < chunksLoop - 1 ? 63 : secondLoop;
      for(let i = 0; i <= secondLoopForCurrentChunk; i++) {
        S1 = (rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25)) >>> 0;
        ch = (e & f) ^ ((~e) & g) >>> 0;
        temp1 = (h + S1 + ch + k[i] + w[i]) % (2**32) >>> 0;
        S0 = (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) >>> 0;
        maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        temp2 = (S0 + maj) % (2**32) >>> 0;
        lettersBefore = [a, b, c, d, e, f, g, h];
        h = g >>> 0; g = f >>> 0; f = e >>> 0; e = (d + temp1) % (2**32);
        d = c >>> 0; c = b >>> 0; b = a >>> 0; a = (temp1 + temp2) % (2**32);
      }

      hsBefore = [h0, h1, h2, h3, h4, h5, h6, h7];
      h0 = (h0 + a) % (2**32); h1 = (h1 + b) % (2**32); h2 = (h2 + c) % (2**32); h3 = (h3 + d) % (2**32);
      h4 = (h4 + e) % (2**32); h5 = (h5 + f) % (2**32); h6 = (h6 + g) % (2**32); h7 = (h7 + h) % (2**32);
    }

    let hash = h0.toString(16).padStart(8, '0') + h1.toString(16).padStart(8, '0') +
               h2.toString(16).padStart(8, '0') + h3.toString(16).padStart(8, '0') +
               h4.toString(16).padStart(8, '0') + h5.toString(16).padStart(8, '0') +
               h6.toString(16).padStart(8, '0') + h7.toString(16).padStart(8, '0');
    return { w, s0, s1, S1, ch, temp1, S0, maj, temp2, letters: [a, b, c, d, e, f, g, h], hash, chunks, hs: [h0, h1, h2, h3, h4, h5, h6, h7], hsBefore, lettersBefore };
  }

  // Helpers
  const toBin = (n) => decimalToBinary(n >>> 0).padStart(32, '0');
  const localClock = cycleClock();
  const lastClockValue = lastClock();
  const finished = clock >= lastClockValue;

  // Get raw binary from input
  const getInputBinary = () => {
    if(inputBase === 'text') return stringToBinary(input);
    if(inputBase === 'hex') return hexToBinary(input);
    return input;
  };
  const inputBinary = getInputBinary();
  const inputLength = inputBinary.length;
  const kZeros = calculateK(inputLength);
  const lengthBits = decimalToBinary(inputLength).padStart(64, '0');

  // Phase tracking
  const paddingDone = localClock >= 5;
  const chunkDone = localClock >= 6;
  const scheduleDone = localClock >= 54;
  const initDone = localClock >= 55;
  const compressDone = finished;

  // Current phase
  let phase = 'padding';
  if(localClock >= 0 && localClock <= 4) phase = 'padding';
  else if(localClock === 5) phase = 'chunk';
  else if(localClock >= 6 && localClock <= 53) phase = 'schedule';
  else if(localClock === 54) phase = 'init';
  else if(localClock === 55) phase = 'kconst';
  else if(localClock === 56) phase = 'compressintro';  // NEW: explain what compression does
  else if(!finished) phase = 'compress';
  else phase = 'digest';

  // Padding sub-step
  const paddingStep = Math.min(localClock, 4);

  // Current w index
  const currentWIndex = localClock >= 6 && localClock <= 53 ? localClock + 10 : null;
  const wComputedUpTo = localClock >= 6 ? Math.min(localClock + 10, 63) : (localClock >= 5 ? 15 : -1);

  // Current compression round (starts at clock 57, so round 0 = clock 57)
  const currentRound = localClock >= 57 ? localClock - 57 : null;

  const btnClass = 'px-3 py-1 rounded bg-gray-800 text-white border border-gray-700 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs';

  return (
    <div className="App font-mono text-xs bg-black text-gray-300 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo and algorithm */}
          <div className="flex items-center gap-2">
            <span className="text-gray-300 text-sm tracking-wide">Hashes Visualizer</span>
            <span className="text-gray-500 text-xs px-2 py-0.5 bg-gray-800/80 rounded">SHA-256</span>
          </div>
          
          {/* Center: Input, controls, step counter */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            {/* Input section */}
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 min-w-[250px] max-w-[400px] flex-1 focus-within:border-green-600 transition-colors">
              <select value={inputBase} onChange={e => onInputBaseChange(e.target.value)} className="bg-transparent text-gray-400 py-0.5 px-1 rounded text-xs cursor-pointer hover:text-gray-300">
                <option value="text">Text</option>
                <option value="bin">Binary</option>
                <option value="hex">Hex</option>
              </select>
              <input
                type="text"
                value={input}
                onChange={e => onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                className="flex-1 bg-transparent text-green-400 text-sm focus:outline-none placeholder:text-gray-600"
              />
            </div>
            
            {/* Playback controls */}
            <div className="flex items-center gap-1">
              <button className={btnClass} onClick={onClockInit} disabled={clock === 0} title="Reset">Reset</button>
              <button className={btnClass} onClick={onClockBack} disabled={clock === 0} title="Step back">←</button>
              <button className={`${btnClass} ${!finished ? 'bg-green-900/50 border-green-700/50 text-green-400' : ''}`} onClick={onAutoClock} disabled={finished} title={autoplay ? 'Pause' : 'Play'}>{autoplay ? '⏸' : '▶'}</button>
              <button className={btnClass} onClick={onClock} disabled={finished} title="Step forward">→</button>
              <button className={btnClass} onClick={onClockFinish} title="Skip to end">⏭</button>
            </div>
            
            {/* Step counter */}
            <span className="text-gray-500 text-xs whitespace-nowrap">{clock}/{lastClockValue}</span>
          </div>
          
          {/* Right: Links */}
          <div className="flex items-center gap-4 text-xs">
            <a 
              href="https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              title="NIST FIPS 180-4 - Secure Hash Standard"
            >
              <span>📄</span>
              <span className="underline">NIST Spec</span>
            </a>
            <a 
              href="https://github.com/bitcoin-dev-project/hashes-visualizer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
              title="View source on GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main: Data columns on left, Detailed explanation on right */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT SIDE: Data columns */}
        <div className="flex-1 flex items-stretch overflow-x-auto overflow-y-hidden">
          
          {/* Column 1: Message → Padded block */}
          <div className={`w-[290px] shrink-0 border-r border-gray-800 p-2 overflow-hidden transition-opacity ${paddingDone && phase !== 'padding' ? 'opacity-20' : ''}`}>
            <div 
              onClick={() => jumpToPhase(0)}
              className="text-[10px] uppercase tracking-wider text-green-600 mb-1 cursor-pointer hover:text-green-400 hover:underline underline-offset-2 transition-all inline-block"
              title="Click to jump to Padding"
            >
              {phase === 'padding' ? '● Padding' : '✓ Padded block'} <span className="text-[9px] opacity-50">↗</span>
            </div>
            
            <div className="space-y-0 font-mono text-[11px] leading-tight">
              {/* Show block building up - color each bit, show word indices */}
              {(() => {
                let blockBits = '';
                if (paddingStep >= 0 && inputBinary) blockBits += inputBinary;
                if (paddingStep >= 1) blockBits += '1';
                if (paddingStep >= 2) blockBits += '0'.repeat(kZeros);
                if (paddingStep >= 3) blockBits += lengthBits;
                
                // Show as 32-bit rows, color each bit individually
                const rows = chunkString(blockBits.padEnd(512, ' '), 32);
                const showWordLabels = paddingStep >= 4; // Show w0-w15 labels when block is complete
                
                return rows.map((row, rowIdx) => {
                  if (row.trim() === '') return null;
                  
                  return (
                    <div key={rowIdx} className="flex gap-1">
                      {/* Word label with arrow when block is complete */}
                      {showWordLabels && (
                        <span className="text-yellow-500 w-7 shrink-0">
                          w{rowIdx}→
                        </span>
                      )}
                      <span>
                        {row.split('').map((bit, bitIdx) => {
                          const globalBit = rowIdx * 32 + bitIdx;
                          let color = 'text-gray-700';
                          
                          if (globalBit < inputLength) {
                            color = 'text-white';
                          } else if (globalBit === inputLength) {
                            // The "1" marker bit
                            color = 'text-green-400 font-bold';
                          } else if (globalBit < inputLength + 1 + kZeros) {
                            color = 'text-blue-400/70';
                          } else if (globalBit >= 448) {
                            color = 'text-purple-400';
                          }
                          
                          return <span key={bitIdx} className={color}>{bit}</span>;
                        })}
                      </span>
                      </div>
                    );
                });
              })()}
            </div>
          </div>

          {/* Column 2: Message schedule w[0..63] */}
          <div className={`w-[400px] shrink-0 border-r border-gray-800 p-2 flex flex-col transition-opacity ${scheduleDone && phase !== 'schedule' && phase !== 'chunk' && phase !== 'compress' ? 'opacity-20' : ''}`}>
            <div 
              onClick={() => jumpToPhase(6)}
              className="text-[10px] uppercase tracking-wider text-green-600 mb-1 cursor-pointer hover:text-green-400 hover:underline underline-offset-2 transition-all inline-block shrink-0"
              title="Click to jump to Message Schedule"
            >
              {phase === 'chunk' || phase === 'schedule' ? '● Message schedule' : scheduleDone ? '✓ w[0..63]' : '○ Message schedule'} <span className="text-[9px] opacity-50">↗</span>
            </div>
            
            <div className="space-y-0 flex-1 overflow-y-auto leading-tight">
              {Array.from({length: 64}).map((_, i) => {
                const computed = i <= wComputedUpTo;
                const current = i === currentWIndex;
                const fromChunk = i < 16;
                // Highlight w[t] being used in current compression round (not during round 0 k intro)
                const usedInCompression = phase === 'compress' && currentRound > 0 && currentRound === i;
                // During compression, reduce opacity on non-active words
                const dimmedDuringCompression = phase === 'compress' && currentRound !== i;
                
                // During schedule phase, highlight dependencies of current w[t]
                const isW16 = phase === 'schedule' && currentWIndex !== null && currentWIndex >= 16 && i === currentWIndex - 16;
                const isW15 = phase === 'schedule' && currentWIndex !== null && currentWIndex >= 16 && i === currentWIndex - 15;
                const isW7 = phase === 'schedule' && currentWIndex !== null && currentWIndex >= 16 && i === currentWIndex - 7;
                const isW2 = phase === 'schedule' && currentWIndex !== null && currentWIndex >= 16 && i === currentWIndex - 2;
                const isDependency = isW16 || isW15 || isW7 || isW2;
                
                // Dim non-relevant w's during schedule phase (including inputs, but less)
                const dimmedDuringSchedule = phase === 'schedule' && currentWIndex !== null && !current && !isDependency;
                
                return (
                  <div key={i} className={`flex gap-1.5 text-[11px] transition-opacity ${current ? 'bg-gray-800 -mx-1 px-1 rounded' : usedInCompression ? 'bg-purple-900/50 -mx-1 px-1 rounded' : ''} ${dimmedDuringCompression || dimmedDuringSchedule ? 'opacity-30' : ''}`}>
                    <span className={`w-8 shrink-0 ${current ? 'text-green-400 font-bold' : usedInCompression ? 'text-purple-400 font-bold' : isDependency ? 'text-gray-500' : computed ? (fromChunk ? 'text-yellow-600' : 'text-green-600') : 'text-gray-800'}`}>w{i}</span>
                    <span className={`${current ? 'text-white' : usedInCompression ? 'text-purple-300' : isDependency ? 'text-gray-600 opacity-60' : computed ? 'text-gray-500' : 'text-gray-900'}`}>{toBin(wView[i])}</span>
                    {current && <span className="ml-1 text-[10px] text-green-400 font-bold">◄ COMPUTING</span>}
                    {usedInCompression && <span className="ml-1 text-[10px] text-purple-400 font-bold">◄ USING</span>}
                    {isW16 && <span className="text-gray-500 ml-1 text-[10px]">+w[{i}]</span>}
                    {isW15 && <span className="text-orange-400/60 ml-1 text-[10px]">+σ₀</span>}
                    {isW7 && <span className="text-gray-500 ml-1 text-[10px]">+w[{i}]</span>}
                    {isW2 && <span className="text-yellow-400/60 ml-1 text-[10px]">+σ₁</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 3: Working variables a..h */}
          <div className={`w-[580px] shrink-0 border-r border-gray-800 p-2 flex flex-col self-stretch transition-opacity ${compressDone && phase !== 'compress' && phase !== 'init' ? 'opacity-20' : ''}`}>
            <div 
              onClick={() => jumpToPhase(55)}
              className="text-xs uppercase tracking-wider text-green-600 mb-2 cursor-pointer hover:text-green-400 hover:underline underline-offset-2 transition-all inline-block shrink-0"
              title="Click to jump to Compression"
            >
              {phase === 'init' || phase === 'compress' ? '● Compression' : compressDone ? '✓ Compressed' : '○ Compression'} <span className="text-[10px] opacity-50">↗</span>
            </div>
            
            {(phase === 'init' || phase === 'kconst' || phase === 'compressintro' || phase === 'compress' || compressDone) && (
              <div className="flex-1 space-y-1 overflow-hidden">
                {/* Show current round during compression */}
                {phase === 'compress' && currentRound !== null && (
                  <div className="bg-cyan-900/30 border border-cyan-800/30 rounded px-2 py-1 mb-1">
                    <span className="text-cyan-400 font-bold text-xs">Round {currentRound}/63</span>
                  </div>
                )}
                
                {/* During compression: show OLD → NEW transition */}
                {phase === 'compress' && lettersBefore.length > 0 ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center text-[10px] text-gray-500 mb-1">
                      <span className="w-5 shrink-0"></span>
                      <span className="w-[220px] shrink-0 text-center opacity-50">Before</span>
                      <span className="w-5 shrink-0"></span>
                      <span className="flex-1 text-center">After</span>
                    </div>
                    {['a','b','c','d','e','f','g','h'].map((l, i) => {
                      const isNew = i === 0 || i === 4; // a or e get new values
                      const isShift = i === 1 || i === 2 || i === 3 || i === 5 || i === 6 || i === 7;
                      const shiftFrom = ['', 'a', 'b', 'c', '', 'e', 'f', 'g'][i];
                      const oldVal = lettersBefore[i] || 0;
                      const newVal = letters[i] || 0;
                      
                      return (
                        <div key={i} className={`flex items-center ${isNew ? 'bg-purple-900/30 -mx-1 px-1 py-0.5 rounded' : ''}`}>
                          {/* Variable name */}
                          <span className={`w-5 shrink-0 text-xs ${isNew ? 'text-purple-300' : 'text-gray-500'}`}>{l}</span>
                          
                          {/* Old value - dimmed */}
                          <span className="w-[220px] shrink-0 text-gray-600 opacity-50 text-[10px] font-mono">{toBin(oldVal)}</span>
                          
                          {/* Arrow showing transformation */}
                          <span className={`w-5 shrink-0 text-center text-xs ${isNew ? 'text-purple-400' : 'text-gray-600'}`}>→</span>
                          
                          {/* New value - highlighted */}
                          <span className={`font-mono text-[10px] ${isNew ? 'text-white' : isShift ? 'text-gray-400' : 'text-gray-500'}`}>
                            {toBin(newVal)}
                          </span>
                          
                          {/* Source indicator */}
                          <span className="shrink-0 text-[10px] ml-2">
                            {isNew && i === 0 && <span className="text-purple-400">T₁+T₂</span>}
                            {isNew && i === 4 && <span className="text-purple-400">d+T₁</span>}
                            {isShift && <span className="text-gray-600">←{shiftFrom}</span>}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Visual shift diagram */}
                    <div className="mt-2 pt-2 border-t border-gray-800 text-xs">
                      <div className="text-gray-400 mb-1 font-bold">Update pattern:</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                        <div><span className="text-purple-400 font-bold">a</span> = T₁ + T₂ <span className="text-purple-300">(computed)</span></div>
                        <div><span className="text-purple-400 font-bold">e</span> = d + T₁ <span className="text-purple-300">(computed)</span></div>
                        <div><span className="text-gray-400">b,c,d</span> ← a,b,c <span className="text-gray-500">(shift)</span></div>
                        <div><span className="text-gray-400">f,g,h</span> ← e,f,g <span className="text-gray-500">(shift)</span></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Init or kconst phase: just show initial hash values */
                  (() => {
                    // Initial hash values h0..h7 (same as in sha256step)
                    const initialH = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
                    return (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 mb-2">Working variables a..h</div>
                        {['a','b','c','d','e','f','g','h'].map((l, i) => (
                          <div key={i} className="flex gap-2 text-xs">
                            <span className="w-5 text-purple-400 font-bold">{l}</span>
                            <span className="text-gray-500 font-mono">{toBin(initialH[i])}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            )}
            
            {/* Round Constants k[0..63] - OUTSIDE flex-1, at bottom of compression panel */}
            {/* Show k constants grid during kconst phase, compressintro, and compression */}
            {(phase === 'kconst' || phase === 'compressintro' || phase === 'compress') && (
              <div className="pt-3 border-t border-gray-800">
                <div className="text-[10px] text-gray-500 mb-1.5">
                  <span className="text-cyan-600">Round Constants</span> k₀..k₆₃
                  {phase === 'compress' && currentRound !== null && <span className="text-cyan-400 ml-2">← using k{currentRound}</span>}
                </div>
                <div className="grid grid-cols-4 gap-x-1 gap-y-0.5 text-[7px] font-mono">
                  {k.slice(0, 64).map((kVal, i) => {
                    const isCurrent = phase === 'compress' && currentRound !== null && i === currentRound;
                    const allHighlight = phase === 'kconst' || phase === 'compressintro'; // During k intro and compress overview, highlight all
                    const kBin = (kVal >>> 0).toString(2).padStart(32, '0');
                    return (
                      <div 
                        key={i} 
                        className={`rounded transition-all ${isCurrent ? 'bg-cyan-500/30 text-cyan-300 px-0.5' : allHighlight ? 'text-cyan-500' : 'text-gray-700 opacity-30'}`}
                        title={`k${i}: ${kBin}`}
                      >
                        {kBin.slice(0,16)}...
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>

          {/* Column 4: Final hash h0..h7 */}
          <div className={`w-[320px] shrink-0 p-2 transition-opacity ${!compressDone ? 'opacity-20' : ''}`}>
            <div 
              onClick={() => jumpToPhase(lastClockValue)}
              className="text-xs uppercase tracking-wider text-green-600 mb-2 cursor-pointer hover:text-green-400 hover:underline underline-offset-2 transition-all inline-block"
              title="Click to jump to Final Hash"
            >
              {finished ? '● Final hash' : '○ Final hash'} <span className="text-[10px] opacity-50">↗</span>
      </div>

            <div className="space-y-0.5 leading-tight">
              <div className="text-xs text-gray-500 mb-1">h0..h7</div>
              {hs.map((h, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="text-gray-500 w-6">h{i}</span>
                  <span className={finished ? 'text-white font-mono' : 'text-gray-700 font-mono'}>{toBin(h)}</span>
        </div>
              ))}
              
              {finished && (
                <div className="mt-3 pt-2 border-t border-gray-800 space-y-3">
                  <div>
                    <div className="text-[10px] text-green-400/80 mb-1">Combined (256 bits):</div>
                    <div className="text-green-400/60 font-mono text-[7px] break-all leading-normal">
                      {hs.map(h => toBin(h)).join('')}
                    </div>
                  </div>
                  <div className="bg-green-900/40 border border-green-500/50 rounded-lg p-3">
                    <div className="text-xs text-green-300 mb-2 font-bold uppercase tracking-wide">✓ SHA-256 Hash</div>
                    <div className="text-green-400 font-mono text-sm font-bold break-all leading-relaxed tracking-wider">
                      {result}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Detailed step-by-step explanation */}
        <div className="w-[460px] shrink-0 border-l-2 border-green-500/60 p-3 bg-green-950/40 overflow-y-auto overflow-x-hidden flex flex-col">
          <div className="text-xs uppercase tracking-wider text-green-600 mb-2 shrink-0">Step Details</div>
          
          {/* Main explanation content */}
          <div className="flex-1">
            <DetailedExplainer 
              phase={phase} 
              paddingStep={paddingStep} 
              currentWIndex={currentWIndex} 
              currentRound={currentRound}
              input={input}
              inputBinary={inputBinary}
              inputLength={inputLength}
              kZeros={kZeros}
              lengthBits={lengthBits}
              wView={wView}
              letters={letters}
              lettersBefore={lettersBefore}
              k={k}
              toBin={toBin}
            />
            </div>
          
          {/* Formula Reference - only for schedule/compress/digest phases (not init) */}
          {(phase === 'schedule' || phase === 'chunk' || phase === 'compress' || phase === 'digest') && (
            <div className="mt-6 pt-4 border-t border-gray-700">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-3">Formula Reference</div>
              
              {/* Formulas */}
              <div className="text-xs font-mono space-y-3 text-gray-400 mb-4">
                {(phase === 'schedule' || phase === 'chunk') && (
                  <>
                    <div><span className="text-orange-400">σ₀</span>(x) = ROTR⁷(x) ⊕ ROTR¹⁸(x) ⊕ SHR³(x)</div>
                    <div><span className="text-yellow-400">σ₁</span>(x) = ROTR¹⁷(x) ⊕ ROTR¹⁹(x) ⊕ SHR¹⁰(x)</div>
                    <div className="pt-3 border-t border-gray-800 text-gray-500">w[t] = w[t-16] + σ₀(w[t-15]) + w[t-7] + σ₁(w[t-2])</div>
                  </>
                )}
                {phase === 'compress' && (
                  <>
                    <div><span className="text-cyan-400">Σ₀</span>(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)</div>
                    <div><span className="text-orange-400">Σ₁</span>(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)</div>
                    <div><span className="text-purple-400">Ch</span>(e,f,g) = (e AND f) ⊕ (NOT e AND g)</div>
                    <div><span className="text-emerald-400">Maj</span>(a,b,c) = (a AND b) ⊕ (a AND c) ⊕ (b AND c)</div>
                    
                    <div className="pt-3 mt-2 border-t border-gray-800">
                      <div className="text-gray-500 mb-2">T₁ = h + Σ₁(e) + Ch(e,f,g) + k[t] + w[t]</div>
                      <div className="text-gray-500">T₂ = Σ₀(a) + Maj(a,b,c)</div>
                    </div>
                  </>
                )}
                {phase === 'digest' && (
                  <>
                    <div>H₀ += a, H₁ += b, ... H₇ += h</div>
                    <div className="text-gray-500">Hash = H₀ ∥ H₁ ∥ H₂ ∥ H₃ ∥ H₄ ∥ H₅ ∥ H₆ ∥ H₇</div>
                  </>
                )}
              </div>
              
              {/* Legend - only symbols used in current phase */}
              <div className="text-xs text-gray-600 space-y-1 border-t border-gray-800 pt-3">
                {(phase === 'schedule' || phase === 'chunk') && (
                  <>
                    <div><span className="text-gray-500">ROTR</span> = Rotate Right (circular shift)</div>
                    <div><span className="text-gray-500">SHR</span> = Shift Right (zeros fill left)</div>
                    <div><span className="text-gray-500">⊕</span> = XOR (exclusive or)</div>
                  </>
                )}
                {phase === 'digest' && (
                  <>
                    <div><span className="text-gray-500">∥</span> = Concatenate (join together)</div>
                    <div><span className="text-gray-500">+</span> = Addition mod 2³²</div>
                  </>
                )}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}

export default App;
