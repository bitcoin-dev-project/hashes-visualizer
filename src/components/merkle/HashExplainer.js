import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

function StepLabel({ num, label, active }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div
        className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors',
          active ? 'bg-cyan-500 text-white' : 'bg-gray-800 text-gray-500',
        )}
      >
        {num}
      </div>
      <span
        className={cn(
          'font-bold uppercase tracking-wider text-[10px]',
          active ? 'text-white' : 'text-gray-500',
        )}
      >
        {label}
      </span>
    </div>
  );
}

export default function HashExplainer({
  selectedNode,
  leftChild,
  rightChild,
  system,
  onClose,
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!selectedNode) return;
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 400);
    const t2 = setTimeout(() => setStep(2), 900);
    const t3 = setTimeout(() => setStep(3), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [selectedNode?.id]);

  const isLeaf = selectedNode?.level === 0;
  const inputConcat = isLeaf
    ? selectedNode?.value ?? ''
    : (leftChild?.hash ?? '') + (rightChild?.hash ?? '');

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-4 right-4 w-[360px] z-50 rounded-lg border border-gray-700/70 bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className={cn('px-4 py-2.5 flex items-center justify-between border-b border-gray-700/50', system.accentBg)}>
            <div className="flex items-center gap-2">
              <svg className={cn('w-4 h-4', system.accentText)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
              </svg>
              <span className="text-sm font-bold text-white">
                How this hash is computed
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs font-mono">
            {/* Node type badge */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] border',
                  system.accentBg,
                  system.accentText,
                  system.accentBorder,
                )}
              >
                {isLeaf ? system.leafLabel : system.internalLabel}
              </span>
              <span className="text-gray-500 text-[11px]">
                {isLeaf ? `${system.leafLabel} node` : 'internal node combining two children'}
              </span>
            </div>

            {/* Step 1: Input */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: step >= 1 ? 1 : 0.3, x: 0 }}
              className="space-y-1"
            >
              <StepLabel num={1} label="Input data" active={step >= 1} />
              {isLeaf ? (
                <div className="rounded-lg bg-gray-800/70 p-3 text-gray-300 border border-gray-700/40">
                  <span className="text-gray-500 text-[10px] block mb-1">raw content</span>
                  <span className="break-all">{selectedNode.value}</span>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-800/70 p-3 space-y-2 border border-gray-700/40">
                  <div>
                    <span className="text-gray-500 text-[10px] block">left child hash</span>
                    <span className={cn('font-bold', system.accentText)}>{leftChild?.hash ?? '????????'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="text-[10px]">concatenated</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">right child hash</span>
                    <span className={cn('font-bold', system.accentText)}>{rightChild?.hash ?? '????????'}</span>
                  </div>
                  <div className="border-t border-gray-700/40 pt-2">
                    <span className="text-gray-500 text-[10px] block">combined input</span>
                    <span className="text-gray-400 break-all">{inputConcat || '\u2026'}</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Step 2: Hash function */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: step >= 2 ? 1 : 0.3, x: 0 }}
              className="space-y-1"
            >
              <StepLabel num={2} label="Hash function" active={step >= 2} />
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-[11px]">SHA-256(input)</span>
                </div>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  SHA-256 converts any input into a fixed <strong className="text-white">256-bit (32-byte)</strong> fingerprint.
                  Even a one-character change produces a completely different output.
                </p>
                <div className="text-[10px] text-gray-500 italic flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75M17.571 14.25L12 17.25l-5.571-3" />
                  </svg>
                  {system.name} actually uses <strong className="text-gray-300 not-italic ml-0.5">{system.hashNote}</strong>
                </div>
              </div>
            </motion.div>

            {/* Step 3: Output */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: step >= 3 ? 1 : 0.3, x: 0 }}
              className="space-y-1"
            >
              <StepLabel num={3} label="Output (hash)" active={step >= 3} />
              <div className="rounded-lg bg-gray-800/70 p-3 space-y-2 border border-gray-700/40">
                <div>
                  <span className="text-gray-500 text-[10px] block mb-1">
                    256-bit output, shown as 64 hex characters (we display first 8):
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className={cn('text-base font-bold', system.accentText)}>
                      {selectedNode.hash}
                    </span>
                    <span className="text-gray-600 text-[10px]">
                      xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Formula summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: step >= 3 ? 1 : 0 }}
              className={cn('rounded-lg border p-3 text-[11px] leading-relaxed', system.accentBorder, system.accentBg)}
            >
              {isLeaf ? (
                <>
                  <span className="text-gray-500">SHA-256(</span>
                  <span className="text-white">"{selectedNode.value}"</span>
                  <span className="text-gray-500">)</span>
                  <br />
                  <span className="text-gray-500">= </span>
                  <span className={cn('font-bold', system.accentText)}>{selectedNode.hash}</span>
                  <span className="text-gray-600">xxxxxxxx\u2026</span>
                </>
              ) : (
                <>
                  <span className="text-gray-500">SHA-256(</span>
                  <span className={system.accentText}>{leftChild?.hash}</span>
                  <span className="text-gray-500"> + </span>
                  <span className={system.accentText}>{rightChild?.hash}</span>
                  <span className="text-gray-500">)</span>
                  <br />
                  <span className="text-gray-500">= </span>
                  <span className={cn('font-bold', system.accentText)}>{selectedNode.hash}</span>
                  <span className="text-gray-600">xxxxxxxx\u2026</span>
                </>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
