import React, { useEffect, useState, useRef, useCallback } from 'react';

export default function TreeConnections({
  tree,
  containerRef,
  scrollRef,
  tamperedIds,
  proofPathIds,
  visibleLevel,
  nodeMap,
}) {
  const [lines, setLines] = useState([]);
  const rafRef = useRef(null);

  const computeLines = useCallback(() => {
    if (!containerRef.current || tree.length === 0) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = [];

    // Walk the tree recursively using the same renderKey scheme as SubTree
    function walk(nodeId, renderKey) {
      const entry = nodeMap.get(nodeId);
      if (!entry) return;
      const { node } = entry;

      if (node.level > visibleLevel) return;
      if (!node.leftId || !node.rightId) return;

      const leftEntry = nodeMap.get(node.leftId);
      const rightEntry = nodeMap.get(node.rightId);
      if (!leftEntry || !rightEntry) return;
      if (leftEntry.node.level > visibleLevel) return;

      const leftKey = `${renderKey}-0`;
      const rightKey = `${renderKey}-1`;

      const parentEl = document.getElementById(`node-${renderKey}`);
      const leftEl = document.getElementById(`node-${leftKey}`);
      const rightEl = document.getElementById(`node-${rightKey}`);

      if (parentEl && leftEl && rightEl) {
        const pRect = parentEl.getBoundingClientRect();
        const lRect = leftEl.getBoundingClientRect();
        const rRect = rightEl.getBoundingClientRect();

        const pX = pRect.left + pRect.width / 2 - containerRect.left;
        const pY = pRect.bottom - containerRect.top;
        const lX = lRect.left + lRect.width / 2 - containerRect.left;
        const lY = lRect.top - containerRect.top;
        const rX = rRect.left + rRect.width / 2 - containerRect.left;
        const rY = rRect.top - containerRect.top;

        let leftState = 'normal';
        if (tamperedIds.has(node.id) && tamperedIds.has(node.leftId)) leftState = 'tampered';
        if (proofPathIds.has(node.id) && proofPathIds.has(node.leftId)) leftState = 'proof';

        let rightState = 'normal';
        if (tamperedIds.has(node.id) && tamperedIds.has(node.rightId)) rightState = 'tampered';
        if (proofPathIds.has(node.id) && proofPathIds.has(node.rightId)) rightState = 'proof';

        newLines.push({
          id: `${renderKey}-L`,
          x1: pX, y1: pY, x2: lX, y2: lY,
          state: leftState,
        });
        newLines.push({
          id: `${renderKey}-R`,
          x1: pX, y1: pY, x2: rX, y2: rY,
          state: rightState,
        });
      }

      walk(node.leftId, leftKey);
      walk(node.rightId, rightKey);
    }

    const rootId = tree[tree.length - 1][0].id;
    walk(rootId, 'R');

    setLines(newLines);
  }, [tree, nodeMap, containerRef, tamperedIds, proofPathIds, visibleLevel]);

  useEffect(() => {
    // Follow animation frames for ~700ms for smooth tracking
    let start = performance.now();
    const tick = () => {
      computeLines();
      if (performance.now() - start < 700) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    window.addEventListener('resize', computeLines);
    const scrollEl = scrollRef?.current;
    if (scrollEl) scrollEl.addEventListener('scroll', computeLines);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', computeLines);
      if (scrollEl) scrollEl.removeEventListener('scroll', computeLines);
    };
  }, [computeLines, scrollRef]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <linearGradient id="merkle-tampered-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="merkle-proof-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {lines.map((line) => {
        const midY = (line.y1 + line.y2) / 2;
        const d = `M ${line.x1} ${line.y1} C ${line.x1} ${midY}, ${line.x2} ${midY}, ${line.x2} ${line.y2}`;

        let strokeColor = 'rgba(75, 85, 99, 0.4)';
        let strokeWidth = 1.5;

        if (line.state === 'tampered') {
          strokeColor = 'url(#merkle-tampered-grad)';
          strokeWidth = 3;
        } else if (line.state === 'proof') {
          strokeColor = 'url(#merkle-proof-grad)';
          strokeWidth = 3;
        }

        return (
          <path
            key={line.id}
            d={d}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="transition-all duration-500 ease-in-out"
          />
        );
      })}
    </svg>
  );
}
