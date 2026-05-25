import { useEffect, useMemo, useState } from 'react';
import { loadGameData } from './data/loader';
import { pickDefaultRecipe, solve, type SolveInput } from './solver/solver';
import type { GameData } from './types';
import { ItemPicker } from './components/ItemPicker';
import { ProductionGraph } from './components/ProductionGraph';
import { RecipePickerModal } from './components/RecipePickerModal';
import { SummaryPanel } from './components/SummaryPanel';

const DEFAULT_TARGET = 'Desc_ModularFrame_C';
const DEFAULT_RATE = 10;

export function App() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [targetItem, setTargetItem] = useState(DEFAULT_TARGET);
  const [targetRate, setTargetRate] = useState(DEFAULT_RATE);
  const [recipeChoices, setRecipeChoices] = useState<Record<string, string>>({});
  const [pinnedRaw, setPinnedRaw] = useState<Record<string, boolean>>({});
  const [allowAlternates, setAllowAlternates] = useState(false);

  const [pickerForItem, setPickerForItem] = useState<string | null>(null);

  useEffect(() => {
    loadGameData()
      .then((d) => {
        setGameData(d);
        if (!d.items[DEFAULT_TARGET]) {
          // Fall back to first non-raw item if our default isn't present.
          const fallback = d.allItems.find((cn) => !d.rawItems.has(cn));
          if (fallback) setTargetItem(fallback);
        }
      })
      .catch((e) => setError(String(e)));
  }, []);

  const solveInput: SolveInput | null = useMemo(() => {
    if (!gameData) return null;
    return {
      targetItem,
      targetRate,
      recipeChoices,
      pinnedRaw,
      allowAlternates,
    };
  }, [gameData, targetItem, targetRate, recipeChoices, pinnedRaw, allowAlternates]);

  const solution = useMemo(() => {
    if (!gameData || !solveInput) return null;
    return solve(gameData, solveInput);
  }, [gameData, solveInput]);

  if (error) {
    return (
      <div className="p-6 text-red-300">
        Failed to load game data: {error}
      </div>
    );
  }
  if (!gameData || !solution) {
    return <div className="p-6 text-slate-400">Loading game data…</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="px-4 py-3 border-b border-border bg-panel flex items-center gap-6">
        <div className="text-lg font-semibold text-accent">Satisfactory Dependencies</div>
        <div className="text-xs text-slate-400">
          {gameData.allItems.length} items · {Object.keys(gameData.recipes).length} recipes
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-72 border-r border-border bg-panel p-4 overflow-y-auto shrink-0 space-y-4">
          <ItemPicker
            gameData={gameData}
            value={targetItem}
            onChange={(v) => {
              setTargetItem(v);
              // Reset per-item choices when we switch targets so the new tree starts clean.
              setRecipeChoices({});
              setPinnedRaw({});
            }}
          />

          <div>
            <label className="text-xs uppercase tracking-wide text-slate-400 block mb-1">
              Target rate (items/min)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={targetRate}
              onChange={(e) => setTargetRate(Number(e.target.value) || 0)}
              className="w-full bg-panel2 border border-border rounded px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowAlternates}
              onChange={(e) => setAllowAlternates(e.target.checked)}
            />
            Prefer alternate recipes as default
          </label>

          {Object.keys(recipeChoices).length > 0 && (
            <button
              className="text-xs text-accent2 hover:underline"
              onClick={() => setRecipeChoices({})}
            >
              Reset recipe overrides ({Object.keys(recipeChoices).length})
            </button>
          )}
          {Object.keys(pinnedRaw).length > 0 && (
            <button
              className="text-xs text-accent2 hover:underline block"
              onClick={() => setPinnedRaw({})}
            >
              Clear pinned raw items ({Object.keys(pinnedRaw).length})
            </button>
          )}

          <hr className="border-border" />

          <SummaryPanel solution={solution} gameData={gameData} />
        </aside>

        <main className="flex-1 min-w-0 bg-bg">
          <ProductionGraph
            solution={solution}
            gameData={gameData}
            onPickAlternate={(itemClass) => setPickerForItem(itemClass)}
            onPinRaw={(itemClass) =>
              setPinnedRaw((prev) => ({ ...prev, [itemClass]: true }))
            }
            onUnpinRaw={(itemClass) =>
              setPinnedRaw((prev) => {
                const next = { ...prev };
                delete next[itemClass];
                return next;
              })
            }
          />
        </main>
      </div>

      {pickerForItem && (
        <RecipePickerModal
          gameData={gameData}
          itemClass={pickerForItem}
          currentRecipe={
            recipeChoices[pickerForItem] ??
            pickDefaultRecipe(gameData, pickerForItem, allowAlternates)
          }
          onPick={(rk) => {
            setRecipeChoices((prev) => ({ ...prev, [pickerForItem]: rk }));
            setPickerForItem(null);
          }}
          onClose={() => setPickerForItem(null)}
        />
      )}
    </div>
  );
}
