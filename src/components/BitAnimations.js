/**
 * BitAnimations - Animated visualizations for SHA-256 bit operations
 * Shows bits actually moving during ROTR, SHR, and XOR operations.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to convert number to 32-bit binary string
const toBin32 = (n) => (n >>> 0).toString(2).padStart(32, '0');

// ============================================================================
// Animated Bits Display - animates the actual bits in place
// ============================================================================

function AnimatedBits({ input, amount, operation, isAnimating, highlightColor = 'gray' }) {
  const inputBits = toBin32(input).split('');
  
  // Calculate result
  let result;
  if (operation === 'rotr') {
    result = ((input >>> amount) | (input << (32 - amount))) >>> 0;
  } else {
    result = input >>> amount;
  }
  const resultBits = toBin32(result).split('');
  
  // Format with spaces for display
  const formatBin = (bits) => {
    return `${bits.slice(0,8).join('')} ${bits.slice(8,16).join('')} ${bits.slice(16,24).join('')} ${bits.slice(24,32).join('')}`;
  };

  if (!isAnimating) {
    // Show result bits normally with spaces - 1s are brighter, 0s are dimmer
    return (
      <span>
        {resultBits.slice(0,8).map((bit, i) => (
          <span key={i} className={bit === '1' ? 'text-gray-200' : 'text-gray-600'}>{bit}</span>
        ))}
        <span> </span>
        {resultBits.slice(8,16).map((bit, i) => (
          <span key={i+8} className={bit === '1' ? 'text-gray-200' : 'text-gray-600'}>{bit}</span>
        ))}
        <span> </span>
        {resultBits.slice(16,24).map((bit, i) => (
          <span key={i+16} className={bit === '1' ? 'text-gray-200' : 'text-gray-600'}>{bit}</span>
        ))}
        <span> </span>
        {resultBits.slice(24,32).map((bit, i) => (
          <span key={i+24} className={bit === '1' ? 'text-gray-200' : 'text-gray-600'}>{bit}</span>
        ))}
      </span>
    );
  }

  // During animation: show bits in 4 groups with spaces, animate each bit
  const charWidth = 6.6; // pixels per character at 11px font
  const spaceWidth = 3.3; // space is about half character
  
  // Get position including spaces
  const getPosition = (bitIdx) => {
    const spaces = Math.floor(bitIdx / 8);
    return bitIdx * charWidth + spaces * spaceWidth;
  };

  return (
    <span className="inline-flex relative" style={{ width: '280px', height: '16px' }}>
      {inputBits.map((bit, i) => {
        let targetIdx;
        let opacity = 1;
        let isMoving = false;
        
        if (operation === 'rotr') {
          targetIdx = (i + amount) % 32;
          // For rotation, bits that wrap around are highlighted
          isMoving = i >= (32 - amount); // these bits wrap around
        } else {
          if (i + amount < 32) {
            targetIdx = i + amount;
            isMoving = true; // all bits move in shift
          } else {
            targetIdx = i;
            opacity = 0;
            isMoving = true; // bits falling off
          }
        }
        
        const fromPos = getPosition(i);
        const toPos = getPosition(targetIdx);
        const offset = toPos - fromPos;
        
        // Highlight moving bits with border and color
        const colorMap = {
          orange: { text: 'text-orange-300', border: 'border-orange-400' },
          yellow: { text: 'text-yellow-300', border: 'border-yellow-400' },
          cyan: { text: 'text-cyan-300', border: 'border-cyan-400' },
          blue: { text: 'text-blue-300', border: 'border-blue-400' },
          teal: { text: 'text-teal-300', border: 'border-teal-400' },
          emerald: { text: 'text-emerald-300', border: 'border-emerald-400' },
          pink: { text: 'text-pink-300', border: 'border-pink-400' },
          gray: { text: 'text-white', border: 'border-gray-400' },
        };
        const colors = colorMap[highlightColor] || colorMap.gray;
        
        // Different styling for bits that fall off vs bits that wrap/move
        let movingClass;
        if (operation === 'shr' && opacity === 0) {
          // Bits falling off - red border to show they're disappearing
          movingClass = `${colors.text} border-b-2 border-red-500`;
        } else if (isMoving) {
          // Bits wrapping/moving - underline with operation color
          movingClass = `${colors.text} border-b-2 ${colors.border}`;
        } else {
          movingClass = bit === '1' ? 'text-gray-200' : 'text-gray-600';
        }
        
        return (
          <motion.span
            key={i}
            className={`absolute ${movingClass}`}
            style={{ left: fromPos, lineHeight: '16px' }}
            animate={{ 
              x: offset,
              opacity: opacity,
            }}
            transition={{ 
              duration: 1.2, 
              ease: "easeInOut",
            }}
          >
            {bit}
          </motion.span>
        );
      })}
      
      {/* Static spaces to maintain alignment */}
      <span className="absolute text-transparent" style={{ left: getPosition(8) - spaceWidth }}> </span>
      <span className="absolute text-transparent" style={{ left: getPosition(16) - spaceWidth }}> </span>
      <span className="absolute text-transparent" style={{ left: getPosition(24) - spaceWidth }}> </span>
      
      {/* Show zeros coming in for shift - with green border to show new bits */}
      {operation === 'shr' && Array.from({ length: Math.min(amount, 32) }).map((_, i) => {
        return (
          <motion.span
            key={`zero-${i}`}
            className="absolute text-green-400 border-b-2 border-green-500"
            style={{ left: -20, lineHeight: '16px' }}
            animate={{ 
              x: 20 + getPosition(i),
              opacity: 1,
            }}
            initial={{ opacity: 0 }}
            transition={{ 
              duration: 1.2, 
              ease: "easeInOut",
              delay: 0.2,
            }}
          >
            0
          </motion.span>
        );
      })}
    </span>
  );
}

// ============================================================================
// Animated Sigma Operation - with clickable bit animations
// ============================================================================

export function SigmaAnimation({ 
  input, 
  type, // 'sigma0' | 'sigma1'
  inputLabel,
  onComplete 
}) {
  const [animatingOp, setAnimatingOp] = useState(null); // which op is currently animating
  
  const ops = type === 'sigma0' 
    ? [{ by: 7, op: 'rotr' }, { by: 18, op: 'rotr' }, { by: 3, op: 'shr' }]
    : [{ by: 17, op: 'rotr' }, { by: 19, op: 'rotr' }, { by: 10, op: 'shr' }];
  
  const sigmaName = type === 'sigma0' ? 'σ₀' : 'σ₁';
  
  // Calculate results
  const results = ops.map(({ by, op }) => {
    if (op === 'rotr') {
      return ((input >>> by) | (input << (32 - by))) >>> 0;
    }
    return input >>> by;
  });
  
  const finalResult = (results[0] ^ results[1] ^ results[2]) >>> 0;

  // Format binary with spaces for readability
  const formatBin = (n) => {
    const s = toBin32(n);
    return `${s.slice(0,8)} ${s.slice(8,16)} ${s.slice(16,24)} ${s.slice(24,32)}`;
  };

  // Handle animation click
  const handleAnimate = (idx) => {
    if (animatingOp !== null) return;
    setAnimatingOp(idx);
    setTimeout(() => setAnimatingOp(null), 1500);
  };

  const color = type === 'sigma0' ? 'text-orange-400' : 'text-yellow-400';
  const dimColor = type === 'sigma0' ? 'text-orange-300/70' : 'text-yellow-300/70';

  return (
    <div className="bg-gray-900/80 rounded-lg p-3 space-y-2 text-[10px] font-mono">
      {/* Header */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400 pb-1 border-b border-gray-800">
        <span className={`font-bold ${color}`}>{sigmaName}</span>
        <span>= ROTR{ops[0].by} ⊕ ROTR{ops[1].by} ⊕ {ops[2].op === 'shr' ? 'SHR' : 'ROTR'}{ops[2].by}</span>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 w-16 text-right">{inputLabel}</span>
        <span className="text-gray-300">{formatBin(input)}</span>
      </div>

      {/* Operations - click to animate bits in place */}
      {ops.map((op, i) => (
        <div key={i} className="flex items-center gap-2">
          {/* Clickable operation label - click to play animation */}
          <button
            onClick={() => handleAnimate(i)}
            disabled={animatingOp !== null}
            className={`w-16 text-right shrink-0 transition-all rounded px-1 ${
              animatingOp === i 
                ? 'bg-green-600/30 text-green-400' 
                : `${dimColor} hover:text-white hover:bg-gray-800 pulse-clickable`
            }`}
            title="Click to animate"
          >
            {op.op === 'rotr' ? `rot ${op.by}` : `shr ${op.by}`}
            <span className="text-[8px] ml-1">{animatingOp === i ? '●' : '▶'}</span>
          </button>
          
          {/* Animated bits display */}
          <span className={dimColor}>
            <AnimatedBits 
              input={input} 
              amount={op.by} 
              operation={op.op} 
              isAnimating={animatingOp === i}
              highlightColor={type === 'sigma0' ? 'orange' : 'yellow'}
            />
          </span>
        </div>
      ))}

      {/* XOR result */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
        <span className={`w-16 text-right font-bold ${color}`}>{sigmaName} =</span>
        <span className={`font-bold ${color}`}>{formatBin(finalResult)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Big Sigma Animation (Σ₀, Σ₁) - for compression phase with clickable rotations
// ============================================================================

export function BigSigmaAnimation({ 
  input, 
  type, // 'Sigma0' | 'Sigma1'
  inputLabel 
}) {
  const [animatingOp, setAnimatingOp] = useState(null);
  
  // Σ₀(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)
  // Σ₁(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)
  const ops = type === 'Sigma0' 
    ? [{ by: 2, op: 'rotr' }, { by: 13, op: 'rotr' }, { by: 22, op: 'rotr' }]
    : [{ by: 6, op: 'rotr' }, { by: 11, op: 'rotr' }, { by: 25, op: 'rotr' }];
  
  const sigmaName = type === 'Sigma0' ? 'Σ₀' : 'Σ₁';
  
  const results = ops.map(({ by }) => {
    return ((input >>> by) | (input << (32 - by))) >>> 0;
  });
  
  const finalResult = (results[0] ^ results[1] ^ results[2]) >>> 0;

  const formatBin = (n) => {
    const s = toBin32(n);
    return `${s.slice(0,8)} ${s.slice(8,16)} ${s.slice(16,24)} ${s.slice(24,32)}`;
  };

  const handleAnimate = (idx) => {
    if (animatingOp !== null) return;
    setAnimatingOp(idx);
    setTimeout(() => setAnimatingOp(null), 1500);
  };

  // Different colors for Σ₀ (cyan) vs Σ₁ (orange)
  const isSigma0 = type === 'Sigma0';

  return (
    <div className="bg-gray-900/80 rounded-lg p-3 space-y-2 text-[10px] font-mono">
      <div className="flex items-center gap-2 text-[10px] text-gray-400 pb-1 border-b border-gray-800">
        <span className={`font-bold ${isSigma0 ? 'text-cyan-400' : 'text-orange-400'}`}>{sigmaName}</span>
        <span>= ROTR{ops[0].by} ⊕ ROTR{ops[1].by} ⊕ ROTR{ops[2].by}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 w-16 text-right">{inputLabel}</span>
        <span className={isSigma0 ? 'text-cyan-400/50' : 'text-orange-400/50'}>{formatBin(input)}</span>
      </div>

      {ops.map((op, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => handleAnimate(i)}
            disabled={animatingOp !== null}
            className={`w-16 text-right shrink-0 transition-all rounded px-1 ${
              animatingOp === i 
                ? (isSigma0 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-orange-500/20 text-orange-300')
                : (isSigma0 ? 'text-cyan-500/80 hover:text-cyan-400 hover:bg-cyan-900/30 pulse-clickable' : 'text-orange-500/80 hover:text-orange-400 hover:bg-orange-900/30 pulse-clickable')
            }`}
            title="Click to animate"
          >
            rot {op.by}
            <span className="text-[8px] ml-1">{animatingOp === i ? '●' : '▶'}</span>
          </button>
          
          <span className={isSigma0 ? 'text-cyan-400/50' : 'text-orange-400/50'}>
            <AnimatedBits 
              input={input} 
              amount={op.by} 
              operation={op.op} 
              isAnimating={animatingOp === i}
              highlightColor={isSigma0 ? 'cyan' : 'orange'}
            />
          </span>
        </div>
      ))}

      <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
        <span className={`w-16 text-right font-bold ${isSigma0 ? 'text-cyan-400' : 'text-orange-400'}`}>{sigmaName} =</span>
        <span className={`font-bold ${isSigma0 ? 'text-cyan-400' : 'text-orange-400'}`}>{formatBin(finalResult)}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Choice Animation - with bit-level visualization
// ============================================================================

export function ChoiceAnimation({ e, f, g }) {
  const [showBitView, setShowBitView] = useState(false);
  const result = ((e & f) ^ (~e & g)) >>> 0;

  const formatBin = (n) => {
    const s = toBin32(n);
    return `${s.slice(0,8)} ${s.slice(8,16)} ${s.slice(16,24)} ${s.slice(24,32)}`;
  };

  const eBits = toBin32(e).split('');
  const fBits = toBin32(f).split('');
  const gBits = toBin32(g).split('');
  const resultBits = toBin32(result).split('');

  return (
    <div className="bg-gray-900/80 rounded-lg p-3 space-y-2 text-[10px] font-mono">
      <div className="flex items-center gap-2 text-[10px] text-gray-400 pb-1 border-b border-gray-800">
        <span className="font-bold text-purple-400">Ch(e,f,g)</span>
        <span>= "if e=1 pick f, else pick g"</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 text-right">e (select)</span>
          <span className="text-purple-400/50">{formatBin(e)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 text-right">f (if 1)</span>
          <span className="text-purple-400/70">{formatBin(f)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 text-right">g (if 0)</span>
          <span className="text-purple-400/40">{formatBin(g)}</span>
        </div>
        
        {/* Toggle bit view */}
        <button 
          onClick={() => setShowBitView(!showBitView)}
          className="text-[9px] text-purple-500 hover:text-purple-400 transition-colors pulse-clickable mt-1"
        >
          {showBitView ? '▼ Hide' : '▶ Show'} bit selection
        </button>
        
        {showBitView && (
          <div className="py-2 px-1 bg-gray-950 rounded mt-1">
            <div className="text-[9px] text-gray-600 mb-1">Each bit: e=1→f (bright), e=0→g (dim)</div>
            <div className="flex flex-wrap gap-[1px]">
              {resultBits.map((bit, i) => (
                <span key={i}>
                  {i > 0 && i % 8 === 0 && <span className="w-1"> </span>}
                  <span 
                    className={eBits[i] === '1' ? 'text-purple-300' : 'text-purple-700'}
                    title={eBits[i] === '1' ? `from f[${i}]` : `from g[${i}]`}
                  >
                    {bit}
                  </span>
                </span>
              ))}
            </div>
            <div className="text-[8px] mt-1 flex gap-3">
              <span className="text-purple-300">■ from f (e=1)</span>
              <span className="text-purple-700">■ from g (e=0)</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
          <span className="text-purple-400 w-16 text-right font-bold">Ch =</span>
          <span className="text-purple-300 font-bold">{formatBin(result)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Majority Animation - with bit-level visualization
// ============================================================================

export function MajorityAnimation({ a, b, c }) {
  const [showBitView, setShowBitView] = useState(false);
  const result = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;

  const formatBin = (n) => {
    const s = toBin32(n);
    return `${s.slice(0,8)} ${s.slice(8,16)} ${s.slice(16,24)} ${s.slice(24,32)}`;
  };

  const aBits = toBin32(a).split('');
  const bBits = toBin32(b).split('');
  const cBits = toBin32(c).split('');
  const resultBits = toBin32(result).split('');

  // Count how many 1s for each position
  const getVoteCount = (i) => {
    return (aBits[i] === '1' ? 1 : 0) + (bBits[i] === '1' ? 1 : 0) + (cBits[i] === '1' ? 1 : 0);
  };

  return (
    <div className="bg-gray-900/80 rounded-lg p-3 space-y-2 text-[10px] font-mono">
      <div className="flex items-center gap-2 text-[10px] text-gray-400 pb-1 border-b border-gray-800">
        <span className="font-bold text-emerald-400">Maj(a,b,c)</span>
        <span>= "majority vote of each bit"</span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 text-right">a</span>
          <span className="text-emerald-400/50">{formatBin(a)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 text-right">b</span>
          <span className="text-emerald-400/50">{formatBin(b)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-16 text-right">c</span>
          <span className="text-emerald-400/50">{formatBin(c)}</span>
        </div>
        
        {/* Toggle bit view */}
        <button 
          onClick={() => setShowBitView(!showBitView)}
          className="text-[9px] text-emerald-500 hover:text-emerald-400 transition-colors pulse-clickable mt-1"
        >
          {showBitView ? '▼ Hide' : '▶ Show'} bit voting
        </button>
        
        {showBitView && (
          <div className="py-2 px-1 bg-gray-950 rounded mt-1">
            <div className="text-[9px] text-gray-600 mb-1">Each bit: 2+ votes → 1 (brighter = more votes)</div>
            <div className="flex flex-wrap gap-[1px]">
              {resultBits.map((bit, i) => {
                const votes = getVoteCount(i);
                // Brightness based on vote count - emerald shades
                let colorClass = 'text-emerald-900'; // 0 votes
                if (votes === 3) colorClass = 'text-emerald-300';
                else if (votes === 2) colorClass = 'text-emerald-400';
                else if (votes === 1) colorClass = 'text-emerald-700';
                
                return (
                  <span key={i}>
                    {i > 0 && i % 8 === 0 && <span className="w-1"> </span>}
                    <span 
                      className={colorClass}
                      title={`${votes}/3 votes for 1`}
                    >
                      {bit}
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="text-[8px] mt-1 flex gap-2">
              <span className="text-emerald-300">■ 3/3</span>
              <span className="text-emerald-400">■ 2/3</span>
              <span className="text-emerald-700">■ 1/3</span>
              <span className="text-emerald-900">■ 0/3</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
          <span className="text-emerald-400 w-16 text-right font-bold">Maj =</span>
          <span className="text-emerald-300 font-bold">{formatBin(result)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Compact W Calculation with expandable sigmas
// ============================================================================

export function WCalculationAnimation({ t, wView, toBin }) {
  const [showSigma0, setShowSigma0] = useState(false);
  const [showSigma1, setShowSigma1] = useState(false);

  const w16 = wView[t-16] >>> 0;
  const w15 = wView[t-15] >>> 0;
  const w7 = wView[t-7] >>> 0;
  const w2 = wView[t-2] >>> 0;

  // Calculate sigmas
  const sigma0 = (x) => {
    const r7 = ((x >>> 7) | (x << 25)) >>> 0;
    const r18 = ((x >>> 18) | (x << 14)) >>> 0;
    const s3 = x >>> 3;
    return (r7 ^ r18 ^ s3) >>> 0;
  };
  
  const sigma1 = (x) => {
    const r17 = ((x >>> 17) | (x << 15)) >>> 0;
    const r19 = ((x >>> 19) | (x << 13)) >>> 0;
    const s10 = x >>> 10;
    return (r17 ^ r19 ^ s10) >>> 0;
  };

  const s0 = sigma0(w15);
  const s1 = sigma1(w2);
  const result = ((w16 + s0 + w7 + s1) % (2**32)) >>> 0;

  // Format binary with spaces
  const formatBin = (n) => {
    const s = toBin(n);
    return `${s.slice(0,8)} ${s.slice(8,16)} ${s.slice(16,24)} ${s.slice(24)}`;
  };

  return (
    <div className="space-y-4">
      <div className="text-green-400 font-bold text-base">Computing w[{t}]</div>
      
      {/* Formula - large and prominent */}
      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
        <div className="text-[14px] font-mono">
          <span className="text-green-400 font-bold text-[16px]">w[{t}]</span>
          <span className="text-gray-500"> = </span>
          <span className="text-gray-500">w[{t-16}]</span>
          <span className="text-gray-600"> + </span>
          <span className="text-orange-400">σ₀</span><span className="text-gray-500">(w[{t-15}])</span>
          <span className="text-gray-600"> + </span>
          <span className="text-gray-500">w[{t-7}]</span>
          <span className="text-gray-600"> + </span>
          <span className="text-yellow-400">σ₁</span><span className="text-gray-500">(w[{t-2}])</span>
        </div>
      </div>

      {/* Main calculation */}
      <div className="space-y-1 font-mono text-[11px]">
        {/* w[t-16] */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-24 text-right shrink-0">w[{t-16}]</span>
          <span className="text-gray-300">{formatBin(w16)}</span>
        </div>
        
        {/* σ₀ - clickable button with pulsing glow */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSigma0(!showSigma0)}
            className={`w-24 text-right shrink-0 flex items-center justify-end gap-1 px-1 py-0.5 rounded transition-all ${
              showSigma0 
                ? 'bg-orange-500/20 text-orange-400' 
                : 'text-orange-400 pulse-clickable'
            }`}
          >
            <span className="text-[9px]">{showSigma0 ? '▼' : '▶'}</span>
            <span>+ σ₀(w[{t-15}])</span>
          </button>
          <span className="text-orange-400">{formatBin(s0)}</span>
        </div>
        
        {/* σ₀ expansion */}
        <AnimatePresence>
          {showSigma0 && (
            <motion.div 
              className="ml-6 my-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <SigmaAnimation input={w15} type="sigma0" inputLabel={`w[${t-15}]`} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* w[t-7] */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 w-24 text-right shrink-0">+ w[{t-7}]</span>
          <span className="text-gray-300">{formatBin(w7)}</span>
        </div>
        
        {/* σ₁ - clickable button with pulsing glow */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSigma1(!showSigma1)}
            className={`w-24 text-right shrink-0 flex items-center justify-end gap-1 px-1 py-0.5 rounded transition-all ${
              showSigma1 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : 'text-yellow-400 pulse-clickable'
            }`}
          >
            <span className="text-[9px]">{showSigma1 ? '▼' : '▶'}</span>
            <span>+ σ₁(w[{t-2}])</span>
          </button>
          <span className="text-yellow-400">{formatBin(s1)}</span>
        </div>
        
        {/* σ₁ expansion */}
        <AnimatePresence>
          {showSigma1 && (
            <motion.div 
              className="ml-6 my-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <SigmaAnimation input={w2} type="sigma1" inputLabel={`w[${t-2}]`} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Result - highlighted */}
        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-green-800/50">
          <span className="text-green-400 w-24 text-right shrink-0 font-bold text-[12px]">= w[{t}]</span>
          <span className="text-green-300 font-bold text-[12px]">{formatBin(result)}</span>
        </div>
      </div>

      <div className="text-gray-600 text-[10px]">
        ▶ Click <span className="text-orange-400">σ₀</span> or <span className="text-yellow-400">σ₁</span> to see breakdown
      </div>
    </div>
  );
}

// ============================================================================
// Compression Round Explainer with expandable Ch and Maj
// ============================================================================

export function CompressionRoundExplainer({ round, letters, lettersBefore = [], wView, k, toBin }) {
  const [showSigma1, setShowSigma1] = useState(false);
  const [showCh, setShowCh] = useState(false);
  const [showSigma0, setShowSigma0] = useState(false);
  const [showMaj, setShowMaj] = useState(false);

  const r = round;
  const [a,b,c,d,e,f,g,h] = letters.map(l => l >>> 0);
  
  const hasBefore = lettersBefore.length > 0;
  const [oldA, oldB, oldC, oldD, oldE, oldF, oldG, oldH] = hasBefore 
    ? lettersBefore.map(l => l >>> 0) 
    : [0,0,0,0,0,0,0,0];
  const wt = wView[r] >>> 0;
  const kt = k[r] >>> 0;
  
  // Compute using OLD values (before this round)
  const bigS1 = (((oldE >>> 6) | (oldE << 26)) ^ ((oldE >>> 11) | (oldE << 21)) ^ ((oldE >>> 25) | (oldE << 7))) >>> 0;
  const ch = ((oldE & oldF) ^ ((~oldE) & oldG)) >>> 0;
  const bigS0 = (((oldA >>> 2) | (oldA << 30)) ^ ((oldA >>> 13) | (oldA << 19)) ^ ((oldA >>> 22) | (oldA << 10))) >>> 0;
  const maj = ((oldA & oldB) ^ (oldA & oldC) ^ (oldB & oldC)) >>> 0;
  const temp1 = (oldH + bigS1 + ch + kt + wt) % (2**32) >>> 0;
  const temp2 = (bigS0 + maj) % (2**32) >>> 0;

  const formatBin = (n) => {
    const s = toBin(n);
    return `${s.slice(0,8)} ${s.slice(8,16)} ${s.slice(16,24)} ${s.slice(24)}`;
  };

  // Format binary with spaces for display
  const formatBinCompact = (n) => (n >>> 0).toString(2).padStart(32, '0');

  return (
    <div className="space-y-6">
      <div className="text-gray-200 font-bold text-sm">Round {r} of 64</div>
      
      {/* T1 calculation */}
      <div className="space-y-1">
        <div className="text-gray-400 text-[11px] pb-1 border-b border-gray-800">T₁ = h + Σ₁(e) + Ch(e,f,g) + k[{r}] + w[{r}]</div>
        <div className="font-mono text-[10px] space-y-0.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-20 text-right shrink-0">h</span>
            <span className="text-gray-500">{formatBin(oldH)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSigma1(!showSigma1)}
              className="w-20 text-right shrink-0 text-orange-500 hover:text-orange-400"
            >
              <span className="text-[8px] mr-1">{showSigma1 ? '▼' : '▶'}</span>+ Σ₁(e)
            </button>
            <span className="text-orange-400/70">{formatBin(bigS1)}</span>
          </div>
          <AnimatePresence>
            {showSigma1 && (
              <motion.div className="ml-4 my-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <BigSigmaAnimation input={oldE} type="Sigma1" inputLabel="e" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCh(!showCh)}
              className="w-20 text-right shrink-0 text-purple-500 hover:text-purple-400"
            >
              <span className="text-[8px] mr-1">{showCh ? '▼' : '▶'}</span>+ Ch(e,f,g)
            </button>
            <span className="text-purple-400/70">{formatBin(ch)}</span>
          </div>
          <AnimatePresence>
            {showCh && (
              <motion.div className="ml-4 my-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <ChoiceAnimation e={oldE} f={oldF} g={oldG} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-20 text-right shrink-0">+ k[{r}]</span>
            <span className="text-gray-600">{formatBin(kt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 w-20 text-right shrink-0">+ w[{r}]</span>
            <span className="text-gray-600">{formatBin(wt)}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
            <span className="text-gray-300 w-20 text-right shrink-0 font-bold">= T₁</span>
            <span className="text-white font-bold">{formatBin(temp1)}</span>
          </div>
        </div>
      </div>
      
      {/* Separator between T1 and T2 */}
      <div className="border-t border-gray-700 my-4"></div>
      
      {/* T2 calculation */}
      <div className="space-y-1">
        <div className="text-gray-400 text-[11px] pb-1 border-b border-gray-800">T₂ = Σ₀(a) + Maj(a,b,c)</div>
        <div className="font-mono text-[10px] space-y-0.5 pt-1">
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSigma0(!showSigma0)}
              className="w-20 text-right shrink-0 text-cyan-500 hover:text-cyan-400"
            >
              <span className="text-[8px] mr-1">{showSigma0 ? '▼' : '▶'}</span>Σ₀(a)
            </button>
            <span className="text-cyan-400/70">{formatBin(bigS0)}</span>
          </div>
          <AnimatePresence>
            {showSigma0 && (
              <motion.div className="ml-4 my-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <BigSigmaAnimation input={oldA} type="Sigma0" inputLabel="a" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMaj(!showMaj)}
              className="w-20 text-right shrink-0 text-emerald-500 hover:text-emerald-400"
            >
              <span className="text-[8px] mr-1">{showMaj ? '▼' : '▶'}</span>+ Maj(a,b,c)
            </button>
            <span className="text-emerald-400/70">{formatBin(maj)}</span>
          </div>
          <AnimatePresence>
            {showMaj && (
              <motion.div className="ml-4 my-1" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <MajorityAnimation a={oldA} b={oldB} c={oldC} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2 pt-1 border-t border-gray-800">
            <span className="text-gray-300 w-20 text-right shrink-0 font-bold">= T₂</span>
            <span className="text-white font-bold">{formatBin(temp2)}</span>
          </div>
        </div>
      </div>
      
      {/* Update summary */}
      <div className="text-[10px] space-y-1 pt-2 border-t border-gray-800">
        <div className="text-gray-500">Update:</div>
        <div className="font-mono text-gray-400">
          <span className="text-purple-400">a</span> = T₁+T₂ &nbsp;
          <span className="text-purple-400">e</span> = d+T₁ &nbsp;
          <span className="text-gray-600">b,c,d ← a,b,c &nbsp; f,g,h ← e,f,g</span>
        </div>
      </div>
    </div>
  );
}

export default { SigmaAnimation, BigSigmaAnimation, ChoiceAnimation, MajorityAnimation, WCalculationAnimation, CompressionRoundExplainer };

