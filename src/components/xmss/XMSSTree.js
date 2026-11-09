import React, { useEffect, useRef } from 'react';
import { shortHash } from '../../lib/xmss';

export default function XMSSTree({ tree, selected, inspection, onInspect, phase, trace, step, signature }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    const canvas = scrollRef.current;
    if (canvas) canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2);
  }, [tree.height]);
  const activeIndex = phase === 'verify' && signature ? signature.index : selected;
  const isVerifying = phase === 'verify' && trace;
  const reached = isVerifying ? Math.min(tree.height, step - 2) : tree.height;
  const width = 960;
  const bottom = tree.height === 4 ? 350 : 310;
  const top = 58;
  const position = (level, index) => ({
    x: 58 + (index + 0.5) * (width - 116) / tree.levels[level].length,
    y: bottom - level * (bottom - top) / tree.height,
  });
  const pathIndex = level => activeIndex >>> level;
  const isPath = (level, index) => index === pathIndex(level);
  const isSibling = (level, index) => level < tree.height && index === (pathIndex(level) ^ 1);
  const final = isVerifying && step === tree.height + 3;
  function shownHash(level, index, original) {
    if (isVerifying && isSibling(level, index)) return trace.steps[level].sibling;
    if (!isVerifying || !isPath(level, index) || reached < level) return original;
    return level === 0 ? trace.leaf : trace.steps[level - 1].parent;
  }

  return (
    <div ref={scrollRef} className="xm-tree-scroll" tabIndex="0" role="region" aria-label="Interactive XMSS tree; scroll horizontally on small screens">
      <svg className={`xm-tree xm-tree-${tree.height}`} viewBox={`0 0 ${width} ${bottom + 90}`} aria-label={`XMSS tree with ${2 ** tree.height} one-time keys. Select a node to inspect it.`} role="group">
        <defs>
          <pattern id="xm-dot-grid" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.65" fill="currentColor" /></pattern>
        </defs>
        <rect width={width} height={bottom + 90} fill="url(#xm-dot-grid)" className="xm-grid-dots" />
        {tree.levels.slice(0, -1).map((nodes, level) => nodes.map((_, index) => {
          const child = position(level, index), parent = position(level + 1, index >>> 1);
          const path = isPath(level, index);
          const sibling = isSibling(level, index);
          const visited = !isVerifying || reached > level;
          return <path key={`edge-${level}-${index}`} d={`M${child.x},${child.y - 13} C${child.x},${(child.y + parent.y) / 2} ${parent.x},${(child.y + parent.y) / 2} ${parent.x},${parent.y + 13}`}
            className={`xm-tree-edge ${path && visited ? 'is-path' : ''} ${sibling ? 'is-proof' : ''} ${final && !trace.valid && path ? 'is-invalid' : ''}`} />;
        }))}
        {tree.levels.map((nodes, level) => nodes.map((hash, index) => {
          const p = position(level, index);
          const path = isPath(level, index), sibling = isSibling(level, index);
          const used = level === 0 && tree.usedLeaves.has(index);
          const visited = path && reached >= level;
          const inspected = inspection.level === level && inspection.index === index;
          const root = level === tree.height;
          const nodeWidth = root ? 150 : level === 0 ? (tree.height === 4 ? 43 : 70) : 89;
          const value = shownHash(level, index, hash);
          const changedProof = isVerifying && sibling && value !== hash;
          const rootLabel = isVerifying && reached >= tree.height ? 'Reconstructed root' : 'Public root';
          const label = level === 0 ? `One-time key ${index}, ${used ? 'used' : 'available'}` : `${root ? rootLabel : `Level ${level}, node ${index}`}, hash ${value}`;
          return (
            <g key={`node-${level}-${index}`} transform={`translate(${p.x} ${p.y})`} role="button" tabIndex="0" aria-label={label}
              aria-pressed={inspected} onClick={() => onInspect(level, index)} onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onInspect(level, index); }
              }} className={`xm-tree-node ${root ? 'is-root' : ''} ${level === 0 ? 'is-leaf' : ''} ${visited ? 'is-active' : ''} ${sibling ? 'is-sibling' : ''} ${changedProof ? 'is-corrupted' : ''} ${used ? 'is-used' : ''} ${inspected ? 'is-inspected' : ''} ${final && !trace.valid && root ? 'is-invalid' : ''}`}>
              <title>{label}</title>
              {root && <text y="-33" textAnchor="middle" className="xm-root-caption">{isVerifying && reached >= tree.height ? 'RECONSTRUCTED ROOT' : 'ONE PUBLIC ROOT'}</text>}
              <rect x={-nodeWidth / 2 - 5} y="-31" width={nodeWidth + 10} height="62" fill="transparent" />
              <rect className="xm-node-halo" x={-nodeWidth / 2 - 4} y="-22" width={nodeWidth + 8} height="44" rx="11" />
              <rect className="xm-node-body" x={-nodeWidth / 2} y="-18" width={nodeWidth} height="36" rx="7" />
              {level === 0 ? <>
                {tree.height < 4 && <g className="xm-key-glyph" transform="translate(-19 -5)"><path d="M0 0h9M0 5h9M0 10h9" /></g>}
                <text x={tree.height === 4 ? 0 : 10} y="5" textAnchor="middle" className="xm-node-index">{String(index).padStart(2, '0')}</text>
                <text y="38" textAnchor="middle" className={`xm-leaf-status ${used ? 'is-used' : ''}`}>{used ? 'USED' : path ? 'SELECTED' : 'FRESH'}</text>
                {used && <path className="xm-used-tick" d={`M${nodeWidth / 2 - 5} -20l3 3 5-6`} />}
              </> : <text y="4" textAnchor="middle" className="xm-node-hash">{shortHash(value, root ? 12 : 8)}</text>}
              {sibling && <circle className="xm-proof-dot" cx={nodeWidth / 2 - 2} cy="-17" r="4" />}
            </g>
          );
        }))}
        <text x="58" y={bottom + 78} className="xm-tree-footnote">{2 ** tree.height} ONE-TIME KEYS</text>
        <text x="902" y={bottom + 78} textAnchor="end" className="xm-tree-footnote">CLICK ANY NODE TO INSPECT</text>
      </svg>
    </div>
  );
}
