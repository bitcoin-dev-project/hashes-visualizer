import React, { useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useMerkle } from '../hooks/useMerkle';
import MerkleTreeNode from '../components/merkle/MerkleTreeNode';
import TreeConnections from '../components/merkle/TreeConnections';
import MerkleSidebar from '../components/merkle/MerkleSidebar';
import HashExplainer from '../components/merkle/HashExplainer';
import { cn } from '../lib/utils';
import { SYSTEMS } from '../lib/systems';

const BLOCK_HEADER = {
  title: 'Block Header',
  fieldsAbove: [
    { label: 'version', value: '0x20000000' },
    { label: 'prev_hash', value: '0000...3a7f' },
  ],
  fieldsBelow: [
    { label: 'timestamp', value: '2024-01-03' },
    { label: 'bits', value: '386,089,497' },
    { label: 'nonce', value: '2,083,236,893' },
  ],
  accentText: 'text-orange-400',
  accentBorder: 'border-orange-500/30',
  accentBorderDim: 'border-orange-500/10',
  accentBg: 'bg-orange-500/5',
  rootLabel: 'merkle_root',
};

function FieldRow({ label, value, dimBorder }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-3 py-1.5')}>
      <span className="text-[10px] font-mono text-gray-500 shrink-0">{label}</span>
      <span className="text-[10px] font-mono text-gray-400 truncate text-right">{value}</span>
    </div>
  );
}

function RootContext({ isFaded, children }) {
  const config = BLOCK_HEADER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isFaded ? 0.2 : 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative flex flex-col items-center rounded-lg border overflow-visible transition-opacity duration-200',
        config.accentBorder,
        'bg-gray-950/80',
      )}
      style={{ width: 220 }}
    >
      {/* Struct title */}
      <div className={cn(
        'w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-center border-b',
        config.accentText, config.accentBorderDim,
        config.accentBg,
      )}>
        {config.title}
      </div>

      {/* Fields above root */}
      <div className="w-full">
        {config.fieldsAbove.map((f) => (
          <FieldRow key={f.label} label={f.label} value={f.value} dimBorder={config.accentBorderDim} />
        ))}
      </div>

      {/* Separator */}
      <div className={cn('w-full border-t', config.accentBorderDim)} />

      {/* Root node slot */}
      <div className={cn('w-full flex flex-col items-center py-2 px-1.5', config.accentBg)}>
        <span className={cn('text-[8px] font-bold uppercase tracking-widest mb-1 opacity-60', config.accentText)}>
          {config.rootLabel}
        </span>
        {children}
      </div>

      {/* Separator */}
      <div className={cn('w-full border-t', config.accentBorderDim)} />

      {/* Fields below root */}
      <div className="w-full pb-1">
        {config.fieldsBelow.map((f) => (
          <FieldRow key={f.label} label={f.label} value={f.value} dimBorder={config.accentBorderDim} />
        ))}
      </div>
    </motion.div>
  );
}

function SubTree({
  nodeId,
  nodeMap,
  rootLevel,
  mode,
  activeStep,
  tamperedIds,
  proof,
  selectedLeafForProof,
  selectedNodeId,
  currentSystem,
  handleNodeClick,
  updateLeaf,
}) {
  const entry = nodeMap.get(nodeId);
  if (!entry) return null;
  const { node } = entry;

  const isVisible = mode !== 'explore' || node.level <= activeStep;
  const isRootLevel = node.level === rootLevel;
  const isTampered = tamperedIds.has(node.id);
  const isPath = proof.pathIds.has(node.id);
  const isSibling = proof.siblingIds.has(node.id) && !isPath;
  const isSelected = selectedNodeId === node.id;

  let isFaded = false;
  if (mode === 'tamper' && tamperedIds.size > 0 && !isTampered) isFaded = true;
  if (mode === 'proof' && selectedLeafForProof !== null && !isPath && !isSibling) isFaded = true;

  const hasChildren = node.leftId && node.rightId;
  const sharedProps = {
    nodeMap, rootLevel, mode, activeStep, tamperedIds, proof,
    selectedLeafForProof, selectedNodeId, currentSystem, handleNodeClick, updateLeaf,
  };

  const treeNode = (
    <MerkleTreeNode
      node={node}
      isVisible={isVisible}
      isTampered={isTampered}
      isProofPath={isPath}
      isProofSibling={isSibling}
      isFaded={isFaded}
      isSelected={isSelected}
      isRoot={isRootLevel}
      leafLabel={currentSystem.leafLabel}
      internalLabel={currentSystem.internalLabel}
      rootLabel={currentSystem.rootLabel}
      accentText={currentSystem.accentText}
      accentBg={currentSystem.accentBg}
      accentBorder={currentSystem.accentBorder}
      hideBadge={isRootLevel && currentSystem.id === 'bitcoin'}
      onClick={() => handleNodeClick(node.id, node.level, node.index)}
      onUpdateValue={node.level === 0 ? (val) => updateLeaf(node.index, val) : undefined}
    />
  );

  return (
    <div className="flex flex-col items-center gap-24">
      {isRootLevel && isVisible && currentSystem.id === 'bitcoin' ? (
        <RootContext isFaded={isFaded}>
          {treeNode}
        </RootContext>
      ) : treeNode}
      {hasChildren && (
        <div className="flex gap-16">
          <SubTree nodeId={node.leftId} {...sharedProps} />
          <SubTree nodeId={node.rightId} {...sharedProps} />
        </div>
      )}
    </div>
  );
}

export default function MerkleTreePage() {
  const containerRef = useRef(null);

  const {
    systemId,
    setSystemId,
    currentSystem,
    leaves,
    tree,
    mode,
    setMode,
    activeStep,
    setActiveStep,
    selectedLeafForProof,
    setSelectedLeafForProof,
    selectedNodeId,
    setSelectedNodeId,
    proof,
    tamperedIds,
    updateLeaf,
    tamperLeaf,
    addLeaves,
    removeLeaves,
    reset,
    maxLevel,
  } = useMerkle();

  const rootLevel = tree.length - 1;

  const nodeMap = useMemo(() => {
    const map = new Map();
    tree.forEach((level, lIndex) => {
      level.forEach((node) => map.set(node.id, { node, level: lIndex }));
    });
    return map;
  }, [tree]);

  const selectedEntry = selectedNodeId ? nodeMap.get(selectedNodeId) ?? null : null;
  const selectedNode = selectedEntry?.node ?? null;
  const leftChild = selectedNode?.leftId ? (nodeMap.get(selectedNode.leftId)?.node ?? null) : null;
  const rightChild = selectedNode?.rightId ? (nodeMap.get(selectedNode.rightId)?.node ?? null) : null;

  const handleNodeClick = (nodeId, levelNum, nodeIndex) => {
    if (mode === 'proof' && levelNum === 0) {
      setSelectedLeafForProof(nodeIndex);
    }
    if (mode === 'tamper' && levelNum === 0) {
      tamperLeaf(nodeIndex);
      return;
    }
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  };

  return (
    <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 41px)' }}>
      <Helmet>
        <title>Merkle Tree Explorer - Interactive Visualization | Hash Explained</title>
        <meta name="description" content="Interactive Merkle tree builder and visualizer. Explore how Bitcoin, Git, and IPFS use Merkle trees for data integrity, tamper detection, and efficient verification." />
        <link rel="canonical" href="https://hashexplained.com/merkle-tree" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hashexplained.com/merkle-tree" />
        <meta property="og:title" content="Merkle Tree Explorer - Interactive Visualization" />
        <meta property="og:description" content="Build, tamper, and verify Merkle trees interactively. See how Bitcoin, Git, and IPFS use them." />
        <meta property="og:site_name" content="Hash Explained" />
        <meta property="og:image" content="https://hashexplained.com/social.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Merkle Tree Explorer - Interactive Visualization" />
        <meta name="twitter:description" content="Build, tamper, and verify Merkle trees interactively." />
        <meta name="twitter:image" content="https://hashexplained.com/social.png" />
      </Helmet>

      <div className="flex-1 flex flex-col relative min-w-0">

        {/* Top Controls */}
        <div className="border-b border-gray-800 flex items-center justify-between px-3 lg:px-5 bg-gray-900/30 z-20 shrink-0">
          {/* Mode chips (mobile) */}
          <div className="flex gap-1.5 lg:hidden">
            {['explore', 'tamper', 'proof'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'px-2 py-1 text-[11px] font-bold rounded border transition-colors capitalize',
                  mode === m
                    ? m === 'tamper' ? 'bg-red-950/30 border-red-500/40 text-red-400'
                      : m === 'proof' ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400'
                    : 'border-transparent text-gray-500',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-500 font-mono hidden sm:block">
                {currentSystem.leafLabel}s:
              </span>
              <button
                onClick={removeLeaves}
                disabled={leaves.length <= 2}
                className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors text-gray-300"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <span className="font-mono font-bold w-5 text-center text-sm text-white">{leaves.length}</span>
              <button
                onClick={addLeaves}
                disabled={leaves.length >= 8}
                className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 transition-colors text-gray-300"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l4.993-4.993" />
              </svg>
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Mobile step controls */}
        {mode === 'explore' && (
          <div className="lg:hidden flex items-center justify-between px-4 py-1.5 border-b border-gray-800 bg-gray-900/20 shrink-0">
            <span className={cn('text-xs font-bold font-mono', currentSystem.accentText)}>
              Step {activeStep} / {maxLevel}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="p-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={() => setActiveStep(Math.min(maxLevel, activeStep + 1))}
                disabled={activeStep === maxLevel}
                className={cn('p-1.5 rounded disabled:opacity-40 text-gray-300', currentSystem.accentBg)}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Tree + Leaf Data — fills remaining space, centered */}
        <div className="flex-1 relative merkle-tree-bg flex flex-col min-h-0">

          {/* System Tabs — floating inside tree area */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gray-900/80 backdrop-blur-sm rounded-xl p-1.5 border border-gray-800/80">
              {SYSTEMS.map((sys) => {
                const active = systemId === sys.id;
                return (
                  <button
                    key={sys.id}
                    onClick={() => setSystemId(sys.id)}
                    className={cn(
                      'flex items-center gap-2.5 px-5 py-2.5 rounded-lg transition-all border',
                      active
                        ? cn(sys.accentText, sys.accentBg, sys.accentBorder, 'shadow-lg')
                        : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800/60',
                    )}
                  >
                    <span className={cn(
                      'text-xl leading-none',
                      active ? '' : 'opacity-50',
                    )}>{sys.symbol}</span>
                    <span className="text-sm font-bold tracking-wide">{sys.name}</span>
                  </button>
                );
              })}
            </div>
            <p className={cn('text-xs font-medium tracking-wide', currentSystem.accentText, 'opacity-70')}>
              {currentSystem.tagline}
            </p>
          </div>

          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center px-4 lg:px-6 relative min-h-0"
          >
            <TreeConnections
              tree={tree}
              containerRef={containerRef}
              tamperedIds={tamperedIds}
              proofPathIds={proof.pathIds}
              visibleLevel={mode === 'explore' ? activeStep : maxLevel}
            />

            {tree.length > 0 && (
              <SubTree
                nodeId={tree[tree.length - 1][0].id}
                nodeMap={nodeMap}
                rootLevel={rootLevel}
                mode={mode}
                activeStep={activeStep}
                tamperedIds={tamperedIds}
                proof={proof}
                selectedLeafForProof={selectedLeafForProof}
                selectedNodeId={selectedNodeId}
                currentSystem={currentSystem}
                handleNodeClick={handleNodeClick}
                updateLeaf={updateLeaf}
              />
            )}
          </div>

        </div>
      </div>

      <MerkleSidebar
        systemId={systemId}
        setSystemId={setSystemId}
        currentSystem={currentSystem}
        mode={mode}
        setMode={setMode}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        maxLevel={maxLevel}
      />

      <HashExplainer
        selectedNode={selectedNode}
        leftChild={leftChild}
        rightChild={rightChild}
        system={currentSystem}
        onClose={() => setSelectedNodeId(null)}
      />
    </div>
  );
}
