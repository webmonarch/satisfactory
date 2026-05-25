import { Handle, Position } from '@xyflow/react';
import type { GameData } from '../types';
import type { RecipeNode as RecipeNodeData } from '../solver/solver';

interface Props {
  data: {
    node: RecipeNodeData;
    gameData: GameData;
    onPickAlternate: (itemClass: string) => void;
    onPinRaw: (itemClass: string) => void;
  };
}

function fmt(n: number) {
  if (n >= 100) return n.toFixed(1);
  if (n >= 10) return n.toFixed(2);
  return n.toFixed(3);
}

export function RecipeNode({ data }: Props) {
  const { node, gameData, onPickAlternate, onPinRaw } = data;
  const recipe = node.recipe;
  const building = gameData.buildings[node.buildingKey];
  const primary = gameData.items[node.primaryOutputItem];
  const hasAlternates = (gameData.producersByItem[node.primaryOutputItem] ?? []).length > 1;

  return (
    <div className="bg-panel border border-border rounded-md w-[280px] shadow-lg">
      <Handle type="target" position={Position.Left} className="!bg-accent2" />
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400">
            {building?.name ?? node.buildingKey}
          </div>
          <div className="font-semibold text-slate-100 truncate">{primary?.name ?? node.primaryOutputItem}</div>
          {recipe.alternate && (
            <div className="text-[10px] text-accent uppercase">Alternate: {recipe.name}</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-accent">×{fmt(node.machineCount)}</div>
          <div className="text-[10px] text-slate-400">{fmt(node.power)} MW</div>
        </div>
      </div>

      <div className="px-3 py-2 text-xs space-y-1">
        <div className="text-slate-400 uppercase text-[10px]">In</div>
        {node.inputs.map((ing) => (
          <div key={ing.item} className="flex justify-between gap-2">
            <span className="truncate">{gameData.items[ing.item]?.name ?? ing.item}</span>
            <span className="text-slate-300 tabular-nums">{fmt(ing.rate)}/min</span>
          </div>
        ))}
        <div className="text-slate-400 uppercase text-[10px] pt-1">Out</div>
        {node.outputs.map((p) => (
          <div key={p.item} className="flex justify-between gap-2">
            <span className="truncate">{gameData.items[p.item]?.name ?? p.item}</span>
            <span className="text-slate-300 tabular-nums">{fmt(p.rate)}/min</span>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-border flex gap-2 text-[11px]">
        {hasAlternates && (
          <button
            className="text-accent2 hover:underline"
            onClick={() => onPickAlternate(node.primaryOutputItem)}
          >
            Swap recipe
          </button>
        )}
        <button
          className="text-slate-400 hover:underline"
          onClick={() => onPinRaw(node.primaryOutputItem)}
        >
          Stop here
        </button>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-accent" />
    </div>
  );
}
