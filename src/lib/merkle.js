// FNV-1a 32-bit hash — produces nice 8-char hex strings for visualization
export function simHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function buildMerkleTree(leaves) {
  if (leaves.length === 0) return [];

  const levels = [];

  // Level 0: hash each leaf
  const l0 = leaves.map((val, i) => ({
    id: `L0-${i}`,
    level: 0,
    index: i,
    value: val,
    hash: simHash(val),
  }));
  levels.push(l0);

  let currentLevel = l0;
  let levelNum = 1;

  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : currentLevel[i];

      const combinedHash = simHash(left.hash + right.hash);
      nextLevel.push({
        id: `L${levelNum}-${Math.floor(i / 2)}`,
        level: levelNum,
        index: Math.floor(i / 2),
        hash: combinedHash,
        leftId: left.id,
        rightId: right.id,
        isDuplicate: i + 1 >= currentLevel.length,
      });
    }
    levels.push(nextLevel);
    currentLevel = nextLevel;
    levelNum++;
  }

  return levels;
}

export function getMerkleProof(levels, leafIndex) {
  const pathIds = new Set();
  const siblingIds = new Set();

  let currentIndex = leafIndex;

  for (let i = 0; i < levels.length - 1; i++) {
    const level = levels[i];
    const node = level[currentIndex];
    pathIds.add(node.id);

    const isRightChild = currentIndex % 2 === 1;
    const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;

    const actualSiblingIndex = siblingIndex < level.length ? siblingIndex : currentIndex;
    siblingIds.add(level[actualSiblingIndex].id);

    currentIndex = Math.floor(currentIndex / 2);
  }

  // Add root to path
  if (levels.length > 0) {
    pathIds.add(levels[levels.length - 1][0].id);
  }

  return { pathIds, siblingIds };
}
