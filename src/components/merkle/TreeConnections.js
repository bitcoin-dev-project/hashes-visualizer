import React, { useEffect, useState } from 'react';

export default function TreeConnections({
  tree,
  containerRef,
  tamperedIds,
  proofPathIds,
  visibleLevel,
}) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const updateLines = () => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLines = [];

      setTimeout(() => {
        tree.forEach((level, lIndex) => {
          if (lIndex >= visibleLevel) return;

          level.forEach((node) => {
            if (!node.leftId || !node.rightId) return;

            const parentEl = document.getElementById(`node-${node.id}`);
            const leftEl = document.getElementById(`node-${node.leftId}`);
            const rightEl = document.getElementById(`node-${node.rightId}`);

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
                id: `${node.id}-${node.leftId}`,
                x1: pX, y1: pY, x2: lX, y2: lY,
                state: leftState,
              });
              newLines.push({
                id: `${node.id}-${node.rightId}`,
                x1: pX, y1: pY, x2: rX, y2: rY,
                state: rightState,
              });
            }
          });
        });
        setLines(newLines);
      }, 60);
    };

    updateLines();
    window.addEventListener('resize', updateLines);
    return () => window.removeEventListener('resize', updateLines);
  }, [tree, containerRef, tamperedIds, proofPathIds, visibleLevel]);

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
        let opacity = 1;

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
            opacity={opacity}
            className="transition-all duration-500 ease-in-out"
          />
        );
      })}
    </svg>
  );
}
