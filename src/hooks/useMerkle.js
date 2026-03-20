import { useState, useMemo, useEffect, useRef } from 'react';
import { buildMerkleTree, getMerkleProof } from '../lib/merkle';
import { getSystem } from '../lib/systems';

export function useMerkle() {
  const [systemId, setSystemIdState] = useState('bitcoin');
  const currentSystem = useMemo(() => getSystem(systemId), [systemId]);

  const [leaves, setLeaves] = useState(currentSystem.defaultLeaves);
  const [baselineLeaves, setBaselineLeaves] = useState(currentSystem.defaultLeaves);
  const [mode, setMode] = useState('explore');
  const [activeStep, setActiveStep] = useState(0);
  const [selectedLeafForProof, setSelectedLeafForProof] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  function setSystemId(id) {
    const sys = getSystem(id);
    setSystemIdState(id);
    setLeaves(sys.defaultLeaves);
    setBaselineLeaves(sys.defaultLeaves);
    setMode('explore');
    setSelectedLeafForProof(null);
    setSelectedNodeId(null);
  }

  const tree = useMemo(() => buildMerkleTree(leaves), [leaves]);
  const baselineTree = useMemo(() => buildMerkleTree(baselineLeaves), [baselineLeaves]);

  // Track hash changes for cascade animation
  const prevHashRef = useRef(new Map());
  const [cascadeGen, setCascadeGen] = useState(0);
  const cascadeMap = useMemo(() => {
    const changed = new Map();
    const prev = prevHashRef.current;
    const next = new Map();
    tree.forEach((level) => {
      level.forEach((node) => {
        next.set(node.id, node.hash);
        if (prev.has(node.id) && prev.get(node.id) !== node.hash) {
          changed.set(node.id, node.level);
        }
      });
    });
    prevHashRef.current = next;
    return changed;
  }, [tree]);

  useEffect(() => {
    if (cascadeMap.size > 0) setCascadeGen((g) => g + 1);
  }, [cascadeMap]);

  const proof = useMemo(() => {
    if (mode === 'proof' && selectedLeafForProof !== null) {
      return getMerkleProof(tree, selectedLeafForProof);
    }
    return { pathIds: new Set(), siblingIds: new Set() };
  }, [mode, selectedLeafForProof, tree]);

  const tamperedIds = useMemo(() => {
    const ids = new Set();
    if (mode === 'tamper') {
      tree.forEach((level, lIndex) => {
        level.forEach((node, nIndex) => {
          const baselineNode = baselineTree[lIndex]?.[nIndex];
          if (!baselineNode || node.hash !== baselineNode.hash) {
            ids.add(node.id);
          }
        });
      });
    }
    return ids;
  }, [mode, tree, baselineTree]);

  const updateLeaf = (index, val) => {
    const newLeaves = [...leaves];
    newLeaves[index] = val;
    setLeaves(newLeaves);
    if (mode !== 'tamper') {
      setBaselineLeaves(newLeaves);
    }
  };

  const tamperLeaf = (index) => {
    setMode('tamper');
    const newLeaves = [...leaves];
    newLeaves[index] = newLeaves[index].includes('*')
      ? newLeaves[index].replace('*', '')
      : newLeaves[index] + '*';
    setLeaves(newLeaves);
  };

  const addLeaves = () => {
    if (leaves.length >= 8) return;
    const sys = currentSystem;
    const idx = leaves.length;
    const newLeaves = [
      ...leaves,
      sys.defaultLeaves[idx] ?? `${sys.leafLabel} ${idx + 1}`,
      sys.defaultLeaves[idx + 1] ?? `${sys.leafLabel} ${idx + 2}`,
    ];
    setLeaves(newLeaves);
    setBaselineLeaves(newLeaves);
  };

  const removeLeaves = () => {
    if (leaves.length <= 2) return;
    const newLeaves = leaves.slice(0, -2);
    setLeaves(newLeaves);
    setBaselineLeaves(newLeaves);
    if (selectedLeafForProof !== null && selectedLeafForProof >= newLeaves.length) {
      setSelectedLeafForProof(0);
    }
  };

  const reset = () => {
    const sys = currentSystem;
    setLeaves(sys.defaultLeaves);
    setBaselineLeaves(sys.defaultLeaves);
    setMode('explore');
    setActiveStep(tree.length - 1);
    setSelectedLeafForProof(null);
    setSelectedNodeId(null);
  };

  useEffect(() => {
    if (mode === 'explore') {
      setActiveStep(tree.length - 1);
    }
  }, [tree.length, mode]);

  return {
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
    cascadeMap,
    cascadeGen,
    updateLeaf,
    tamperLeaf,
    addLeaves,
    removeLeaves,
    reset,
    maxLevel: tree.length - 1,
  };
}
