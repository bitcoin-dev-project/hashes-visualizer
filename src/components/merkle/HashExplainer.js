import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function HashExplainer({
  selectedNode,
  leftChild,
  rightChild,
  system,
  onClose,
  onUpdateLeaf,
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
          className="fixed bottom-4 right-4 w-[400px] z-50 rounded-xl border border-gray-700/70 bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden"
        >
          {/* Header */}
          <div className={cn('px-4 py-2.5 flex items-center justify-between border-b border-gray-700/50', system.accentBg)}>
            <span className="text-sm font-bold text-white">Hash computation</span>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-4 py-4 flex flex-col items-center gap-0">

            {/* INPUT */}
            <div className={cn(
              'w-full rounded-lg border bg-gray-800/60 px-4 py-3',
              isLeaf ? 'border-gray-700/50 hover:border-gray-600 focus-within:border-gray-500 transition-colors' : 'border-gray-700/50',
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Input</span>
                {isLeaf && (
                  <span className="text-[9px] text-gray-600 italic">editable</span>
                )}
              </div>
              {!isLeaf && (
                <div className="space-y-1.5 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold w-4 shrink-0">L</span>
                    <span className={cn('font-mono text-sm font-bold', system.accentText)}>{leftChild?.hash ?? '????????'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-bold w-4 shrink-0">R</span>
                    <span className={cn('font-mono text-sm font-bold', system.accentText)}>{rightChild?.hash ?? '????????'}</span>
                  </div>
                  <div className="border-t border-gray-700/40 pt-2">
                    <span className="text-[10px] text-gray-500 block mb-0.5">concatenated</span>
                  </div>
                </div>
              )}
              {isLeaf ? (
                <textarea
                  value={selectedNode?.value ?? ''}
                  onChange={(e) => onUpdateLeaf?.(selectedNode.index, e.target.value)}
                  rows={2}
                  className="font-mono text-sm text-gray-200 w-full bg-transparent break-all leading-relaxed resize-none focus:outline-none placeholder:text-gray-600 cursor-text"
                  placeholder="type a value..."
                />
              ) : (
                <p className="font-mono text-sm text-gray-200 break-all leading-relaxed select-all">{rawInput}</p>
              )}
            </div>

            {/* Arrow + Hash function label + Arrow */}
            <div className="flex flex-col items-center py-1">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
              <div className={cn('flex flex-col items-center px-4 py-1.5 rounded-lg border my-1', system.accentBorder, system.accentBg)}>
                <span className={cn('text-sm font-bold font-mono', system.accentText)}>{system.hashNote.split(' (')[0]}</span>
                <span className="text-[9px] text-gray-500 italic">simplified for visualization</span>
              </div>
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
            </div>

            {/* OUTPUT */}
            <motion.div
              initial={{ opacity: 0.3 }}
              animate={{ opacity: reveal ? 1 : 0.3 }}
              className={cn('w-full rounded-lg border px-4 py-3', system.accentBorder, system.accentBg)}
            >
              <span className={cn('text-[10px] font-bold uppercase tracking-widest block mb-1.5', system.accentText, 'opacity-60')}>Output</span>
              <div className="font-mono text-base font-bold flex items-baseline gap-1.5">
                <span className={system.accentText}>{selectedNode.hash}</span>
                <span className="text-gray-600 text-xs">xxxxxxxx...</span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
