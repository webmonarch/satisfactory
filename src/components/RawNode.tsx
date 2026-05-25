import { Handle, Position } from '@xyflow/react';
import type { GameData } from '../types';
import type { RawNode as RawNodeData } from '../solver/solver';

interface Props {
  data: {
    node: RawNodeData;
    gameData: GameData;
    isCycleCut: boolean;
    isUnresolved: boolean;
    onUnpin?: (itemClass: string) => void;
  };
}

function fmt(n: number) {
  if (n >= 100) return n.toFixed(1);
  if (n >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

export function RawNode({ data }: Props) {
  const { node, gameData, isCycleCut, isUnresolved, onUnpin } = data;
  const item = gameData.items[node.item];
  const isResource = gameData.rawItems.has(node.item);

  let label = 'Raw resource';
  let color = 'border-raw';
  if (isCycleCut) {
    label = 'Cycle break';
    color = 'border-yellow-500';
  } else if (isUnresolved) {
    label = 'No recipe';
    color = 'border-red-500';
  } else if (!isResource) {
    label = 'Pinned input';
    color = 'border-accent2';
  }

  return (
    <div className={`bg-panel2 border ${color} rounded-md w-[200px] shadow`}>
      <div className="px-3 py-2">
        <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
        <div className="font-semibold text-slate-100 truncate">{item?.name ?? node.item}</div>
        <div className="text-sm text-raw tabular-nums">{fmt(node.rate)}/min</div>
        {!isResource && !isCycleCut && !isUnresolved && onUnpin && (
          <button
            className="text-[11px] text-accent2 hover:underline mt-1"
            onClick={() => onUnpin(node.item)}
          >
            Expand recipe
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-raw" />
    </div>
  );
}
