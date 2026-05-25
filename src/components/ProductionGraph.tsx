import { useMemo } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { GameData } from '../types';
import type { Solution } from '../solver/solver';
import { RecipeNode } from './RecipeNode';
import { RawNode } from './RawNode';
import { layoutNodes } from './layout';

const nodeTypes = { recipe: RecipeNode, raw: RawNode };

interface Props {
  solution: Solution;
  gameData: GameData;
  onPickAlternate: (itemClass: string) => void;
  onPinRaw: (itemClass: string) => void;
  onUnpinRaw: (itemClass: string) => void;
}

function fmt(n: number) {
  if (n >= 100) return n.toFixed(1);
  if (n >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

export function ProductionGraph({
  solution,
  gameData,
  onPickAlternate,
  onPinRaw,
  onUnpinRaw,
}: Props) {
  const { nodes, edges } = useMemo(() => {
    const positions = layoutNodes(solution);
    const nodes: Node[] = [];
    for (const rn of solution.recipeNodes.values()) {
      nodes.push({
        id: rn.id,
        type: 'recipe',
        position: positions.get(rn.id) ?? { x: 0, y: 0 },
        data: { node: rn, gameData, onPickAlternate, onPinRaw },
      });
    }
    for (const raw of solution.rawNodes.values()) {
      nodes.push({
        id: raw.id,
        type: 'raw',
        position: positions.get(raw.id) ?? { x: 0, y: 0 },
        data: {
          node: raw,
          gameData,
          isCycleCut: solution.cycleCuts.has(raw.item),
          isUnresolved: solution.unresolved.has(raw.item),
          onUnpin: onUnpinRaw,
        },
      });
    }

    // Dedupe edges by (source, target, item) and sum rates.
    const edgeMap = new Map<string, { source: string; target: string; item: string; rate: number }>();
    for (const e of solution.edges) {
      if (e.target === 'sink:final') continue; // virtual sink not rendered
      const key = `${e.source}->${e.target}:${e.item}`;
      const existing = edgeMap.get(key);
      if (existing) existing.rate += e.rate;
      else edgeMap.set(key, { ...e });
    }

    const edges: Edge[] = [...edgeMap.values()].map((e, idx) => ({
      id: `e${idx}`,
      source: e.source,
      target: e.target,
      label: `${gameData.items[e.item]?.name ?? e.item} · ${fmt(e.rate)}/min`,
      labelStyle: { fill: '#cbd5e1', fontSize: 10 },
      labelBgStyle: { fill: '#0f1115', fillOpacity: 0.8 },
      style: { stroke: '#5dc1ff', strokeWidth: 1.5 },
      animated: false,
    }));

    return { nodes, edges };
  }, [solution, gameData, onPickAlternate, onPinRaw, onUnpinRaw]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
      minZoom={0.1}
      maxZoom={2}
    >
      <Background color="#2a2f3d" gap={24} />
      <Controls className="!bg-panel !border-border" />
      <MiniMap className="!bg-panel" nodeColor="#5dc1ff" maskColor="rgba(0,0,0,0.6)" />
    </ReactFlow>
  );
}
