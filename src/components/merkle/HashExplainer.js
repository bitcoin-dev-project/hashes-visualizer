import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function HashExplainer({
  selectedNode,
  leftChild,
  rightChild,
  system,
  onClose,
}) {
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (!selectedNode) return;
    setReveal(false);
    const t = setTimeout(() => setReveal(true), 500);
    return () => clearTimeout(t);
  }, [selectedNode?.id]);

  const isLeaf = selectedNode?.level === 0;
  const rawInput = isLeaf
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
          className="fixed bottom-4 right-4 w-[320px] z-50 rounded-lg border border-gray-700/70 bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className={cn('px-3 py-2 flex items-center justify-between border-b border-gray-700/50', system.accentBg)}>
            <span className="text-xs font-bold text-white">Hash computation</span>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-3 py-3 flex flex-col items-center gap-0">

            {/* INPUT */}
            <div className="w-full rounded-md border border-gray-700/50 bg-gray-800/60 px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 block mb-1">Input</span>
              {!isLeaf && (
                <div className="space-y-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-500 font-bold w-3 shrink-0">L</span>
                    <span className={cn('font-mono text-xs font-bold', system.accentText)}>{leftChild?.hash ?? '????????'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-gray-500 font-bold w-3 shrink-0">R</span>
                    <span className={cn('font-mono text-xs font-bold', system.accentText)}>{rightChild?.hash ?? '????????'}</span>
                  </div>
                  <div className="border-t border-gray-700/40 pt-1.5">
                    <span className="text-[9px] text-gray-500 block mb-0.5">concatenated</span>
                  </div>
                </div>
              )}
              <p className="font-mono text-xs text-gray-200 break-all leading-relaxed select-all">{rawInput}</p>
            </div>

            {/* Arrow with hash function label */}
            <div className="flex flex-col items-center py-1.5">
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
              <span className={cn('text-[10px] font-bold font-mono', system.accentText)}>{system.hashNote.split(' (')[0]}</span>
              <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </div>

            {/* OUTPUT */}
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: reveal ? 1 : 0.3 }}
              className={cn('w-full rounded-md border px-3 py-2', system.accentBorder, system.accentBg)}
            >
              <span className={cn('text-[9px] font-bold uppercase tracking-widest block mb-1', system.accentText, 'opacity-60')}>Output</span>
              <div className="font-mono text-sm font-bold flex items-baseline gap-1">
                <span className={system.accentText}>{selectedNode.hash}</span>
                <span className="text-gray-600 text-[10px]">xxxxxxxx…</span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
