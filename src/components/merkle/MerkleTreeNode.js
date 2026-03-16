import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function MerkleTreeNode({
  node,
  isVisible,
  isTampered,
  isProofPath,
  isProofSibling,
  isFaded,
  isSelected,
  onClick,
  onUpdateValue,
  isRoot,
  leafLabel = 'Leaf',
  internalLabel = 'Node',
  rootLabel = 'Root',
  accentText = 'text-cyan-400',
  accentBg = 'bg-cyan-950/20',
  accentBorder = 'border-cyan-500/30',
  hideBadge = false,
}) {
  if (!isVisible) {
    return <div className="w-52 h-12 opacity-0" />;
  }

  const badgeLabel =
    node.level === 0
      ? leafLabel
      : isRoot
        ? rootLabel
        : node.isDuplicate
          ? 'Dup'
          : internalLabel;

  let stateClasses = 'border-gray-700/50 hover:border-gray-500';
  let badgeClasses = 'bg-gray-800 text-gray-400';

  if (isTampered) {
    stateClasses = 'border-red-500 shadow-lg shadow-red-500/20 bg-red-950/30 merkle-tamper-pulse';
    badgeClasses = 'bg-red-500 text-white';
  } else if (isProofPath) {
    stateClasses = 'border-emerald-500 shadow-lg shadow-emerald-500/20 bg-emerald-950/20';
    badgeClasses = 'bg-emerald-500 text-white';
  } else if (isProofSibling) {
    stateClasses = 'border-yellow-500 shadow-lg shadow-yellow-500/20 bg-yellow-950/20';
    badgeClasses = 'bg-yellow-500 text-gray-900';
  } else if (isSelected) {
    stateClasses = cn('ring-2 ring-white/30', accentBorder, accentBg);
    badgeClasses = cn(accentBg, accentText, 'border', accentBorder);
  } else if (isRoot) {
    stateClasses = cn(accentBorder, accentBg, 'shadow-lg');
    badgeClasses = cn(accentBg, accentText, 'border', accentBorder);
  }

  let hashColor = 'text-gray-300';
  if (isTampered) hashColor = 'text-red-400';
  else if (isProofPath) hashColor = 'text-emerald-400';
  else if (isProofSibling) hashColor = 'text-yellow-400';
  else if (isRoot || isSelected) hashColor = accentText;

  const isLeaf = node.value !== undefined;
  const widthClass = isRoot ? 'w-48' : isLeaf ? 'w-52' : 'w-44';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 12 }}
      animate={{ opacity: isFaded ? 0.2 : 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      id={`node-${node.id}`}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center px-3 py-2 rounded-lg border-2 transition-all duration-200 z-10 bg-gray-900 cursor-pointer',
        widthClass,
        'hover:scale-105 hover:shadow-xl',
        stateClasses,
      )}
    >
      {/* Badge */}
      {!hideBadge && (
        <div
          className={cn(
            'absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap',
            badgeClasses,
          )}
        >
          {badgeLabel}
        </div>
      )}

      {/* Inspect hint */}
      <div className="absolute -top-2.5 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white text-gray-900 text-[7px] px-1 py-px rounded font-bold flex items-center gap-0.5 whitespace-nowrap">
          <svg className="w-1.5 h-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          inspect
        </div>
      </div>

      {/* Hash */}
      <div className={cn('flex items-center gap-1.5 w-full justify-center', hashColor)}>
        <svg className="w-3.5 h-3.5 opacity-60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
        </svg>
        <span className="font-mono text-sm tracking-widest font-bold">{node.hash}</span>
      </div>

      {/* Leaf data — editable textarea */}
      {isLeaf && (
        <div className="mt-2 w-full pt-2 border-t border-gray-700/50 relative group/input">
          <div className="relative">
            <svg className="absolute left-2 top-2 w-3 h-3 text-gray-600 group-focus-within/input:text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
            <textarea
              value={node.value}
              onChange={(e) => onUpdateValue?.(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              rows={2}
              className="text-xs text-gray-300 w-full pl-6 pr-2 py-1.5 font-mono bg-gray-800/70 rounded-md border border-dashed border-gray-600/60 hover:border-gray-500 hover:bg-gray-800 focus:outline-none focus:border-solid focus:border-gray-400 focus:bg-gray-800 placeholder:text-gray-600 cursor-text transition-colors resize-none leading-relaxed"
              placeholder="type to edit…"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
